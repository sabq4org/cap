import Parser from 'rss-parser';
import crypto from 'crypto';
import { storage } from './storage';
import { classifyNewsWithAI, analyzeNewsContent } from './openai';
import type { RadarSource, InsertRadarItem } from '@shared/schema';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'creator'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
  timeout: 30000,
});

interface FetchResult {
  success: boolean;
  itemsFetched: number;
  itemsNew: number;
  itemsDuplicate: number;
  error?: string;
}

function generateExternalId(url: string, title: string): string {
  return crypto.createHash('md5').update(url + title).digest('hex');
}

function extractImageUrl(item: any): string | undefined {
  if (item.media?.['$']?.url) return item.media['$'].url;
  if (item.thumbnail?.['$']?.url) return item.thumbnail['$'].url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;
  
  const content = item.contentEncoded || item.content || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];
  
  return undefined;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// كلمات مفتاحية صحية للتصفية - تُستخدم للمصادر العامة (غير المتخصصة بالصحة)
const HEALTH_FILTER_KEYWORDS = [
  // عربية
  'صحة','صحي','صحية','طب','طبي','طبية','مرض','أمراض','علاج','علاجي','دواء','أدوية',
  'مستشفى','مستشفيات','مستشفيات','طبيب','أطباء','جراح','جراحة','عملية','تشخيص',
  'لقاح','تطعيم','وباء','وبائي','جائحة','فيروس','بكتيريا','ميكروب',
  'سرطان','سكري','ضغط الدم','قلب','أوعية دموية','كلى','كبد','رئة',
  'تغذية','غذاء','غذائي','غذائية','سعرات','بروتين','فيتامين','معدن','نظام غذائي',
  'وزن','سمنة','نحافة','رياضة صحة','لياقة','بدنية',
  'نفسي','نفسية','اكتئاب','قلق','صحة نفسية','نوم','توتر',
  'وزارة الصحة','صحة السعودية','صحة الإمارات','الرعاية الصحية',
  'منظمة الصحة','دراسة طبية','بحث طبي','دواء جديد','عقار',
  'أسنان','جلد','عيون','آذان','عظام','عمود فقري','مفاصل',
  'حمل','ولادة','أطفال','رضيع','مواليد','نساء صحة',
  'إسعاف','طوارئ','حوادث طبية','إصابة','كسر',
  // إنجليزية
  'health','medical','medicine','disease','treatment','hospital','doctor',
  'drug','vaccine','pandemic','virus','bacteria','cancer','diabetes',
  'surgery','patient','pharmacy','clinical','therapy','nutrition','diet',
  'mental health','obesity','fitness','wellness','healthcare',
];

const HEALTH_SPECIALIZED_CATEGORIES = ['health-news', 'saudi-health'];

