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
