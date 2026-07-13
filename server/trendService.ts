import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertHealthTrend, InsertTrendAlert } from "@shared/schema";
import { getOpenAIConfig } from "./openaiConfig";

const openai = new OpenAI(getOpenAIConfig());

const SPIKE_THRESHOLD = 150;

interface TrendItem {
  keyword: string;
  keywordAr: string;
  category: string;
  trendScore: number;
  trendStrength: "low" | "medium" | "high" | "very_high";
  searchVolume: number;
  weeklyChange: number;
  region: string;
  articleSuggestions: string[];
  aiContext: string;
}

interface GoogleTrendResult {
  keyword: string;
  value: number;
}

interface EnrichedTrend extends GoogleTrendResult {
  keywordAr: string;
  weeklyChange: number;
  searchVolume: number;
  articleSuggestions: string[];
  aiContext: string;
  category: string;
}

// Health-related keyword seeds used to fetch real trend data from Google Trends
const SAUDI_HEALTH_SEEDS = [
  "السكري", "ضغط الدم", "الكوليسترول", "السرطان", "الربو",
  "الاكتئاب", "النوم", "التغذية", "السمنة", "ألم الظهر",
  "صحة القلب", "المناعة", "الفيتامينات", "الصحة النفسية", "حساسية الأنف",
  "diabetes", "blood pressure", "cancer", "mental health", "nutrition",
];

const HEALTH_CATEGORY_MAP: Record<string, string> = {
  "قلب": "heart", "سكري": "diabetes", "ضغط": "blood_pressure",
  "سرطان": "cancer", "نفسي": "mental_health", "نفسية": "mental_health",
  "وزن": "weight", "تغذية": "nutrition", "دواء": "medication",
  "حساسية": "allergy", "ربو": "respiratory", "نوم": "sleep",
  "عظام": "bones", "كبد": "liver", "كلى": "kidney",
  "رياضة": "fitness", "فيتامين": "vitamins", "لقاح": "vaccination",
  "مناعة": "immunity", "كوليسترول": "cholesterol", "سمنة": "weight",
  "heart": "heart", "diabetes": "diabetes", "cancer": "cancer",
  "mental": "mental_health", "nutrition": "nutrition", "sleep": "sleep",
  "pressure": "blood_pressure", "cholesterol": "cholesterol",
};

function detectCategory(keyword: string): string {
  const lower = keyword.toLowerCase();
  for (const [term, cat] of Object.entries(HEALTH_CATEGORY_MAP)) {
    if (lower.includes(term.toLowerCase())) return cat;
  }
  return "general";
}

function scoreToStrength(score: number): "low" | "medium" | "high" | "very_high" {
  if (score >= 80) return "very_high";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

// Fetch real trending data from Google Trends for Saudi Arabia
async function fetchGoogleTrends(region: string = "SA"): Promise<GoogleTrendResult[]> {
  try {
    // Dynamic import to handle CommonJS module
    const googleTrends = await import("google-trends-api");
    const api = (googleTrends as unknown as { default: typeof googleTrends }).default ?? googleTrends;

    const results: GoogleTrendResult[] = [];
    const seen = new Set<string>();

    // Query batches of health seeds to get real trending data
    const batches = [SAUDI_HEALTH_SEEDS.slice(0, 5), SAUDI_HEALTH_SEEDS.slice(5, 10)];

    for (const batch of batches) {
      try {
        const raw: string = await api.interestOverTime({
          keyword: batch,
          geo: region,
          startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
        });
        const parsed = JSON.parse(raw);
        const timelineData: Array<{ formattedValue: string[]; date: string }> =
          parsed?.default?.timelineData ?? [];

        if (timelineData.length > 0) {
          const last = timelineData[timelineData.length - 1];
          batch.forEach((kw, idx) => {
            const val = parseInt(last.formattedValue?.[idx] ?? "0", 10);
            if (!seen.has(kw) && val > 0) {
              seen.add(kw);
              results.push({ keyword: kw, value: val });
            }
          });
        }
      } catch {
        // partial failure is acceptable — continue with other batches
      }
    }

    // Also try daily trends to get truly rising topics
    try {
      const daily: string = await api.dailyTrends({ geo: region });
      const dailyParsed = JSON.parse(daily);
      const trendingStories =
        dailyParsed?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];

      for (const story of trendingStories.slice(0, 10)) {
        const title: string = story?.title?.query ?? "";
        const traffic: string = story?.formattedTraffic ?? "1K+";
        const numericTraffic = parseInt(traffic.replace(/[^0-9]/g, ""), 10) * 1000;
        if (title && !seen.has(title)) {
          seen.add(title);
          results.push({ keyword: title, value: Math.min(100, Math.round(numericTraffic / 1000)) });
        }
      }
    } catch {
      // daily trends optional
    }

    return results;
  } catch (err) {
    console.warn("[TrendService] Google Trends fetch failed, falling back to AI-only mode:", (err as Error).message);
    return [];
  }
}