function isHealthRelated(title: string, summary: string): boolean {
  const text = (title + ' ' + summary).toLowerCase();
  return HEALTH_FILTER_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

export async function fetchRSSSource(source: RadarSource): Promise<FetchResult> {
  const result: FetchResult = {
    success: false,
    itemsFetched: 0,
    itemsNew: 0,
    itemsDuplicate: 0,
  };

  try {
    console.log(`[Radar] Fetching RSS from: ${source.name} (${source.url})`);
    
    const feed = await parser.parseURL(source.url);
    result.itemsFetched = feed.items?.length || 0;
    
    if (!feed.items || feed.items.length === 0) {
      result.success = true;
      return result;
    }

    for (const item of feed.items) {
      const externalId = generateExternalId(item.link || '', item.title || '');
      
      const existing = await storage.getRadarItemByExternalId(externalId);
      if (existing) {
        result.itemsDuplicate++;
        continue;
      }

      const summary = item.contentSnippet || item.summary || '';
      const content = item.contentEncoded || item.content || '';
      const imageUrl = extractImageUrl(item);

      // تصفية الأخبار غير الصحية للمصادر العامة (غير المتخصصة بالصحة)
      const isSpecializedSource = HEALTH_SPECIALIZED_CATEGORIES.includes(source.category || '');
      if (!isSpecializedSource) {
        const cleanSummary = stripHtml(summary);
        if (!isHealthRelated(item.title || '', cleanSummary)) {
          continue; // تجاهل الخبر لأنه غير صحي
        }
      }

      const newItem: InsertRadarItem = {
        sourceId: source.id,
        externalId,
        title: item.title || 'بدون عنوان',
        summary: stripHtml(summary).substring(0, 500),
        content: stripHtml(content),
        originalUrl: item.link || source.url,
        imageUrl,
        author: item.creator || (item as any).author || undefined,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        language: source.language,
        category: source.category || undefined,
        status: 'pending',
        keywords: [],
      };

      await storage.createRadarItem(newItem);
      result.itemsNew++;
    }

    result.success = true;
    await storage.updateSourceFetchStatus(source.id, 'success', undefined, result.itemsNew);
    
  } catch (error: any) {
    console.error(`[Radar] Error fetching ${source.name}:`, error.message);
    result.error = error.message;
    await storage.updateSourceFetchStatus(source.id, 'error', error.message);
  }

  return result;
}

export async function fetchAllActiveSources(): Promise<{
  totalSources: number;
  successfulSources: number;
  totalNewItems: number;
  errors: string[];
}> {
  const sources = await storage.getRadarSources(true);
  const results = {
    totalSources: sources.length,
    successfulSources: 0,
    totalNewItems: 0,
    errors: [] as string[],
  };

  console.log(`[Radar] Starting fetch for ${sources.length} active sources`);

  for (const source of sources) {
    if (source.type !== 'rss') continue;
    
    const log = await storage.createFetchLog(source.id);
    const result = await fetchRSSSource(source);
    
    await storage.completeFetchLog(
      log.id,
      result.success ? 'success' : 'error',
      result.itemsFetched,
      result.itemsNew,
      result.itemsDuplicate,
      result.error
    );

    if (result.success) {
      results.successfulSources++;
      results.totalNewItems += result.itemsNew;
    } else if (result.error) {
      results.errors.push(`${source.name}: ${result.error}`);
    }
  }

  console.log(`[Radar] Fetch complete: ${results.successfulSources}/${results.totalSources} sources, ${results.totalNewItems} new items`);
  
  return results;
}

export async function classifyPendingItems(limit: number = 10): Promise<number> {
  const items = await storage.getRadarItems({ status: 'pending', limit });
  let classified = 0;

  for (const item of items) {
    try {
      const analysis = await analyzeNewsContent(item.title, item.summary || '', item.content || '');
      
      if (analysis) {
        await storage.updateRadarItem(item.id, {
          suggestedCategory: analysis.category,
          relevanceScore: analysis.relevanceScore,
          keywords: analysis.keywords,
          aiAnalysis: {
            topics: analysis.topics || [],
            entities: analysis.entities || [],
            credibilityScore: analysis.credibilityScore || 70,
            summary: analysis.summary || '',
          },
        });
        classified++;
      }
    } catch (error) {
      console.error(`[Radar] Error classifying item ${item.id}:`, error);
    }
  }

  return classified;
}

const defaultHealthSources = [
  // ── المصادر العربية والسعودية ─────────────────────────────────────
  {
    name: "SPA - Health",
    nameAr: "وكالة الأنباء السعودية - الصحة",
    url: "https://www.spa.gov.sa/rss/health_care.xml",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 5,
    reliability: 95,
    description: "أخبار الصحة من وكالة الأنباء السعودية الرسمية",
  },
  {
    name: "SPA - All News",
    nameAr: "وكالة الأنباء السعودية - الأخبار",
    url: "https://www.spa.gov.sa/rss/all.xml",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 5,
    reliability: 95,
    description: "جميع أخبار وكالة الأنباء السعودية",
  },
  {
    name: "WHO Arabic",
    nameAr: "منظمة الصحة العالمية - عربي",
    url: "https://www.who.int/rss-feeds/news-arabic.xml",
    type: "rss" as const,
    category: "health-news",
    language: "ar",
    priority: 5,
    reliability: 98,
    description: "آخر أخبار منظمة الصحة العالمية باللغة العربية",
  },
  {
    name: "Sehha.com",
    nameAr: "موقع صحة",
    url: "https://www.sehha.com/feed/",
    type: "rss" as const,
    category: "health-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "أخبار ومقالات صحية باللغة العربية",
  },
  {
    name: "Okaz - Health",
    nameAr: "صحيفة عكاظ - صحة",
    url: "https://www.okaz.com.sa/rss/health.xml",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "أخبار الصحة من صحيفة عكاظ السعودية",
  },
  {
    name: "Sabq - Health",
    nameAr: "صحيفة سبق - صحة",
    url: "https://sabq.org/rss/health",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "أخبار الصحة من صحيفة سبق الإلكترونية",
  },
  {
    name: "Makkah Newspaper",
    nameAr: "صحيفة مكة",
    url: "https://makkahnewspaper.com/rss",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 4,
    reliability: 80,
    description: "أخبار صحيفة مكة السعودية",
  },
  {
    name: "Al-Riyadh - Health",
    nameAr: "صحيفة الرياض - صحة",
    url: "https://www.alriyadh.com/rss/health.xml",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "أخبار الصحة من صحيفة الرياض السعودية",
  },
  {
    name: "Al-Watan SA",
    nameAr: "صحيفة الوطن السعودية",
    url: "https://alwatan.com.sa/rss",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 4,
    reliability: 80,
    description: "أخبار صحيفة الوطن السعودية",
  },
  {
    name: "Alyaum",
    nameAr: "صحيفة اليوم",
    url: "https://www.alyaum.com/rss",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 3,
    reliability: 80,
    description: "أخبار صحيفة اليوم السعودية",
  },
  // ── المصادر الإنجليزية ──────────────────────────────────────────
  {
    name: "NHS Behind the Headlines",
    nameAr: "أخبار هيئة الخدمات الصحية البريطانية",
    url: "https://www.nhs.uk/news/pages/newsarticles.aspx?rss=Headlines",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 5,
    reliability: 95,
    description: "NHS health news and analysis",
  },
  {
    name: "Harvard Health",
    nameAr: "صحة هارفارد",
    url: "https://www.health.harvard.edu/blog/feed",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 5,
    reliability: 95,
    description: "Harvard Medical School health information",
  },
  {
    name: "Mayo Clinic",
    nameAr: "مايو كلينك",
    url: "https://newsnetwork.mayoclinic.org/feed/",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 5,
    reliability: 95,
    description: "Mayo Clinic health news",
  },
  {
    name: "Healthline",
    nameAr: "هيلث لاين",
    url: "https://www.healthline.com/rss/health-news",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 4,
    reliability: 85,
    description: "Healthline latest health news",
  },
  {
    name: "CDC Newsroom",
    nameAr: "غرفة أخبار مراكز السيطرة على الأمراض",
    url: "https://tools.cdc.gov/podcasts/feed.asp?feedid=183",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 5,
    reliability: 95,
    description: "CDC health news and updates",
  },
  // ── المجلات الطبية العلمية المحكّمة ──────────────────────────────
  {
    name: "The Lancet",
    nameAr: "مجلة لانسيت",
    url: "https://www.thelancet.com/rssfeed/lancet_online.xml",
    type: "rss" as const,
    category: "medical-research",
    language: "en",
    priority: 5,
    reliability: 98,
    description: "One of the world's oldest and most respected medical journals",
  },
  {
    name: "NEJM",
    nameAr: "مجلة نيو إنغلاند الطبية",
    url: "https://www.nejm.org/action/showFeed?type=etoc&feed=rss&jc=nejm",
    type: "rss" as const,
    category: "medical-research",
    language: "en",
    priority: 5,
    reliability: 98,
    description: "New England Journal of Medicine - leading medical research",
  },
  {
    name: "Nature Medicine",
    nameAr: "مجلة نيتشر للطب",
    url: "https://www.nature.com/nm.rss",
    type: "rss" as const,
    category: "medical-research",
    language: "en",
    priority: 5,
    reliability: 97,
    description: "Nature Medicine - advanced biomedical research",
  },
  // ── مواقع صحية للعموم ──────────────────────────────────────────
  {
    name: "WHO English",
    nameAr: "منظمة الصحة العالمية - إنجليزي",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 5,
    reliability: 98,
    description: "WHO official health news in English",
  },
  {
    name: "Everyday Health",
    nameAr: "إيفريدي هيلث",
    url: "https://www.everydayhealth.com/rss/",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 4,
    reliability: 85,
    description: "Everyday health tips and medical news",
  },
  // ── صحف دولية كبرى - قسم الصحة ─────────────────────────────────
  {
    name: "BBC Health",
    nameAr: "بي بي سي - صحة",
    url: "https://feeds.bbci.co.uk/news/health/rss.xml",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 5,
    reliability: 95,
    description: "BBC News health section",
  },
  {
    name: "The Guardian Health",
    nameAr: "الغارديان - صحة",
    url: "https://www.theguardian.com/society/health/rss",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 4,
    reliability: 90,
    description: "The Guardian health and society news",
  },
  {
    name: "NYT Health",
    nameAr: "نيويورك تايمز - صحة",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 4,
    reliability: 90,
    description: "New York Times health section",
  },
  {
    name: "STAT News",
    nameAr: "ستات نيوز",
    url: "https://www.statnews.com/feed/",
    type: "rss" as const,
    category: "health-news",
    language: "en",
    priority: 4,
    reliability: 90,
    description: "STAT News - health, medicine, and science journalism",
  },
  // ── الصحف العربية ─────────────────────────────────────────────
  {
    name: "Okaz",
    nameAr: "صحيفة عكاظ",
    url: "https://www.okaz.com.sa/rss",
    type: "rss" as const,
    category: "saudi-health",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة عكاظ السعودية",
  },
  {
    name: "Al Ittihad UAE",
    nameAr: "صحيفة الاتحاد الإماراتية",
    url: "https://www.alittihad.ae/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة الاتحاد الإماراتية",
  },
  {
    name: "Al Rai Kuwait",
    nameAr: "صحيفة الرأي الكويتية",
    url: "https://www.alraimedia.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة الرأي الكويتية",
  },
  {
    name: "Al Anba Kuwait",
    nameAr: "صحيفة الأنباء الكويتية",
    url: "https://www.alanba.com.kw/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة الأنباء الكويتية",
  },
  {
    name: "Al Jazeera Qatar",
    nameAr: "قناة الجزيرة القطرية",
    url: "https://www.aljazeera.net/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 5,
    reliability: 90,
    description: "قناة الجزيرة الإخبارية",
  },
  {
    name: "News of Bahrain",
    nameAr: "نيوز أوف بحرين",
    url: "https://www.newsofbahrain.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 3,
    reliability: 80,
    description: "أخبار البحرين",
  },
  {
    name: "Al Watan Oman",
    nameAr: "صحيفة الوطن العُمانية",
    url: "https://www.alwatan.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة الوطن العُمانية",
  },
  {
    name: "Sky News Arabia",
    nameAr: "سكاي نيوز عربية",
    url: "https://www.skynewsarabia.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 5,
    reliability: 90,
    description: "سكاي نيوز عربية",
  },
  {
    name: "BBC Arabic",
    nameAr: "بي بي سي عربي",
    url: "https://feeds.bbci.co.uk/arabic/rss.xml",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 5,
    reliability: 95,
    description: "بي بي سي عربي - جميع الأخبار",
  },
  {
    name: "France24 Arabic",
    nameAr: "فرانس 24 عربي",
    url: "https://www.france24.com/ar/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 5,
    reliability: 90,
    description: "فرانس 24 عربي",
  },
  {
    name: "RT Arabic",
    nameAr: "آر تي عربي",
    url: "https://arabic.rt.com/rss/",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 80,
    description: "قناة RT عربي",
  },
  {
    name: "DW Arabic",
    nameAr: "دويتشه فيله عربي",
    url: "https://rss.dw.com/xml/rss-ar-all",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 90,
    description: "دويتشه فيله عربي",
  },
  {
    name: "Independent Arabia",
    nameAr: "إندبندنت عربية",
    url: "https://www.independentarabia.com/rss.xml",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "إندبندنت عربية",
  },
  {
    name: "Masrawy",
    nameAr: "مصراوي",
    url: "https://www.masrawy.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "بوابة مصراوي المصرية",
  },
  {
    name: "Youm7",
    nameAr: "اليوم السابع",
    url: "https://www.youm7.com/rss/SectionRss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة اليوم السابع المصرية",
  },
  {
    name: "Annahar Lebanon",
    nameAr: "صحيفة النهار اللبنانية",
    url: "https://www.annahar.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة النهار اللبنانية",
  },
  {
    name: "Al Ghad Jordan",
    nameAr: "صحيفة الغد الأردنية",
    url: "https://www.alghad.com/rss",
    type: "rss" as const,
    category: "arab-news",
    language: "ar",
    priority: 4,
    reliability: 85,
    description: "صحيفة الغد الأردنية",
  },
];

export async function seedDefaultSources(): Promise<number> {
  const existingSources = await storage.getRadarSources();
  let added = 0;

  for (const source of defaultHealthSources) {
    const exists = existingSources.some(s => s.url === source.url);
    if (!exists) {
      await storage.createRadarSource(source);
      added++;
    }
  }

  return added;
}

const defaultHealthKeywords = [
  { keyword: "health", keywordAr: "صحة", category: "health-news", weight: 3 },
  { keyword: "medicine", keywordAr: "طب", category: "health-news", weight: 3 },
  { keyword: "disease", keywordAr: "مرض", category: "health-news", weight: 2 },
  { keyword: "treatment", keywordAr: "علاج", category: "health-news", weight: 2 },
  { keyword: "hospital", keywordAr: "مستشفى", category: "health-news", weight: 2 },
  { keyword: "doctor", keywordAr: "طبيب", category: "health-news", weight: 2 },
  { keyword: "nutrition", keywordAr: "تغذية", category: "nutrition", weight: 3 },
  { keyword: "diet", keywordAr: "حمية", category: "nutrition", weight: 2 },
  { keyword: "vitamin", keywordAr: "فيتامين", category: "nutrition", weight: 2 },
  { keyword: "cancer", keywordAr: "سرطان", category: "health-news", weight: 3 },
  { keyword: "diabetes", keywordAr: "سكري", category: "health-news", weight: 3 },
  { keyword: "heart", keywordAr: "قلب", category: "health-news", weight: 2 },
  { keyword: "vaccine", keywordAr: "لقاح", category: "health-news", weight: 3 },
  { keyword: "pandemic", keywordAr: "جائحة", category: "health-news", weight: 3 },
  { keyword: "mental health", keywordAr: "صحة نفسية", category: "health-news", weight: 2 },
  { keyword: "وزارة الصحة", keywordAr: "وزارة الصحة", category: "saudi-health", weight: 3 },
  { keyword: "مجلس الصحة", keywordAr: "مجلس الصحة", category: "saudi-health", weight: 3 },
];

export async function seedDefaultKeywords(): Promise<number> {
  const existingKeywords = await storage.getRadarKeywords();
  let added = 0;

  for (const kw of defaultHealthKeywords) {
    const exists = existingKeywords.some(k => k.keyword === kw.keyword);
    if (!exists) {
      await storage.createRadarKeyword(kw);
      added++;
    }
  }

  return added;
}