// Use AI to classify, translate, and enrich raw trend data
// Also generates purely AI-synthesized trends when Google Trends returns nothing
async function enrichTrendsWithAI(
  rawTrends: GoogleTrendResult[],
  region: string,
  count: number = 10
): Promise<EnrichedTrend[]> {
  const regionLabel = region === "SA" ? "السعودية" : region === "AE" ? "الإمارات" : "الخليج العربي";
  const currentMonth = new Date().toLocaleString("ar-SA", { month: "long", year: "numeric" });

  const hasRealData = rawTrends.length > 0;
  const realDataSection = hasRealData
    ? `بيانات Google Trends الفعلية لمنطقة ${regionLabel} (كلمة مفتاحية: قيمة الترند 0-100):\n${rawTrends.map(t => `- "${t.keyword}": ${t.value}`).join("\n")}\n\nمهمتك: استخدم هذه البيانات الحقيقية كأساس.`
    : `لم تتوفر بيانات Google Trends. ولّد بيانات واقعية مبنية على المعرفة بالاتجاهات الصحية الموسمية في ${regionLabel} خلال ${currentMonth}.`;

  const systemPrompt = `أنت محلل بيانات صحية متخصص في رصد الترندات في ${regionLabel}.

${realDataSection}

المطلوب: أنشئ قائمة بأبرز ${count} موضوع صحي رائج مع:
1. ترجمة أو تأكيد الكلمة المفتاحية بالعربية
2. تقييم إذا كانت صحية فعلاً (استبعد غير الصحية)
3. تقدير حجم البحث الشهري ونسبة التغير الأسبوعي
4. مقترحات 3 عناوين مقالات جذابة
5. سياق مختصر لماذا هذا الموضوع رائج الآن

أرجع JSON بالشكل التالي:
{
  "trends": [
    {
      "keyword": "English or original keyword",
      "keywordAr": "الكلمة بالعربية",
      "isHealthRelated": true,
      "trendScore": 85,
      "searchVolume": 45000,
      "weeklyChange": 35,
      "category": "تصنيف من: diabetes/heart/mental_health/nutrition/cancer/respiratory/weight/sleep/general",
      "articleSuggestions": ["عنوان مقال 1", "عنوان مقال 2", "عنوان مقال 3"],
      "aiContext": "شرح قصير لسبب الترند"
    }
  ]
}

ملاحظات:
- فقط المواضيع الصحية (isHealthRelated: true)
- trendScore: من 0-100 بناءً على البيانات المتوفرة أو التقدير الواقعي
- weeklyChange: نسبة مئوية قد تكون سالبة
- يجب أن تكون العناوين بالعربية ومناسبة للنشر الصحفي`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `أنشئ قائمة الترندات الصحية لـ${regionLabel} في ${currentMonth}.` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed: { trends?: unknown[] } = JSON.parse(content);
    const rawList = Array.isArray(parsed.trends) ? parsed.trends : [];

    const enriched: EnrichedTrend[] = [];
    for (const item of rawList) {
      if (typeof item !== "object" || item === null) continue;
      const t = item as Record<string, unknown>;

      if (t.isHealthRelated === false) continue;

      const score = Math.min(100, Math.max(0, Number(t.trendScore ?? 50)));
      const keyword = String(t.keyword ?? "");
      const keywordAr = String(t.keywordAr ?? keyword);
      const rawChange = Number(t.weeklyChange ?? 0);
      const rawVolume = Number(t.searchVolume ?? 0);

      // Find matching real trend value if available
      const realMatch = rawTrends.find(
        (r) => r.keyword.toLowerCase() === keyword.toLowerCase() ||
               r.keyword.toLowerCase() === keywordAr.toLowerCase()
      );
      const finalScore = realMatch ? Math.max(score, realMatch.value) : score;

      const suggestions = Array.isArray(t.articleSuggestions)
        ? (t.articleSuggestions as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 3)
        : [];

      enriched.push({
        keyword,
        keywordAr,
        value: finalScore,
        weeklyChange: rawChange,
        searchVolume: rawVolume,
        articleSuggestions: suggestions,
        aiContext: typeof t.aiContext === "string" ? t.aiContext : "",
        category: typeof t.category === "string" ? t.category : detectCategory(keywordAr),
      });
    }

    return enriched;
  } catch (err) {
    console.error("[TrendService] AI enrichment failed:", (err as Error).message);
    return [];
  }
}

export async function refreshHealthTrends(region: string = "SA"): Promise<{
  updated: number;
  alerts: number;
  lastUpdated: Date;
}> {
  console.log(`[TrendService] Refreshing health trends for region: ${region}`);

  const existingTrends = await storage.getHealthTrends(20);

  // Step 1: Try to get real data from Google Trends
  const rawGoogleTrends = await fetchGoogleTrends(region);
  console.log(`[TrendService] Google Trends returned ${rawGoogleTrends.length} raw items`);

  // Step 2: Enrich with AI (classification, translation, suggestions, context)
  const enriched = await enrichTrendsWithAI(rawGoogleTrends, region, 10);

  if (enriched.length === 0) {
    console.warn("[TrendService] No trends generated after enrichment");
    return { updated: 0, alerts: 0, lastUpdated: new Date() };
  }

  let updated = 0;
  let alertsCreated = 0;

  for (const trend of enriched) {
    const existing = existingTrends.find(
      (e) => e.keyword.toLowerCase() === trend.keyword.toLowerCase() && e.region === region
    );

    const prevChange = existing?.weeklyChange ?? 0;
    const newChange = trend.weeklyChange;
    const score = trend.value;
    const strength = scoreToStrength(score);

    const insertData: InsertHealthTrend = {
      keyword: trend.keyword,
      keywordAr: trend.keywordAr,
      category: trend.category,
      trendScore: score,
      trendStrength: strength,
      searchVolume: trend.searchVolume,
      weeklyChange: newChange,
      region,
      articleSuggestions: trend.articleSuggestions,
      aiContext: trend.aiContext,
    };

    // Upsert returns the persisted row with a real id
    const saved = await storage.upsertHealthTrend(insertData);
    updated++;

    // Create spike alert if threshold crossed
    if (newChange >= SPIKE_THRESHOLD && (!existing || prevChange < SPIKE_THRESHOLD)) {
      const alertData: InsertTrendAlert = {
        trendId: saved.id, // guaranteed non-null from DB
        keyword: trend.keyword,
        keywordAr: trend.keywordAr,
        spikePercent: newChange,
        message: `الناس تبحث كثيراً عن "${trend.keywordAr}" — ارتفع البحث بنسبة ${newChange}% في الأسبوع الماضي! اكتب عنه الآن.`,
      };
      await storage.createTrendAlert(alertData);
      alertsCreated++;
      console.log(`[TrendService] Spike alert: ${trend.keywordAr} (+${newChange}%)`);
    }
  }

  console.log(`[TrendService] Refresh complete: ${updated} trends updated, ${alertsCreated} alerts created`);
  return { updated, alerts: alertsCreated, lastUpdated: new Date() };
}

// Weekly report: compare trending topics against published content
export async function generateWeeklyTrendReport(region: string = "SA"): Promise<{
  period: string;
  topTrends: Array<{
    keyword: string;
    keywordAr: string;
    trendScore: number;
    weeklyChange: number;
    coveredByUs: boolean;
    publishedArticles: string[];
  }>;
  coverageRate: number;
  totalTrends: number;
  coveredTrends: number;
  uncoveredOpportunities: string[];
}> {
  const trends = await storage.getHealthTrends(10);
  const recentNews = await storage.getNews(undefined, 100);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyNews = recentNews.filter((n) => {
    const pub = n.publishedAt ? new Date(n.publishedAt) : null;
    return pub && pub >= oneWeekAgo;
  });

  const report = trends.map((trend) => {
    const keywordLower = (trend.keywordAr ?? trend.keyword).toLowerCase();
    const englishLower = trend.keyword.toLowerCase();

    const matching = weeklyNews.filter((n) => {
      const title = (n.title ?? "").toLowerCase();
      const kws = (n.keywords ?? []).map((k) => k.toLowerCase());
      return (
        title.includes(keywordLower) ||
        title.includes(englishLower) ||
        kws.some((k) => k.includes(keywordLower) || k.includes(englishLower))
      );
    });

    return {
      keyword: trend.keyword,
      keywordAr: trend.keywordAr ?? trend.keyword,
      trendScore: trend.trendScore,
      weeklyChange: trend.weeklyChange ?? 0,
      coveredByUs: matching.length > 0,
      publishedArticles: matching.map((n) => n.title).slice(0, 3),
    };
  });

  const covered = report.filter((r) => r.coveredByUs).length;
  const uncovered = report
    .filter((r) => !r.coveredByUs && r.trendScore >= 60)
    .map((r) => r.keywordAr);

  return {
    period: `أسبوع ${new Date().toLocaleDateString("ar-SA")}`,
    topTrends: report,
    coverageRate: trends.length > 0 ? Math.round((covered / trends.length) * 100) : 0,
    totalTrends: trends.length,
    coveredTrends: covered,
    uncoveredOpportunities: uncovered,
  };
}

let refreshTimer: ReturnType<typeof setInterval> | null = null;
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function startTrendRefreshScheduler(): void {
  if (refreshTimer) return;

  const runRefresh = async (): Promise<void> => {
    try {
      await refreshHealthTrends("SA");
    } catch (err) {
      console.error("[TrendService] Scheduled refresh failed:", err);
    }
  };

  // Run immediately on startup
  runRefresh();

  refreshTimer = setInterval(runRefresh, REFRESH_INTERVAL_MS);
  console.log(`[TrendService] Scheduler started - refresh every 6 hours`);
}

export function stopTrendRefreshScheduler(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
