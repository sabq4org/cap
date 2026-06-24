// Blueprint: javascript_database, javascript_log_in_with_replit
import {
  users,
  healthProfiles,
  trackers,
  nutritionEntries,
  articles,
  news,
  categories,
  chatSessions,
  chatMessages,
  radarSources,
  radarExcludedSeeds,
  radarKeywords,
  radarItems,
  radarAlerts,
  radarNotifications,
  radarFetchLogs,
  generationSettings,
  generationUsage,
  imageGenerations,
  infographicTemplates,
  infographicJobs,
  advertisements,
  ads,
  type Ad,
  type InsertAd,
  healthTrends,
  trendAlerts,
  adStats,
  type AdStat,
  rumorSubmissions,
  debunkCtaClicks,
  type DebunkCtaClick,
  whatsappSubscribers,
  whatsappNewsletters,
  whatsappSettings,
  podcastEpisodes,
  drugs,
  type Drug,
  type InsertDrug,
  authors,
  type Author,
  type InsertAuthor,
  type AuthorStatus,
  type User,
  type UpsertUser,
  type HealthProfile,
  type InsertHealthProfile,
  type Tracker,
  type InsertTracker,
  type NutritionEntry,
  type InsertNutritionEntry,
  type Article,
  type InsertArticle,
  type News,
  type InsertNews,
  type Category,
  type InsertCategory,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type RadarSource,
  type InsertRadarSource,
  type RadarKeyword,
  type InsertRadarKeyword,
  type RadarItem,
  type InsertRadarItem,
  type RadarAlert,
  type InsertRadarAlert,
  type RadarNotification,
  type InsertRadarNotification,
  type RadarFetchLog,
  type GenerationSettings,
  type InsertGenerationSettings,
  type GenerationUsage,
  type InsertGenerationUsage,
  type ImageGeneration,
  type InsertImageGeneration,
  type InfographicTemplate,
  type InsertInfographicTemplate,
  type InfographicJob,
  type InsertInfographicJob,
  type PodcastEpisode,
  type InsertPodcastEpisode,
  viewCountryStats,
  type ViewCountryStat,
  viewReferrerStats,
  type ViewReferrerStat,
  type Advertisement,
  type InsertAdvertisement,
  type HealthTrend,
  type InsertHealthTrend,
  type TrendAlert,
  type InsertTrendAlert,
  type RumorSubmission,
  type InsertRumorSubmission,
  type WhatsappSubscriber,
  type InsertWhatsappSubscriber,
  type WhatsappNewsletter,
  type InsertWhatsappNewsletter,
  type WhatsappSettings,
  capsuleLogs,
  type CapsuleLog,
  type InsertCapsuleLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, isNull, asc, like, or, ilike, inArray, ne } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createLocalUser(data: { email: string; passwordHash: string; firstName: string; lastName?: string | null; authProvider?: string }): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;

  // Health profile operations
  getHealthProfile(userId: string): Promise<HealthProfile | undefined>;
  upsertHealthProfile(profile: InsertHealthProfile): Promise<HealthProfile>;

  // Tracker operations
  getTrackers(userId: string, type?: string, limit?: number): Promise<Tracker[]>;
  addTracker(tracker: InsertTracker): Promise<Tracker>;

  // Nutrition operations
  getNutritionEntries(userId: string, startDate?: Date, endDate?: Date): Promise<NutritionEntry[]>;
  addNutritionEntry(entry: InsertNutritionEntry): Promise<NutritionEntry>;

  // Article operations
  getArticles(category?: string, limit?: number, includeAll?: boolean): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticleById(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, articleData: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;

  // News operations
  getNews(category?: string, limit?: number): Promise<News[]>;
  getRelatedNews(newsId: string, category: string, limit?: number): Promise<News[]>;
  getNewsPaginated(category?: string, page?: number, perPage?: number, search?: string): Promise<{ news: News[]; total: number; page: number; totalPages: number }>;
  getNewsById(id: string): Promise<News | undefined>;
  getNewsByShortCode(shortCode: string): Promise<News | undefined>;
  getNewsByLegacyUrl(urlPath: string): Promise<News | undefined>;
  getNewsByKeyword(keyword: string): Promise<News[]>;
  getNewsByStatus(status: string): Promise<News[]>;
  getAllNewsForAdmin(): Promise<News[]>;
  getMiscNews(limit?: number): Promise<News[]>;
  getMiscNewsCount(): Promise<number>;
  getMiscArticlesCount(): Promise<number>;
  getAdminNewsPaginated(status?: string, page?: number, perPage?: number, search?: string, category?: string, sortBy?: string, sortOrder?: string): Promise<{ news: News[]; total: number; page: number; totalPages: number }>;
  createNews(newsItem: InsertNews): Promise<News>;
  updateNews(id: string, newsData: Partial<InsertNews>): Promise<News | undefined>;
  incrementViewCount(id: string): Promise<void>;
  deleteNews(id: string): Promise<boolean>;
  softDeleteNews(id: string): Promise<boolean>;
  restoreNews(id: string): Promise<boolean>;

  // Drug encyclopedia operations
  getDrugs(limit?: number): Promise<Drug[]>;
  getDrugById(id: string): Promise<Drug | undefined>;
  searchDrugs(query: string): Promise<Drug[]>;
  upsertDrug(drug: InsertDrug): Promise<Drug>;
  incrementDrugViewCount(id: string): Promise<void>;

  // Authors operations
  getAuthors(status?: AuthorStatus): Promise<Author[]>;
  getAuthorById(id: string): Promise<Author | undefined>;
  getAuthorBySlug(slug: string): Promise<Author | undefined>;
  getAuthorByEmail(email: string): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor & { slug: string }): Promise<Author>;
  updateAuthorStatus(id: string, status: AuthorStatus, reviewedBy: string, reviewNotes?: string): Promise<Author | undefined>;
  updateAuthor(id: string, data: Partial<InsertAuthor>): Promise<Author | undefined>;
  deleteAuthor(id: string): Promise<boolean>;

  // Category operations
  getCategories(activeOnly?: boolean): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Chat operations
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Archive search for AI chatbot
  searchArchive(query: string, limit?: number): Promise<{
    news: Array<{ id: string; title: string; summary: string | null; content: string; category: string; publishedAt: Date | null; shortCode: string | null; imageUrl: string | null; relevanceScore: number }>;
    articles: Array<{ id: string; slug: string; title: string; excerpt: string; content: string; category: string; publishedAt: Date | null; relevanceScore: number }>;
  }>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalNews: number;
    publishedNews: number;
    draftNews: number;
    scheduledNews: number;
    deletedNews: number;
    featuredNews: number;
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    totalUsers: number;
    totalChatSessions: number;
    totalChatMessages: number;
  }>;

  getAnalyticsForAI(): Promise<{
    categoryPerformance: { category: string; count: number; views: number; avgViews: number }[];
    publishingTrend: { date: string; count: number }[];
    topPerformingNews: { title: string; category: string; views: number }[];
    lowPerformingCategories: { category: string; count: number; avgViews: number }[];
    totalStats: { published: number; totalViews: number; avgViewsPerNews: number; daysActive: number };
    radarSourcePerformance: { name: string; itemsCount: number }[];
  }>;

  // User management operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;
  updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }): Promise<User | undefined>;

  // Advertisement operations
  getAdvertisements(): Promise<Advertisement[]>;
  getAdvertisementById(id: string): Promise<Advertisement | undefined>;
  getActiveAdByPosition(position: string): Promise<Advertisement | undefined>;
  getActiveAdsByPosition(position: string): Promise<Advertisement[]>;
  createAdvertisement(data: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: string, data: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: string): Promise<boolean>;
  deactivateExpiredAds(): Promise<number>;
  resetAdStats(id: string): Promise<Advertisement | undefined>;
  incrementAdDailyStat(adId: string, field: 'impressions' | 'clicks'): Promise<void>;
  getAdStats(adId: string, days: number): Promise<AdStat[]>;

  // Ads operations
  getAds(position?: string): Promise<Ad[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: string, data: Partial<InsertAd>): Promise<Ad | undefined>;
  deleteAd(id: string): Promise<boolean>;

  // Capsule log operations
  createCapsuleLog(log: InsertCapsuleLog): Promise<CapsuleLog>;
  getCapsuleLogs(limit?: number): Promise<CapsuleLog[]>;

  // Health Trend Radar operations
  getHealthTrends(limit?: number): Promise<HealthTrend[]>;
  getHealthTrendById(id: string): Promise<HealthTrend | undefined>;
  upsertHealthTrend(trend: InsertHealthTrend): Promise<HealthTrend>;
  deleteOldTrends(olderThanHours?: number): Promise<number>;
  getTrendAlerts(unreadOnly?: boolean): Promise<TrendAlert[]>;
  createTrendAlert(alert: InsertTrendAlert): Promise<TrendAlert>;
  markTrendAlertRead(id: string): Promise<void>;
  markAllTrendAlertsRead(): Promise<void>;
  getUnreadTrendAlertsCount(): Promise<number>;

  // Rumor submissions operations
  createRumorSubmission(data: InsertRumorSubmission): Promise<RumorSubmission>;
  getRumorSubmissions(status?: string, limit?: number): Promise<RumorSubmission[]>;
  getRumorSubmissionById(id: string): Promise<RumorSubmission | undefined>;
  updateRumorSubmission(id: string, data: Partial<RumorSubmission>): Promise<RumorSubmission | undefined>;
  getPublishedRumors(limit?: number): Promise<RumorSubmission[]>;
  incrementRumorViewCount(id: string): Promise<void>;

  // Debunk CTA analytics
  recordDebunkCtaClick(): Promise<void>;
  getDebunkCtaStats(days?: number): Promise<{ date: string; clicks: number }[]>;
  getTotalDebunkCtaClicks(): Promise<number>;

  // WhatsApp subscriber operations
  getWhatsappSubscribers(filters?: { status?: string; isActive?: boolean }): Promise<WhatsappSubscriber[]>;
  getWhatsappSubscriberByPhone(phone: string): Promise<WhatsappSubscriber | undefined>;
  createWhatsappSubscriber(data: InsertWhatsappSubscriber): Promise<WhatsappSubscriber>;
  updateWhatsappSubscriber(id: string, data: Partial<WhatsappSubscriber>): Promise<WhatsappSubscriber | undefined>;
  getActiveWhatsappSubscribers(interests?: string[]): Promise<WhatsappSubscriber[]>;
  getWhatsappSubscriberStats(): Promise<{ total: number; active: number; pending: number; unsubscribed: number }>;

  // WhatsApp newsletter operations
  getWhatsappNewsletters(limit?: number): Promise<WhatsappNewsletter[]>;
  getWhatsappNewsletter(id: string): Promise<WhatsappNewsletter | undefined>;
  createWhatsappNewsletter(data: InsertWhatsappNewsletter): Promise<WhatsappNewsletter>;
  updateWhatsappNewsletter(id: string, data: Partial<WhatsappNewsletter>): Promise<WhatsappNewsletter | undefined>;
  deleteWhatsappNewsletter(id: string): Promise<void>;
  getScheduledWhatsappNewslettersDue(): Promise<WhatsappNewsletter[]>;
  claimScheduledNewsletter(id: string): Promise<boolean>;
  cancelScheduledNewsletter(id: string): Promise<boolean>;

  // WhatsApp settings
  getWhatsappSettings(): Promise<WhatsappSettings | undefined>;
  upsertWhatsappSettings(data: Partial<WhatsappSettings>): Promise<WhatsappSettings>;

  // Podcast operations
  getPodcastEpisodes(limit?: number): Promise<PodcastEpisode[]>;
  getPodcastEpisode(id: string): Promise<PodcastEpisode | undefined>;
  createPodcastEpisode(data: InsertPodcastEpisode): Promise<PodcastEpisode>;
  updatePodcastEpisode(id: string, data: Partial<InsertPodcastEpisode> & { updatedAt?: Date; errorMessage?: string | null }): Promise<PodcastEpisode | undefined>;
  deletePodcastEpisode(id: string): Promise<boolean>;

  // User interests operations
  getUserInterests(userId: string): Promise<string[]>;
  updateUserInterests(userId: string, interests: string[]): Promise<void>;

  // Capsule feed — returns both news and articles, filtered by interests
  getCapsuleFeed(interests: string[], page?: number, perPage?: number): Promise<{
    items: Array<{ type: "news"; item: News } | { type: "article"; item: Article }>;
    total: number;
    page: number;
    totalPages: number;
  }>;
}

// Simple TTL in-memory cache with a bounded size (LRU-style eviction).
// The size cap prevents memory exhaustion from public endpoints with
// user-controlled cache keys (e.g. /api/news/keyword/:keyword).
class TtlCache {
  private store = new Map<string, { value: any; expiresAt: number }>();
  private maxEntries = 500;
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
    // Refresh recency: move key to the end (most-recently-used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }
  set(key: string, value: any, ttlMs: number) {
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    // Evict least-recently-used entries when over capacity
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }
  del(key: string) { this.store.delete(key); }
  delPrefix(prefix: string) {
    for (const k of this.store.keys()) { if (k.startsWith(prefix)) this.store.delete(k); }
  }
}
const newsCache = new TtlCache();

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createLocalUser(data: { email: string; passwordHash: string; firstName: string; lastName?: string | null; authProvider?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      authProvider: data.authProvider ?? "local",
      role: "subscriber",
      isActive: true,
    }).returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
  }

  // Health profile operations
  async getHealthProfile(userId: string): Promise<HealthProfile | undefined> {
    const [profile] = await db
      .select()
      .from(healthProfiles)
      .where(eq(healthProfiles.userId, userId));
    return profile;
  }

  async upsertHealthProfile(profileData: InsertHealthProfile): Promise<HealthProfile> {
    const existing = await this.getHealthProfile(profileData.userId);
    
    if (existing) {
      const updateData: any = { ...profileData, updatedAt: new Date() };
      const [updated] = await db
        .update(healthProfiles)
        .set(updateData)
        .where(eq(healthProfiles.userId, profileData.userId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(healthProfiles)
      .values(profileData as any)
      .returning();
    return created;
  }

  // Tracker operations
  async getTrackers(userId: string, type?: string, limit: number = 50): Promise<Tracker[]> {
    if (type) {
      const results = await db
        .select()
        .from(trackers)
        .where(and(eq(trackers.userId, userId), eq(trackers.type, type)))
        .orderBy(desc(trackers.measuredAt))
        .limit(limit);
      return results;
    }

    const results = await db
      .select()
      .from(trackers)
      .where(eq(trackers.userId, userId))
      .orderBy(desc(trackers.measuredAt))
      .limit(limit);

    return results;
  }

  async addTracker(trackerData: InsertTracker): Promise<Tracker> {
    const [tracker] = await db
      .insert(trackers)
      .values(trackerData as any)
      .returning();
    return tracker;
  }

  // Nutrition operations
  async getNutritionEntries(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<NutritionEntry[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(nutritionEntries)
        .where(
          and(
            eq(nutritionEntries.userId, userId),
            gte(nutritionEntries.loggedAt, startDate),
            lte(nutritionEntries.loggedAt, endDate)
          )
        )
        .orderBy(desc(nutritionEntries.loggedAt));
    }

    return await db
      .select()
      .from(nutritionEntries)
      .where(eq(nutritionEntries.userId, userId))
      .orderBy(desc(nutritionEntries.loggedAt));
  }

  async addNutritionEntry(entryData: InsertNutritionEntry): Promise<NutritionEntry> {
    const [entry] = await db
      .insert(nutritionEntries)
      .values(entryData as any)
      .returning();
    return entry;
  }

  // Article operations
  async getArticles(category?: string, limit: number = 50, includeAll: boolean = false): Promise<Article[]> {
    const now = new Date();
    const publicCondition = sql`(${articles.status} = 'published' OR (${articles.status} = 'scheduled' AND ${articles.scheduledAt} IS NOT NULL AND ${articles.scheduledAt} <= ${now}))`;

    if (category) {
      if (includeAll) {
        return await db
          .select()
          .from(articles)
          .where(eq(articles.category, category))
          .orderBy(desc(articles.createdAt))
          .limit(limit);
      }
      return await db
        .select()
        .from(articles)
        .where(and(publicCondition, eq(articles.category, category)))
        .orderBy(desc(articles.publishedAt))
        .limit(limit);
    }

    if (includeAll) {
      return await db
        .select()
        .from(articles)
        .orderBy(desc(articles.createdAt))
        .limit(limit);
    }

    return await db
      .select()
      .from(articles)
      .where(publicCondition)
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  }

  async promoteOverdueScheduledArticles(): Promise<number> {
    const now = new Date();
    const overdue = await db
      .select()
      .from(articles)
      .where(sql`${articles.status} = 'scheduled' AND ${articles.scheduledAt} IS NOT NULL AND ${articles.scheduledAt} <= ${now}`);
    if (overdue.length === 0) return 0;
    for (const item of overdue) {
      await db
        .update(articles)
        .set({ status: 'published', publishedAt: item.scheduledAt ?? now })
        .where(eq(articles.id, item.id));
    }
    return overdue.length;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug));
    return article;
  }

  async createArticle(articleData: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values(articleData as any)
      .returning();
    return article;
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async updateArticle(id: string, articleData: Partial<InsertArticle>): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ ...articleData, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id)).returning();
    return result.length > 0;
  }

  // News operations
  // Helper to auto-promote scheduled items
  private _lastPromoteCheck = 0;
  private async autoPromoteScheduledItems(items: News[]): Promise<void> {
    const now = Date.now();
    if (now - this._lastPromoteCheck < 30000) return; // at most once per 30s
    this._lastPromoteCheck = now;
    const nowDate = new Date();
    await db.execute(sql`
      UPDATE news SET status = 'published', published_at = scheduled_at
      WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ${nowDate}
    `);
    for (const item of items) {
      if (item.status === 'scheduled' && item.scheduledAt && item.scheduledAt <= nowDate) {
        item.status = 'published';
        item.publishedAt = item.scheduledAt;
      }
    }
  }

  async getNews(category?: string, limit: number = 50): Promise<News[]> {
    const cacheKey = `news:${category || ''}:${limit}`;
    const cached = newsCache.get<News[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const conditions = [
      sql`${news.status} != 'deleted'`,
      sql`${news.status} != 'draft'`,
      sql`(${news.status} != 'scheduled' OR ${news.scheduledAt} IS NULL OR ${news.scheduledAt} <= ${now})`,
    ];

    if (category) {
      conditions.push(sql`${news.category} = ${category}`);
    }

    const results = await db
      .select()
      .from(news)
      .where(sql`${sql.join(conditions, sql` AND `)}`)
      .orderBy(desc(news.publishedAt), desc(news.createdAt))
      .limit(limit);

    await this.autoPromoteScheduledItems(results);
    newsCache.set(cacheKey, results, 60_000); // 60 seconds TTL
    return results;
  }

  async getRelatedNews(newsId: string, category: string, limit: number = 10): Promise<News[]> {
    const cacheKey = `related:${category}:${newsId}:${limit}`;
    const cached = newsCache.get<News[]>(cacheKey);
    if (cached) return cached;

    const results = await db
      .select({
        id: news.id, shortCode: news.shortCode, title: news.title, subtitle: news.subtitle,
        summary: news.summary, category: news.category, source: news.source,
        imageUrl: news.imageUrl, imageAlt: news.imageAlt, viewCount: news.viewCount,
        isFeatured: news.isFeatured, isBreaking: news.isBreaking, isTranslated: news.isTranslated,
        status: news.status, publishedAt: news.publishedAt, createdAt: news.createdAt,
        updatedAt: news.updatedAt, keywords: news.keywords,
        // Exclude heavy content column
        content: sql<string>`''`,
        // Required by News type
        todayViews: news.todayViews, todayViewsDate: news.todayViewsDate,
        seoTitle: news.seoTitle, seoDescription: news.seoDescription,
        sourceUrl: news.sourceUrl, scheduledAt: news.scheduledAt,
        deletedAt: news.deletedAt,
      })
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          eq(news.category, category),
          sql`${news.id} != ${newsId}`,
        )
      )
      .orderBy(desc(news.publishedAt))
      .limit(limit);

    newsCache.set(cacheKey, results, 300_000); // 5 min TTL
    return results as unknown as News[];
  }

  async getNewsPaginated(category?: string, page: number = 1, perPage: number = 20, search?: string): Promise<{ news: News[]; total: number; page: number; totalPages: number }> {
    const now = new Date();
    const conditions = [
      sql`${news.status} != 'deleted'`,
      sql`${news.status} != 'draft'`,
      sql`(${news.status} != 'scheduled' OR ${news.scheduledAt} IS NULL OR ${news.scheduledAt} <= ${now})`,
    ];

    if (category) {
      conditions.push(sql`${news.category} = ${category}`);
    }

    if (search) {
      conditions.push(sql`(${news.title} ILIKE ${'%' + search + '%'} OR ${news.summary} ILIKE ${'%' + search + '%'} OR ${news.content} ILIKE ${'%' + search + '%'} OR ${news.keywords}::text ILIKE ${'%' + search + '%'} OR ${news.subtitle} ILIKE ${'%' + search + '%'})`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(news)
      .where(whereClause);
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;

    const results = await db
      .select()
      .from(news)
      .where(whereClause)
      .orderBy(desc(news.publishedAt), desc(news.createdAt))
      .limit(perPage)
      .offset(offset);

    await this.autoPromoteScheduledItems(results);

    return { news: results, total, page, totalPages };
  }
  
  async getNewsByStatus(status: string): Promise<News[]> {
    const allNews = await db
      .select()
      .from(news)
      .orderBy(desc(news.createdAt));
    
    // Auto-promote scheduled items
    await this.autoPromoteScheduledItems(allNews);
    
    return allNews.filter(item => item.status === status);
  }

  async getAllNewsForAdmin(): Promise<News[]> {
    const allNews = await db
      .select()
      .from(news)
      .orderBy(desc(news.createdAt));
    
    await this.autoPromoteScheduledItems(allNews);
    
    return allNews;
  }

  async getMiscNews(limit: number = 500): Promise<News[]> {
    return await db
      .select()
      .from(news)
      .where(
        sql`(${news.category} = 'misc' OR ${news.category} = 'منوعات') AND ${news.status} != 'deleted'`
      )
      .orderBy(desc(news.createdAt))
      .limit(limit);
  }

  async getMiscNewsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(news)
      .where(
        sql`(${news.category} = 'misc' OR ${news.category} = 'منوعات') AND ${news.status} != 'deleted'`
      );
    return result[0]?.count ?? 0;
  }

  async getMiscArticlesCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(eq(articles.category, 'misc'));
    return result[0]?.count ?? 0;
  }

  async promoteOverdueScheduledNews(): Promise<number> {
    const now = new Date();
    const overdueItems = await db
      .select()
      .from(news)
      .where(
        sql`${news.status} = 'scheduled' AND ${news.scheduledAt} IS NOT NULL AND ${news.scheduledAt} <= ${now}`
      );

    if (overdueItems.length === 0) return 0;

    for (const item of overdueItems) {
      await db
        .update(news)
        .set({ status: 'published', publishedAt: item.scheduledAt ?? now })
        .where(eq(news.id, item.id));
    }

    return overdueItems.length;
  }

  async getAdminNewsPaginated(
    status?: string, 
    page: number = 1, 
    perPage: number = 30, 
    search?: string, 
    category?: string,
    sortBy: string = 'publishedAt',
    sortOrder: string = 'desc'
  ): Promise<{ news: News[]; total: number; page: number; totalPages: number }> {
    const conditions: any[] = [];

    if (status && status !== 'all') {
      conditions.push(sql`${news.status} = ${status}`);
    }

    if (search) {
      conditions.push(sql`(${news.title} ILIKE ${'%' + search + '%'} OR ${news.summary} ILIKE ${'%' + search + '%'} OR ${news.content} ILIKE ${'%' + search + '%'} OR ${news.keywords}::text ILIKE ${'%' + search + '%'} OR ${news.subtitle} ILIKE ${'%' + search + '%'})`);
    }

    if (category && category !== 'all') {
      conditions.push(sql`${news.category} = ${category}`);
    }

    const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(news)
      .where(whereClause);
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;

    const sortColumn = sortBy === 'title' ? news.title 
      : sortBy === 'createdAt' ? news.createdAt 
      : sortBy === 'category' ? news.category
      : sortBy === 'scheduledAt' ? news.scheduledAt
      : news.publishedAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const results = await db
      .select()
      .from(news)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(perPage)
      .offset(offset);

    await this.autoPromoteScheduledItems(results);

    return { news: results, total, page, totalPages };
  }

  async getNewsById(id: string): Promise<News | undefined> {
    const [newsItem] = await db
      .select()
      .from(news)
      .where(eq(news.id, id));
    return newsItem;
  }

  async getNewsByShortCode(shortCode: string): Promise<News | undefined> {
    const [newsItem] = await db
      .select()
      .from(news)
      .where(eq(news.shortCode, shortCode));
    return newsItem;
  }

  async getNewsByLegacyUrl(urlPath: string): Promise<News | undefined> {
    // Extract the slug (last non-empty segment of the path, decoded)
    const segments = urlPath.split('/').filter(Boolean);
    if (!segments.length) return undefined;
    const slug = decodeURIComponent(segments[segments.length - 1]);
    const cleanPath = urlPath.replace(/\/$/, '');
    const encodedPath = encodeURI(cleanPath);

    // Try exact path match (decoded and encoded variants)
    const [byPath] = await db
      .select()
      .from(news)
      .where(
        or(
          ilike(news.sourceUrl, '%' + cleanPath),
          ilike(news.sourceUrl, '%' + encodedPath)
        )
      )
      .limit(1);
    if (byPath) return byPath;

    // Fallback: match by slug segment (handles both decoded Arabic and encoded slugs)
    const encodedSlug = encodeURIComponent(slug);
    const [bySlug] = await db
      .select()
      .from(news)
      .where(
        or(
          ilike(news.sourceUrl, '%/' + slug + '/'),
          ilike(news.sourceUrl, '%/' + slug),
          ilike(news.sourceUrl, '%/' + encodedSlug + '/'),
          ilike(news.sourceUrl, '%/' + encodedSlug)
        )
      )
      .limit(1);
    return bySlug;
  }

  async getNewsByKeyword(keyword: string): Promise<News[]> {
    const cacheKey = `news:keyword:${keyword.toLowerCase()}`;
    const cached = newsCache.get<News[]>(cacheKey);
    if (cached) return cached;

    const pattern = '%' + keyword + '%';
    const results = await db
      .select()
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          sql`(${news.title} ILIKE ${pattern} OR ${news.summary} ILIKE ${pattern} OR ${news.content} ILIKE ${pattern} OR ${news.keywords}::text ILIKE ${pattern})`
        )
      )
      .orderBy(desc(news.publishedAt))
      .limit(100);

    newsCache.set(cacheKey, results as unknown as News[], 300_000); // 5 min TTL
    return results as unknown as News[];
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const [newsItem] = await db
      .insert(news)
      .values(newsData as any)
      .returning();
    newsCache.delPrefix('news:');
    newsCache.delPrefix('trending:');
    return newsItem;
  }

  async updateNews(id: string, newsData: Partial<InsertNews>): Promise<News | undefined> {
    const [updated] = await db
      .update(news)
      .set(newsData as any)
      .where(eq(news.id, id))
      .returning();
    newsCache.delPrefix('news:');
    newsCache.delPrefix('trending:');
    return updated;
  }

  async incrementViewCount(id: string): Promise<void> {
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }); // YYYY-MM-DD
    const [item] = await db.select({ todayViewsDate: news.todayViewsDate }).from(news).where(eq(news.id, id));
    if (!item) return;
    if (item.todayViewsDate === todaySA) {
      await db.update(news).set({ viewCount: sql`${news.viewCount} + 1`, todayViews: sql`${news.todayViews} + 1` }).where(eq(news.id, id));
    } else {
      await db.update(news).set({ viewCount: sql`${news.viewCount} + 1`, todayViews: 1, todayViewsDate: todaySA }).where(eq(news.id, id));
    }
  }

  async getTrendingNews(limit: number = 10): Promise<News[]> {
    const cacheKey = `trending:${limit}`;
    const cached = newsCache.get<News[]>(cacheKey);
    if (cached) return cached;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const results = await db.select().from(news)
      .where(and(
        eq(news.status, 'published'),
        gte(news.publishedAt, weekAgo)
      ))
      .orderBy(desc(news.viewCount))
      .limit(limit);

    newsCache.set(cacheKey, results, 300_000); // 5 minutes TTL
    return results;
  }

  async recordCountryView(countryCode: string, countryName: string): Promise<void> {
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
    await db.execute(sql`
      INSERT INTO view_country_stats (id, country_code, country_name, view_count, date)
      VALUES (gen_random_uuid(), ${countryCode}, ${countryName}, 1, ${todaySA})
      ON CONFLICT (country_code, date)
      DO UPDATE SET view_count = view_country_stats.view_count + 1
    `);
  }

  async getCountryStats(days: number = 30): Promise<{ countryCode: string; countryName: string; views: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

    const rows = await db.select({
      countryCode: viewCountryStats.countryCode,
      countryName: viewCountryStats.countryName,
      views: sql<string>`SUM(${viewCountryStats.viewCount})::text`,
    }).from(viewCountryStats)
      .where(sql`${viewCountryStats.date} >= ${cutoffDate}`)
      .groupBy(viewCountryStats.countryCode, viewCountryStats.countryName)
      .orderBy(sql`SUM(${viewCountryStats.viewCount}) DESC`)
      .limit(20);

    return rows.map(r => ({
      countryCode: r.countryCode,
      countryName: r.countryName,
      views: parseInt(r.views || '0'),
    }));
  }

  async recordReferrerView(source: string, sourceLabel: string): Promise<void> {
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
    await db.execute(sql`
      INSERT INTO view_referrer_stats (id, source, source_label, view_count, date)
      VALUES (gen_random_uuid(), ${source}, ${sourceLabel}, 1, ${todaySA})
      ON CONFLICT (source, date)
      DO UPDATE SET view_count = view_referrer_stats.view_count + 1
    `);
  }

  async getReferrerStats(days: number = 30): Promise<{ source: string; sourceLabel: string; views: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

    const rows = await db.select({
      source: viewReferrerStats.source,
      sourceLabel: viewReferrerStats.sourceLabel,
      views: sql<string>`SUM(${viewReferrerStats.viewCount})::text`,
    }).from(viewReferrerStats)
      .where(sql`${viewReferrerStats.date} >= ${cutoffDate}`)
      .groupBy(viewReferrerStats.source, viewReferrerStats.sourceLabel)
      .orderBy(sql`SUM(${viewReferrerStats.viewCount}) DESC`)
      .limit(20);

    return rows.map(r => ({
      source: r.source,
      sourceLabel: r.sourceLabel,
      views: parseInt(r.views || '0'),
    }));
  }

  async deleteNews(id: string): Promise<boolean> {
    const result = await db
      .delete(news)
      .where(eq(news.id, id))
      .returning();
    newsCache.delPrefix('news:');
    newsCache.delPrefix('trending:');
    return result.length > 0;
  }

  async softDeleteNews(id: string): Promise<boolean> {
    const [result] = await db
      .update(news)
      .set({ status: 'deleted', deletedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
    newsCache.delPrefix('news:');
    newsCache.delPrefix('trending:');
    return !!result;
  }

  async restoreNews(id: string): Promise<boolean> {
    const [result] = await db
      .update(news)
      .set({ status: 'published', deletedAt: null })
      .where(eq(news.id, id))
      .returning();
    return !!result;
  }

  // Category operations
  async getCategories(activeOnly: boolean = false): Promise<Category[]> {
    if (activeOnly) {
      return await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(categories.sortOrder);
    }
    return await db
      .select()
      .from(categories)
      .orderBy(categories.sortOrder);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Chat operations
  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return session;
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async createChatSession(sessionData: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async addChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(messageData as any)
      .returning();
    return message;
  }

  async getDashboardStats() {
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
    const todayStartUTC = new Date(`${todaySA}T00:00:00+03:00`).toISOString();

    const [newsStats] = await db.select({
      totalNews: sql<string>`COUNT(*)::text`,
      publishedNews: sql<string>`COUNT(*) FILTER (WHERE status = 'published')::text`,
      draftNews: sql<string>`COUNT(*) FILTER (WHERE status = 'draft')::text`,
      scheduledNews: sql<string>`COUNT(*) FILTER (WHERE status = 'scheduled')::text`,
      deletedNews: sql<string>`COUNT(*) FILTER (WHERE status = 'deleted')::text`,
      featuredNews: sql<string>`COUNT(*) FILTER (WHERE is_featured = true)::text`,
      todayNews: sql<string>`COUNT(*) FILTER (WHERE published_at >= ${todayStartUTC}::timestamptz AND status = 'published')::text`,
      miscNews: sql<string>`COUNT(*) FILTER (WHERE category IN ('misc', 'منوعات'))::text`,
      totalTranslated: sql<string>`COUNT(*) FILTER (WHERE is_translated = true)::text`,
      todayTranslated: sql<string>`COUNT(*) FILTER (WHERE is_translated = true AND published_at >= ${todayStartUTC}::timestamptz AND status = 'published')::text`,
      totalViews: sql<string>`COALESCE(SUM(view_count), 0)::text`,
      todayViews: sql<string>`COALESCE(SUM(CASE WHEN today_views_date = ${todaySA} AND status != 'deleted' THEN today_views ELSE 0 END), 0)::text`,
    }).from(news);

    const [articleStats] = await db.select({
      totalArticles: sql<string>`COUNT(*)::text`,
      publishedArticles: sql<string>`COUNT(*) FILTER (WHERE status = 'published')::text`,
      draftArticles: sql<string>`COUNT(*) FILTER (WHERE status = 'draft')::text`,
      miscArticles: sql<string>`COUNT(*) FILTER (WHERE category IN ('misc', 'منوعات'))::text`,
    }).from(articles);

    const [userCount] = await db.select({ c: sql<string>`COUNT(*)::text` }).from(users);
    const [sessionCount] = await db.select({ c: sql<string>`COUNT(*)::text` }).from(chatSessions);
    const [messageCount] = await db.select({ c: sql<string>`COUNT(*)::text` }).from(chatMessages);
    const [radarTotal] = await db.select({ c: sql<string>`COUNT(*)::text` }).from(radarSources);
    const [radarActive] = await db.select({ c: sql<string>`COUNT(*) FILTER (WHERE is_active = true)::text` }).from(radarSources);

    const p = (v: string | null) => parseInt(v || '0');

    const totalNews = p(newsStats.totalNews);
    const publishedNews = p(newsStats.publishedNews);
    const miscNews = p(newsStats.miscNews);
    const totalArticles = p(articleStats.totalArticles);
    const publishedArticles = p(articleStats.publishedArticles);
    const miscArticles = p(articleStats.miscArticles);

    return {
      totalNews,
      publishedNews,
      draftNews: p(newsStats.draftNews),
      scheduledNews: p(newsStats.scheduledNews),
      deletedNews: p(newsStats.deletedNews),
      featuredNews: p(newsStats.featuredNews),
      todayNews: p(newsStats.todayNews),
      miscNews,
      totalTranslated: p(newsStats.totalTranslated),
      todayTranslated: p(newsStats.todayTranslated),
      totalViews: p(newsStats.totalViews),
      todayViews: p(newsStats.todayViews),
      totalArticles,
      publishedArticles,
      draftArticles: p(articleStats.draftArticles),
      miscArticles,
      totalContent: totalNews + totalArticles,
      publishedContent: publishedNews + publishedArticles,
      unclassified: miscNews + miscArticles,
      totalUsers: p(userCount.c),
      totalChatSessions: p(sessionCount.c),
      totalChatMessages: p(messageCount.c),
      totalRadarSources: p(radarTotal.c),
      activeRadarSources: p(radarActive.c),
    };
  }

  async getChartData(days: number = 7): Promise<{
    timeseries: { date: string; newsCount: number; views: number }[];
    categories: { name: string; count: number }[];
    radarSourcesActivity: { name: string; count: number }[];
  }> {
    const tz = 'Asia/Riyadh';
    const dateList: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateList.push(d.toLocaleDateString('en-CA', { timeZone: tz }));
    }

    const startDate = dateList[0];
    const startUTC = new Date(`${startDate}T00:00:00+03:00`).toISOString();

    const newsCountRows = await db.select({
      day: sql<string>`(COALESCE(created_at, published_at) AT TIME ZONE 'Asia/Riyadh')::date::text`,
      cnt: sql<string>`COUNT(*)::text`,
    }).from(news)
      .where(sql`status != 'deleted' AND COALESCE(created_at, published_at) >= ${startUTC}::timestamptz`)
      .groupBy(sql`(COALESCE(created_at, published_at) AT TIME ZONE 'Asia/Riyadh')::date`);

    const viewRows = await db.select({
      day: news.todayViewsDate,
      views: sql<string>`COALESCE(SUM(today_views), 0)::text`,
    }).from(news)
      .where(sql`today_views_date >= ${startDate} AND status != 'deleted'`)
      .groupBy(news.todayViewsDate);

    const byDay: Record<string, { newsCount: number; views: number }> = {};
    dateList.forEach(d => { byDay[d] = { newsCount: 0, views: 0 }; });
    for (const r of newsCountRows) { if (r.day && byDay[r.day]) byDay[r.day].newsCount = parseInt(r.cnt || '0'); }
    for (const r of viewRows) { if (r.day && byDay[r.day]) byDay[r.day].views = parseInt(r.views || '0'); }
    const timeseries = dateList.map(d => ({ date: d, ...byDay[d] }));

    const catRows = await db.select({
      name: sql<string>`COALESCE(category, 'misc')`,
      count: sql<string>`COUNT(*)::text`,
    }).from(news)
      .where(eq(news.status, 'published'))
      .groupBy(sql`COALESCE(category, 'misc')`)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(8);
    const categories = catRows.map(r => ({ name: r.name, count: parseInt(r.count || '0') }));

    const allSources = await db.select({
      name: radarSources.nameAr,
      nameEn: radarSources.name,
      itemsCount: radarSources.itemsCount,
    }).from(radarSources).where(eq(radarSources.isActive, true));

    const radarSourcesActivity = allSources
      .sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0))
      .slice(0, 8)
      .map(s => ({ name: (s.name || s.nameEn || '').slice(0, 18), count: s.itemsCount || 0 }));

    return { timeseries, categories, radarSourcesActivity };
  }

  async getAnalyticsForAI(): Promise<{
    categoryPerformance: { category: string; count: number; views: number; avgViews: number }[];
    publishingTrend: { date: string; count: number }[];
    topPerformingNews: { title: string; category: string; views: number }[];
    lowPerformingCategories: { category: string; count: number; avgViews: number }[];
    totalStats: { published: number; totalViews: number; avgViewsPerNews: number; daysActive: number };
    radarSourcePerformance: { name: string; itemsCount: number }[];
  }> {
    const tz = 'Asia/Riyadh';

    const allItems = await db.select({
      id: news.id,
      title: news.title,
      category: news.category,
      status: news.status,
      viewCount: news.viewCount,
      publishedAt: news.publishedAt,
      createdAt: news.createdAt,
    }).from(news).where(ne(news.status, 'deleted'));

    const published = allItems.filter(i => i.status === 'published');

    const catMap: Record<string, { count: number; views: number }> = {};
    for (const item of published) {
      const cat = item.category || 'misc';
      if (!catMap[cat]) catMap[cat] = { count: 0, views: 0 };
      catMap[cat].count++;
      catMap[cat].views += item.viewCount || 0;
    }
    const categoryPerformance = Object.entries(catMap)
      .map(([category, d]) => ({
        category,
        count: d.count,
        views: d.views,
        avgViews: d.count > 0 ? Math.round(d.views / d.count) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    const last30: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last30.push(d.toLocaleDateString('en-CA', { timeZone: tz }));
    }
    const dayCount: Record<string, number> = {};
    last30.forEach(d => { dayCount[d] = 0; });
    for (const item of allItems) {
      const dt = item.createdAt || item.publishedAt;
      if (dt) {
        const dayStr = new Date(dt).toLocaleDateString('en-CA', { timeZone: tz });
        if (dayCount[dayStr] !== undefined) dayCount[dayStr]++;
      }
    }
    const publishingTrend = last30.map(d => ({ date: d, count: dayCount[d] }));

    const topPerformingNews = [...published]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map(n => ({ title: n.title, category: n.category || 'misc', views: n.viewCount || 0 }));

    const lowPerformingCategories = categoryPerformance
      .filter(c => c.avgViews < 50 && c.count >= 3)
      .sort((a, b) => a.avgViews - b.avgViews);

    const totalViews = published.reduce((s, n) => s + (n.viewCount || 0), 0);
    const dates = published.map(n => new Date(n.createdAt || n.publishedAt || Date.now()).getTime());
    const oldestDate = dates.length ? Math.min(...dates) : Date.now();
    const daysActive = Math.max(1, Math.ceil((Date.now() - oldestDate) / 86400000));

    const allSources = await db.select({
      name: radarSources.nameAr,
      nameEn: radarSources.name,
      itemsCount: radarSources.itemsCount,
      isActive: radarSources.isActive,
    }).from(radarSources);

    const radarSourcePerformance = allSources
      .filter(s => s.isActive)
      .sort((a, b) => (b.itemsCount || 0) - (a.itemsCount || 0))
      .slice(0, 10)
      .map(s => ({ name: s.name || s.nameEn || '', itemsCount: s.itemsCount || 0 }));

    return {
      categoryPerformance,
      publishingTrend,
      topPerformingNews,
      lowPerformingCategories,
      totalStats: {
        published: published.length,
        totalViews,
        avgViewsPerNews: published.length > 0 ? Math.round(totalViews / published.length) : 0,
        daysActive,
      },
      radarSourcePerformance,
    };
  }

  // User management operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // ==========================================
  // Radar Sources Operations
  // ==========================================

  async getRadarSources(activeOnly: boolean = false): Promise<RadarSource[]> {
    if (activeOnly) {
      return await db.select().from(radarSources).where(eq(radarSources.isActive, true)).orderBy(desc(radarSources.priority));
    }
    return await db.select().from(radarSources).orderBy(desc(radarSources.priority));
  }

  async getRadarSource(id: string): Promise<RadarSource | undefined> {
    const [source] = await db.select().from(radarSources).where(eq(radarSources.id, id));
    return source;
  }

  async createRadarSource(source: InsertRadarSource): Promise<RadarSource> {
    const [created] = await db.insert(radarSources).values(source).returning();
    return created;
  }

  async updateRadarSource(id: string, data: Partial<InsertRadarSource>): Promise<RadarSource | undefined> {
    const [updated] = await db
      .update(radarSources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(radarSources.id, id))
      .returning();
    return updated;
  }

  async deleteRadarSource(id: string): Promise<boolean> {
    const result = await db.delete(radarSources).where(eq(radarSources.id, id));
    return true;
  }

  async updateSourceFetchStatus(id: string, status: string, error?: string, itemsCount?: number): Promise<void> {
    await db.update(radarSources).set({
      lastFetchAt: new Date(),
      lastFetchStatus: status,
      lastFetchError: error || null,
      itemsCount: itemsCount !== undefined ? itemsCount : undefined,
      updatedAt: new Date(),
    }).where(eq(radarSources.id, id));
  }

  // ==========================================
  // Radar Keywords Operations
  // ==========================================

  async getRadarKeywords(category?: string): Promise<RadarKeyword[]> {
    if (category) {
      return await db.select().from(radarKeywords).where(eq(radarKeywords.category, category));
    }
    return await db.select().from(radarKeywords).orderBy(desc(radarKeywords.weight));
  }

  async createRadarKeyword(keyword: InsertRadarKeyword): Promise<RadarKeyword> {
    const [created] = await db.insert(radarKeywords).values(keyword).returning();
    return created;
  }

  async updateRadarKeyword(id: string, data: Partial<InsertRadarKeyword>): Promise<RadarKeyword | undefined> {
    const [updated] = await db
      .update(radarKeywords)
      .set(data)
      .where(eq(radarKeywords.id, id))
      .returning();
    return updated;
  }

  async deleteRadarKeyword(id: string): Promise<boolean> {
    await db.delete(radarKeywords).where(eq(radarKeywords.id, id));
    return true;
  }

  // ==========================================
  // Radar Items Operations
  // ==========================================

  async getRadarItems(options: {
    status?: string;
    sourceId?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<RadarItem[]> {
    const conditions = [];
    
    if (options.status) {
      conditions.push(eq(radarItems.status, options.status));
    }
    if (options.sourceId) {
      conditions.push(eq(radarItems.sourceId, options.sourceId));
    }
    if (options.category) {
      conditions.push(eq(radarItems.category, options.category));
    }
    if (options.search) {
      conditions.push(or(
        like(radarItems.title, `%${options.search}%`),
        like(radarItems.titleAr, `%${options.search}%`)
      ));
    }

    let query = db.select().from(radarItems);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query
      .orderBy(desc(radarItems.fetchedAt))
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  async getRadarItem(id: string): Promise<RadarItem | undefined> {
    const [item] = await db.select().from(radarItems).where(eq(radarItems.id, id));
    return item;
  }

  async getRadarItemByExternalId(externalId: string): Promise<RadarItem | undefined> {
    const [item] = await db.select().from(radarItems).where(eq(radarItems.externalId, externalId));
    return item;
  }

  async createRadarItem(item: InsertRadarItem): Promise<RadarItem> {
    const [created] = await db.insert(radarItems).values(item as any).returning();
    return created;
  }

  async updateRadarItem(id: string, data: Partial<InsertRadarItem>): Promise<RadarItem | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const [updated] = await db
      .update(radarItems)
      .set(updateData)
      .where(eq(radarItems.id, id))
      .returning();
    return updated;
  }

  async toggleRadarItemBreaking(id: string, isBreaking: boolean): Promise<RadarItem | undefined> {
    const [updated] = await db
      .update(radarItems)
      .set({ isBreaking, updatedAt: new Date() })
      .where(eq(radarItems.id, id))
      .returning();
    return updated;
  }

  async updateRadarItemStatus(id: string, status: string, reviewedBy?: string, reviewNotes?: string): Promise<RadarItem | undefined> {
    const [updated] = await db
      .update(radarItems)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(radarItems.id, id))
      .returning();
    return updated;
  }

  async getRadarItemsStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  }> {
    const rows = await db
      .select({
        status: radarItems.status,
        count: sql<number>`count(*)::int`,
      })
      .from(radarItems)
      .groupBy(radarItems.status);

    const map: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      map[row.status] = row.count;
      total += row.count;
    }
    return {
      total,
      pending: map['pending'] || 0,
      approved: map['approved'] || 0,
      rejected: map['rejected'] || 0,
      published: map['published'] || 0,
    };
  }

  // ==========================================
  // Radar Alerts Operations
  // ==========================================

  async getRadarAlerts(activeOnly: boolean = false): Promise<RadarAlert[]> {
    if (activeOnly) {
      return await db.select().from(radarAlerts).where(eq(radarAlerts.isActive, true));
    }
    return await db.select().from(radarAlerts);
  }

  async createRadarAlert(alert: InsertRadarAlert): Promise<RadarAlert> {
    const [created] = await db.insert(radarAlerts).values(alert as any).returning();
    return created;
  }

  async updateRadarAlert(id: string, data: Partial<InsertRadarAlert>): Promise<RadarAlert | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const [updated] = await db
      .update(radarAlerts)
      .set(updateData)
      .where(eq(radarAlerts.id, id))
      .returning();
    return updated;
  }

  async deleteRadarAlert(id: string): Promise<boolean> {
    await db.delete(radarAlerts).where(eq(radarAlerts.id, id));
    return true;
  }

  async deleteRadarItemsByIds(ids: string[]): Promise<number> {
    if (!ids.length) return 0;
    const result = await db.delete(radarItems)
      .where(inArray(radarItems.id, ids))
      .returning({ id: radarItems.id });
    return result.length;
  }

  async deleteReviewedRadarItems(): Promise<number> {
    const reviewedStatuses = ['approved', 'rejected', 'published', 'archived'];
    const result = await db.delete(radarItems)
      .where(inArray(radarItems.status, reviewedStatuses))
      .returning({ id: radarItems.id });
    return result.length;
  }

  async addExcludedSeedUrl(url: string): Promise<void> {
    await db.insert(radarExcludedSeeds).values({ url }).onConflictDoNothing();
  }

  async getExcludedSeedUrls(): Promise<string[]> {
    const rows = await db.select({ url: radarExcludedSeeds.url }).from(radarExcludedSeeds);
    return rows.map(r => r.url);
  }

  // ==========================================
  // Radar Notifications Operations
  // ==========================================

  async getRadarNotifications(unreadOnly: boolean = false, limit: number = 50): Promise<RadarNotification[]> {
    if (unreadOnly) {
      return await db.select().from(radarNotifications)
        .where(eq(radarNotifications.isRead, false))
        .orderBy(desc(radarNotifications.createdAt))
        .limit(limit);
    }
    return await db.select().from(radarNotifications)
      .orderBy(desc(radarNotifications.createdAt))
      .limit(limit);
  }

  async createRadarNotification(notification: InsertRadarNotification): Promise<RadarNotification> {
    const [created] = await db.insert(radarNotifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(radarNotifications).set({
      isRead: true,
      readAt: new Date(),
    }).where(eq(radarNotifications.id, id));
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(radarNotifications).set({
      isRead: true,
      readAt: new Date(),
    }).where(eq(radarNotifications.isRead, false));
  }

  // ==========================================
  // Radar Fetch Logs Operations
  // ==========================================

  async createFetchLog(sourceId: string): Promise<RadarFetchLog> {
    const [log] = await db.insert(radarFetchLogs).values({
      sourceId,
      status: 'running',
    }).returning();
    return log;
  }

  async completeFetchLog(id: string, status: string, itemsFetched: number, itemsNew: number, itemsDuplicate: number, errorMessage?: string): Promise<void> {
    await db.update(radarFetchLogs).set({
      completedAt: new Date(),
      status,
      itemsFetched,
      itemsNew,
      itemsDuplicate,
      errorMessage,
    }).where(eq(radarFetchLogs.id, id));
  }

  async getRecentFetchLogs(sourceId?: string, limit: number = 20): Promise<RadarFetchLog[]> {
    if (sourceId) {
      return await db.select().from(radarFetchLogs)
        .where(eq(radarFetchLogs.sourceId, sourceId))
        .orderBy(desc(radarFetchLogs.startedAt))
        .limit(limit);
    }
    return await db.select().from(radarFetchLogs)
      .orderBy(desc(radarFetchLogs.startedAt))
      .limit(limit);
  }

  // ==========================================
  // AI Image Generation Operations
  // ==========================================

  async getGenerationSettings(): Promise<GenerationSettings | undefined> {
    const [settings] = await db.select().from(generationSettings).limit(1);
    return settings;
  }

  async upsertGenerationSettings(data: InsertGenerationSettings): Promise<GenerationSettings> {
    const existing = await this.getGenerationSettings();
    if (existing) {
      const [updated] = await db.update(generationSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(generationSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(generationSettings).values(data).returning();
    return created;
  }

  async getMonthlyUsage(userId: string | null, month: string): Promise<GenerationUsage | undefined> {
    if (userId) {
      const [usage] = await db.select().from(generationUsage)
        .where(and(eq(generationUsage.userId, userId), eq(generationUsage.month, month)));
      return usage;
    }
    const [usage] = await db.select().from(generationUsage)
      .where(and(isNull(generationUsage.userId), eq(generationUsage.month, month)));
    return usage;
  }

  async incrementUsage(userId: string | null, month: string, images: number = 0, infographics: number = 0, credits: number = 0): Promise<GenerationUsage> {
    const existing = await this.getMonthlyUsage(userId, month);
    if (existing) {
      const [updated] = await db.update(generationUsage)
        .set({
          imagesGenerated: existing.imagesGenerated + images,
          infographicsGenerated: existing.infographicsGenerated + infographics,
          totalCreditsUsed: existing.totalCreditsUsed + credits,
          updatedAt: new Date(),
        })
        .where(eq(generationUsage.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(generationUsage).values({
      userId,
      month,
      imagesGenerated: images,
      infographicsGenerated: infographics,
      totalCreditsUsed: credits,
    }).returning();
    return created;
  }

  async getTotalMonthlyUsage(month: string): Promise<{ images: number; infographics: number; credits: number }> {
    const result = await db.select({
      images: sql<number>`COALESCE(SUM(${generationUsage.imagesGenerated}), 0)`,
      infographics: sql<number>`COALESCE(SUM(${generationUsage.infographicsGenerated}), 0)`,
      credits: sql<number>`COALESCE(SUM(${generationUsage.totalCreditsUsed}), 0)`,
    }).from(generationUsage).where(eq(generationUsage.month, month));
    return result[0] || { images: 0, infographics: 0, credits: 0 };
  }

  async createImageGeneration(data: InsertImageGeneration): Promise<ImageGeneration> {
    const [generation] = await db.insert(imageGenerations).values(data).returning();
    return generation;
  }

  async updateImageGeneration(id: string, data: Partial<ImageGeneration>): Promise<ImageGeneration | undefined> {
    const [updated] = await db.update(imageGenerations)
      .set(data)
      .where(eq(imageGenerations.id, id))
      .returning();
    return updated;
  }

  async getImageGeneration(id: string): Promise<ImageGeneration | undefined> {
    const [generation] = await db.select().from(imageGenerations)
      .where(eq(imageGenerations.id, id));
    return generation;
  }

  async getImageGenerations(filters?: { userId?: string; newsId?: string; status?: string }, limit: number = 50): Promise<ImageGeneration[]> {
    let query = db.select().from(imageGenerations);
    const conditions = [];
    if (filters?.userId) conditions.push(eq(imageGenerations.userId, filters.userId));
    if (filters?.newsId) conditions.push(eq(imageGenerations.newsId, filters.newsId));
    if (filters?.status) conditions.push(eq(imageGenerations.status, filters.status));
    
    if (conditions.length > 0) {
      return await db.select().from(imageGenerations)
        .where(and(...conditions))
        .orderBy(desc(imageGenerations.createdAt))
        .limit(limit);
    }
    return await db.select().from(imageGenerations)
      .orderBy(desc(imageGenerations.createdAt))
      .limit(limit);
  }

  // ==========================================
  // Infographic Operations
  // ==========================================

  async getInfographicTemplates(activeOnly: boolean = true): Promise<InfographicTemplate[]> {
    if (activeOnly) {
      return await db.select().from(infographicTemplates)
        .where(eq(infographicTemplates.isActive, true))
        .orderBy(asc(infographicTemplates.sortOrder));
    }
    return await db.select().from(infographicTemplates)
      .orderBy(asc(infographicTemplates.sortOrder));
  }

  async getInfographicTemplate(id: string): Promise<InfographicTemplate | undefined> {
    const [template] = await db.select().from(infographicTemplates)
      .where(eq(infographicTemplates.id, id));
    return template;
  }

  async createInfographicTemplate(data: InsertInfographicTemplate): Promise<InfographicTemplate> {
    const [template] = await db.insert(infographicTemplates).values(data).returning();
    return template;
  }

  async updateInfographicTemplate(id: string, data: Partial<InsertInfographicTemplate>): Promise<InfographicTemplate | undefined> {
    const [updated] = await db.update(infographicTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(infographicTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteInfographicTemplate(id: string): Promise<boolean> {
    const result = await db.delete(infographicTemplates).where(eq(infographicTemplates.id, id));
    return true;
  }

  async createInfographicJob(data: InsertInfographicJob): Promise<InfographicJob> {
    const [job] = await db.insert(infographicJobs).values(data).returning();
    return job;
  }

  async updateInfographicJob(id: string, data: Partial<InfographicJob>): Promise<InfographicJob | undefined> {
    const [updated] = await db.update(infographicJobs)
      .set(data)
      .where(eq(infographicJobs.id, id))
      .returning();
    return updated;
  }

  async getInfographicJob(id: string): Promise<InfographicJob | undefined> {
    const [job] = await db.select().from(infographicJobs)
      .where(eq(infographicJobs.id, id));
    return job;
  }

  async searchArchive(query: string, limit: number = 8): Promise<{
    news: Array<{ id: string; title: string; summary: string | null; content: string; category: string; publishedAt: Date | null; shortCode: string | null; imageUrl: string | null; relevanceScore: number }>;
    articles: Array<{ id: string; slug: string; title: string; excerpt: string; content: string; category: string; publishedAt: Date | null; relevanceScore: number }>;
  }> {
    // Extract meaningful Arabic/English keywords from the natural-language query
    const ARABIC_STOP_WORDS = new Set([
      'من','في','على','مع','عن','إلى','الى','هل','ما','ماذا','كيف','لماذا','متى','أين','اين',
      'هذا','هذه','ذلك','تلك','هو','هي','هم','هن','انا','نحن','انت','انتم',
      'كان','يكون','كانت','لا','نعم','قد','لقد','حتى','بعد','قبل','أو','او',
      'و','ف','ب','ل','ك','أن','ان','إن','إذ','إذا','اذا','لأن','لكن',
      'آخر','اخر','أحدث','احدث','اخبار','خبر','مقال','مقالات','معلومات',
      'تحدث','يتحدث','تخص','حول','عن','بشأن','بخصوص','لي','لنا','لهم',
      'أريد','اريد','أبحث','ابحث','اعطني','أخبرني','اخبرني','لخص','لخصي',
    ]);

    const tokens = query
      .replace(/[؟?!،,\.。\-_()[\]{}]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2 && !ARABIC_STOP_WORDS.has(t));

    // Deduplicate and cap tokens for query safety
    const uniqueTokens = [...new Set(tokens)].slice(0, 6);

    // If no meaningful tokens, fall back to the raw query trimmed
    const searchTokens = uniqueTokens.length > 0 ? uniqueTokens : [query.trim().slice(0, 50)];

    // Build OR filter conditions per token across all text fields
    const buildTokenFilter = (table: 'news' | 'articles') => {
      const titleCol = table === 'news' ? news.title : articles.title;
      const summaryCol = table === 'news' ? news.summary : articles.excerpt;
      const contentCol = table === 'news' ? news.content : articles.content;

      const termConditions = searchTokens.map(token => {
        const t = `%${token}%`;
        return or(
          ilike(titleCol, t),
          ilike(summaryCol, t),
          sql`${contentCol} ILIKE ${t}`,
          ...(table === 'news' ? [sql`${news.keywords}::text ILIKE ${t}`] : [])
        );
      });
      return or(...termConditions);
    };

    // Build relevance score: title match = 3 pts, summary/excerpt = 2 pts, content = 1 pt per token
    const buildScoreExpr = (table: 'news' | 'articles') => {
      const titleCol = table === 'news' ? news.title : articles.title;
      const summaryCol = table === 'news' ? news.summary : articles.excerpt;
      const contentCol = table === 'news' ? news.content : articles.content;

      const parts = searchTokens.flatMap(token => {
        const t = `%${token}%`;
        return [
          sql`CASE WHEN ${titleCol} ILIKE ${t} THEN 3 ELSE 0 END`,
          sql`CASE WHEN ${summaryCol} ILIKE ${t} THEN 2 ELSE 0 END`,
          sql`CASE WHEN ${contentCol} ILIKE ${t} THEN 1 ELSE 0 END`,
        ];
      });
      return sql.join(parts, sql` + `);
    };

    const [newsResults, articleResults] = await Promise.all([
      db
        .select({
          id: news.id,
          title: news.title,
          summary: news.summary,
          content: news.content,
          category: news.category,
          publishedAt: news.publishedAt,
          shortCode: news.shortCode,
          imageUrl: news.imageUrl,
          relevanceScore: sql<number>`(${buildScoreExpr('news')})`,
        })
        .from(news)
        .where(and(eq(news.status, 'published'), buildTokenFilter('news')))
        .orderBy(sql`(${buildScoreExpr('news')}) DESC`, desc(news.publishedAt))
        .limit(limit),

      db
        .select({
          id: articles.id,
          slug: articles.slug,
          title: articles.title,
          excerpt: articles.excerpt,
          content: articles.content,
          category: articles.category,
          publishedAt: articles.publishedAt,
          relevanceScore: sql<number>`(${buildScoreExpr('articles')})`,
        })
        .from(articles)
        .where(and(eq(articles.status, 'published'), buildTokenFilter('articles')))
        .orderBy(sql`(${buildScoreExpr('articles')}) DESC`, desc(articles.publishedAt))
        .limit(limit),
    ]);

    // Merge and return top-N by relevance score (global ranking)
    const combined = [
      ...newsResults.map(n => ({ ...n, _type: 'news' as const })),
      ...articleResults.map(a => ({ ...a, _type: 'article' as const })),
    ].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    const topNews = combined
      .filter(r => r._type === 'news')
      .slice(0, limit)
      .map(({ _type, ...r }) => r as typeof newsResults[number]);

    const topArticles = combined
      .filter(r => r._type === 'article')
      .slice(0, Math.max(2, Math.ceil(limit / 3)))
      .map(({ _type, ...r }) => r as typeof articleResults[number]);

    return { news: topNews, articles: topArticles };
  }

  async getInfographicJobs(filters?: { userId?: string; status?: string }, limit: number = 50): Promise<InfographicJob[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(infographicJobs.userId, filters.userId));
    if (filters?.status) conditions.push(eq(infographicJobs.status, filters.status));
    
    if (conditions.length > 0) {
      return await db.select().from(infographicJobs)
        .where(and(...conditions))
        .orderBy(desc(infographicJobs.createdAt))
        .limit(limit);
    }
    return await db.select().from(infographicJobs)
      .orderBy(desc(infographicJobs.createdAt))
      .limit(limit);
  }

  // ==========================================
  // Advertisement Operations
  // ==========================================

  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  async getAdvertisementById(id: string): Promise<Advertisement | undefined> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    return ad;
  }

  async getActiveAdByPosition(position: string): Promise<Ad | null> {
    const activeAds = await db.select().from(ads).where(and(eq(ads.position, position), eq(ads.isActive, true)));
    if (!activeAds.length) return null;
    const totalWeight = activeAds.reduce((sum, ad) => sum + ad.weight, 0);
    let random = Math.random() * totalWeight;
    for (const ad of activeAds) {
      random -= ad.weight;
      if (random <= 0) return ad;
    }
    return activeAds[activeAds.length - 1];
  }

  async getActiveAdsByPosition(position: string): Promise<Advertisement[]> {
    const now = new Date();
    return await db.select().from(advertisements).where(
      and(
        eq(advertisements.position, position),
        eq(advertisements.isActive, true),
        or(isNull(advertisements.startsAt), lte(advertisements.startsAt, now)),
        or(isNull(advertisements.expiresAt), gte(advertisements.expiresAt, now))
      )
    ).orderBy(desc(advertisements.createdAt));
  }

  async createAdvertisement(data: InsertAdvertisement): Promise<Advertisement> {
    const [ad] = await db.insert(advertisements).values(data).returning();
    return ad;
  }

  async updateAdvertisement(id: string, data: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db.update(advertisements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return updated;
  }

  // Rumor Submissions Operations
  // ==========================================

  async createRumorSubmission(data: InsertRumorSubmission): Promise<RumorSubmission> {
    const [created] = await db.insert(rumorSubmissions).values(data as any).returning();
    return created;
  }

  async getRumorSubmissions(status?: string, limit: number = 100): Promise<RumorSubmission[]> {
    if (status) {
      return await db.select().from(rumorSubmissions)
        .where(eq(rumorSubmissions.status, status))
        .orderBy(desc(rumorSubmissions.createdAt))
        .limit(limit);
    }
    return await db.select().from(rumorSubmissions)
      .orderBy(desc(rumorSubmissions.createdAt))
      .limit(limit);
  }

  async getRumorSubmissionById(id: string): Promise<RumorSubmission | undefined> {
    const [rumor] = await db.select().from(rumorSubmissions).where(eq(rumorSubmissions.id, id));
    return rumor;
  }

  async updateRumorSubmission(id: string, data: Partial<RumorSubmission>): Promise<RumorSubmission | undefined> {
    const [updated] = await db.update(rumorSubmissions)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(rumorSubmissions.id, id))
      .returning();
    return updated;
  }

  async deleteAdvertisement(id: string): Promise<boolean> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
    return true;
  }

  async resetAdStats(id: string): Promise<Advertisement | undefined> {
    const [updated] = await db.update(advertisements)
      .set({ clickCount: 0, impressionCount: 0, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return updated;
  }


  async deactivateExpiredAds(): Promise<number> {
    const now = new Date();
    const result = await db.update(advertisements)
      .set({ isActive: false, updatedAt: now })
      .where(
        and(
          eq(advertisements.isActive, true),
          sql`${advertisements.expiresAt} IS NOT NULL AND ${advertisements.expiresAt} < ${now}`
        )
      )
      .returning({ id: advertisements.id });
    return result.length;
  }

  // WhatsApp Operations
  // ==========================================

  async getWhatsappSubscribers(filters?: { status?: string; isActive?: boolean }): Promise<WhatsappSubscriber[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(whatsappSubscribers.status, filters.status));
    if (filters?.isActive !== undefined) conditions.push(eq(whatsappSubscribers.isActive, filters.isActive));
    if (conditions.length > 0) {
      return await db.select().from(whatsappSubscribers)
        .where(and(...conditions))
        .orderBy(desc(whatsappSubscribers.subscribedAt));
    }
    return await db.select().from(whatsappSubscribers)
      .orderBy(desc(whatsappSubscribers.subscribedAt));
  }

  async getWhatsappSubscriberByPhone(phone: string): Promise<WhatsappSubscriber | undefined> {
    const [subscriber] = await db.select().from(whatsappSubscribers)
      .where(eq(whatsappSubscribers.phone, phone));
    return subscriber;
  }

  async createWhatsappSubscriber(data: InsertWhatsappSubscriber): Promise<WhatsappSubscriber> {
    const [subscriber] = await db.insert(whatsappSubscribers).values(data).returning();
    return subscriber;
  }

  async updateWhatsappSubscriber(id: string, data: Partial<WhatsappSubscriber>): Promise<WhatsappSubscriber | undefined> {
    const [updated] = await db.update(whatsappSubscribers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(whatsappSubscribers.id, id))
      .returning();
    return updated;
  }

  async getActiveWhatsappSubscribers(interests?: string[]): Promise<WhatsappSubscriber[]> {
    const activeSubscribers = await db.select().from(whatsappSubscribers)
      .where(and(
        eq(whatsappSubscribers.isActive, true),
        eq(whatsappSubscribers.status, "active")
      ))
      .orderBy(desc(whatsappSubscribers.subscribedAt));

    if (!interests || interests.length === 0) return activeSubscribers;

    return activeSubscribers.filter(sub => {
      const subInterests = (sub.interests as string[]) || [];
      if (subInterests.length === 0) return true;
      return interests.some(i => subInterests.includes(i));
    });
  }

  async getWhatsappSubscriberStats(): Promise<{ total: number; active: number; pending: number; unsubscribed: number }> {
    const all = await db.select().from(whatsappSubscribers);
    return {
      total: all.length,
      active: all.filter(s => s.status === "active" && s.isActive).length,
      pending: all.filter(s => s.status === "pending").length,
      unsubscribed: all.filter(s => !s.isActive || s.status === "unsubscribed").length,
    };
  }

  async getWhatsappNewsletters(limit: number = 50): Promise<WhatsappNewsletter[]> {
    return await db.select().from(whatsappNewsletters)
      .orderBy(desc(whatsappNewsletters.createdAt))
      .limit(limit);
  }

  async getWhatsappNewsletter(id: string): Promise<WhatsappNewsletter | undefined> {
    const [newsletter] = await db.select().from(whatsappNewsletters)
      .where(eq(whatsappNewsletters.id, id));
    return newsletter;
  }

  async createWhatsappNewsletter(data: InsertWhatsappNewsletter): Promise<WhatsappNewsletter> {
    const [newsletter] = await db.insert(whatsappNewsletters).values(data).returning();
    return newsletter;
  }

  async updateWhatsappNewsletter(id: string, data: Partial<WhatsappNewsletter>): Promise<WhatsappNewsletter | undefined> {
    const [updated] = await db.update(whatsappNewsletters)
      .set(data)
      .where(eq(whatsappNewsletters.id, id))
      .returning();
    return updated;
  }

  async deleteWhatsappNewsletter(id: string): Promise<void> {
    await db.delete(whatsappNewsletters).where(eq(whatsappNewsletters.id, id));
  }

  async getScheduledWhatsappNewslettersDue(): Promise<WhatsappNewsletter[]> {
    const now = new Date();
    return await db.select().from(whatsappNewsletters)
      .where(
        and(
          eq(whatsappNewsletters.status, "scheduled"),
          lte(whatsappNewsletters.scheduledAt, now)
        )
      )
      .orderBy(whatsappNewsletters.scheduledAt);
  }

  async claimScheduledNewsletter(id: string): Promise<boolean> {
    const result = await db.update(whatsappNewsletters)
      .set({ status: "sending" })
      .where(
        and(
          eq(whatsappNewsletters.id, id),
          eq(whatsappNewsletters.status, "scheduled")
        )
      )
      .returning();
    return result.length > 0;
  }

  async cancelScheduledNewsletter(id: string): Promise<boolean> {
    const result = await db.update(whatsappNewsletters)
      .set({ status: "canceled" })
      .where(
        and(
          eq(whatsappNewsletters.id, id),
          eq(whatsappNewsletters.status, "scheduled")
        )
      )
      .returning();
    return result.length > 0;
  }

  async getWhatsappSettings(): Promise<WhatsappSettings | undefined> {
    const [settings] = await db.select().from(whatsappSettings)
      .where(eq(whatsappSettings.id, "default"));
    return settings;
  }

  async upsertWhatsappSettings(data: Partial<WhatsappSettings>): Promise<WhatsappSettings> {
    const existing = await this.getWhatsappSettings();
    if (existing) {
      const [updated] = await db.update(whatsappSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(whatsappSettings.id, "default"))
        .returning();
      return updated;
    }
    const [created] = await db.insert(whatsappSettings)
      .values({ id: "default", ...data } as any)
      .returning();
    return created;
  }

  async getPublishedRumors(limit: number = 10): Promise<RumorSubmission[]> {
    return await db.select().from(rumorSubmissions)
      .where(eq(rumorSubmissions.status, "published"))
      .orderBy(desc(rumorSubmissions.createdAt))
      .limit(limit);
  }

  async incrementRumorViewCount(id: string): Promise<void> {
    await db.update(rumorSubmissions)
      .set({ viewCount: sql`${rumorSubmissions.viewCount} + 1` })
      .where(eq(rumorSubmissions.id, id));
  }

  // ==========================================
  // Ads Operations (weighted rotation)
  // ==========================================

  async getAds(position?: string): Promise<Ad[]> {
    if (position) {
      return await db.select().from(ads).where(eq(ads.position, position)).orderBy(desc(ads.createdAt));
    }
    return await db.select().from(ads).orderBy(desc(ads.createdAt));
  }

  async createAd(adData: InsertAd): Promise<Ad> {
    const [ad] = await db.insert(ads).values(adData).returning();
    return ad;
  }

  async updateAd(id: string, data: Partial<InsertAd>): Promise<Ad | undefined> {
    const [updated] = await db.update(ads).set(data).where(eq(ads.id, id)).returning();
    return updated;
  }

  async deleteAd(id: string): Promise<boolean> {
    const result = await db.delete(ads).where(eq(ads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Health Trend Radar operations
  async getHealthTrends(limit: number = 10): Promise<HealthTrend[]> {
    return await db.select().from(healthTrends)
      .orderBy(desc(healthTrends.trendScore))
      .limit(limit);
  }

  async getHealthTrendById(id: string): Promise<HealthTrend | undefined> {
    const [trend] = await db.select().from(healthTrends).where(eq(healthTrends.id, id));
    return trend;
  }

  async upsertHealthTrend(trend: InsertHealthTrend): Promise<HealthTrend> {
    const [existing] = await db.select().from(healthTrends)
      .where(and(eq(healthTrends.keyword, trend.keyword), eq(healthTrends.region, trend.region || "SA")));
    if (existing) {
      const [updated] = await db.update(healthTrends)
        .set({ ...trend, updatedAt: new Date() })
        .where(eq(healthTrends.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(healthTrends).values(trend).returning();
    return created;
  }

  async deleteOldTrends(olderThanHours: number = 168): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const result = await db.delete(healthTrends)
      .where(lte(healthTrends.updatedAt, cutoff));
    return 0;
  }

  async getTrendAlerts(unreadOnly: boolean = false): Promise<TrendAlert[]> {
    if (unreadOnly) {
      return await db.select().from(trendAlerts)
        .where(eq(trendAlerts.isRead, false))
        .orderBy(desc(trendAlerts.createdAt))
        .limit(50);
    }
    return await db.select().from(trendAlerts)
      .orderBy(desc(trendAlerts.createdAt))
      .limit(50);
  }

  async createTrendAlert(alert: InsertTrendAlert): Promise<TrendAlert> {
    const [created] = await db.insert(trendAlerts).values(alert).returning();
    return created;
  }

  async markTrendAlertRead(id: string): Promise<void> {
    await db.update(trendAlerts)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(trendAlerts.id, id));
  }

  async markAllTrendAlertsRead(): Promise<void> {
    await db.update(trendAlerts)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(trendAlerts.isRead, false));
  }

  async getUnreadTrendAlertsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(trendAlerts)
      .where(eq(trendAlerts.isRead, false));
    return Number(result[0]?.count || 0);
  }
  async incrementAdDailyStat(adId: string, field: 'impressions' | 'clicks'): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    if (field === 'impressions') {
      await db.insert(adStats)
        .values({ adId, date: today, impressions: 1, clicks: 0 })
        .onConflictDoUpdate({
          target: [adStats.adId, adStats.date],
          set: { impressions: sql`${adStats.impressions} + 1` },
        });
    } else {
      await db.insert(adStats)
        .values({ adId, date: today, impressions: 0, clicks: 1 })
        .onConflictDoUpdate({
          target: [adStats.adId, adStats.date],
          set: { clicks: sql`${adStats.clicks} + 1` },
        });
    }
  }

  async getAdStats(adId: string, days: number): Promise<AdStat[]> {
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    const sinceStr = since.toISOString().slice(0, 10);
    return await db.select().from(adStats)
      .where(and(eq(adStats.adId, adId), sql`${adStats.date} >= ${sinceStr}`))
      .orderBy(asc(adStats.date));
  }

  async createCapsuleLog(log: InsertCapsuleLog): Promise<CapsuleLog> {
    const [created] = await db.insert(capsuleLogs).values(log).returning();
    return created;
  }

  async getCapsuleLogs(limit: number = 50): Promise<CapsuleLog[]> {
    return await db.select().from(capsuleLogs)
      .orderBy(desc(capsuleLogs.createdAt))
      .limit(limit);
  }

  // ==========================================
  // Podcast Operations
  // ==========================================

  async getPodcastEpisodes(limit: number = 50): Promise<PodcastEpisode[]> {
    return await db.select().from(podcastEpisodes)
      .orderBy(desc(podcastEpisodes.createdAt))
      .limit(limit);
  }

  async getPodcastEpisode(id: string): Promise<PodcastEpisode | undefined> {
    const [episode] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return episode;
  }

  async createPodcastEpisode(data: InsertPodcastEpisode): Promise<PodcastEpisode> {
    const [episode] = await db.insert(podcastEpisodes).values({
      title: data.title,
      scriptText: data.scriptText,
      audioUrl: data.audioUrl ?? null,
      sourceArticleIds: data.sourceArticleIds ?? [],
      episodeDate: data.episodeDate,
      status: data.status ?? "pending",
      errorMessage: data.errorMessage ?? null,
      durationSeconds: data.durationSeconds ?? null,
      newsCount: data.newsCount ?? 0,
    }).returning();
    return episode;
  }

  async updatePodcastEpisode(id: string, data: Partial<InsertPodcastEpisode> & { updatedAt?: Date; errorMessage?: string | null }): Promise<PodcastEpisode | undefined> {
    const updatePayload: Partial<typeof podcastEpisodes.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.scriptText !== undefined) updatePayload.scriptText = data.scriptText;
    if (data.audioUrl !== undefined) updatePayload.audioUrl = data.audioUrl;
    if (data.sourceArticleIds !== undefined) updatePayload.sourceArticleIds = data.sourceArticleIds;
    if (data.episodeDate !== undefined) updatePayload.episodeDate = data.episodeDate;
    if (data.status !== undefined) updatePayload.status = data.status;
    if ("errorMessage" in data) updatePayload.errorMessage = data.errorMessage;
    if (data.durationSeconds !== undefined) updatePayload.durationSeconds = data.durationSeconds;
    if (data.newsCount !== undefined) updatePayload.newsCount = data.newsCount;

    const [updated] = await db.update(podcastEpisodes)
      .set(updatePayload)
      .where(eq(podcastEpisodes.id, id))
      .returning();
    return updated;
  }

  async deletePodcastEpisode(id: string): Promise<boolean> {
    const result = await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, id)).returning();
    return result.length > 0;
  }

  // ==========================================
  // User Interests & Capsule Feed
  // ==========================================

  async getUserInterests(userId: string): Promise<string[]> {
    const [user] = await db.select({ userInterests: users.userInterests }).from(users).where(eq(users.id, userId));
    return (user?.userInterests as string[]) ?? [];
  }

  async updateUserInterests(userId: string, interests: string[]): Promise<void> {
    await db.update(users).set({ userInterests: interests, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async recordDebunkCtaClick(): Promise<void> {
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
    await db.execute(sql`
      INSERT INTO debunk_cta_clicks (id, click_count, date)
      VALUES (gen_random_uuid(), 1, ${todaySA})
      ON CONFLICT (date)
      DO UPDATE SET click_count = debunk_cta_clicks.click_count + 1
    `);
  }

  async getDebunkCtaStats(days: number = 30): Promise<{ date: string; clicks: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

    const rows = await db.select({
      date: debunkCtaClicks.date,
      clicks: debunkCtaClicks.clickCount,
    }).from(debunkCtaClicks)
      .where(sql`${debunkCtaClicks.date} >= ${cutoffDate}`)
      .orderBy(asc(debunkCtaClicks.date));

    return rows.map(r => ({ date: r.date, clicks: r.clicks }));
  }

  async getTotalDebunkCtaClicks(): Promise<number> {
    const [row] = await db.select({
      total: sql<string>`COALESCE(SUM(${debunkCtaClicks.clickCount}), 0)::text`,
    }).from(debunkCtaClicks);
    return parseInt(row?.total || '0');
  }

  async getCapsuleFeed(interests: string[], page: number = 1, perPage: number = 20): Promise<{
    items: Array<{ type: "news"; item: News } | { type: "article"; item: Article }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Return empty feed when user has no interests selected
    if (interests.length === 0) {
      return { items: [], total: 0, page, totalPages: 0 };
    }

    const safePerPage = Math.max(1, Math.min(perPage, 50));
    const safePage = Math.max(1, page);
    const now = new Date();

    // ── Fetch matching news ──────────────────────────────────────────────────
    const newsConditions = [
      sql`${news.status} != 'deleted'`,
      sql`${news.status} != 'draft'`,
      sql`(${news.status} != 'scheduled' OR ${news.scheduledAt} IS NULL OR ${news.scheduledAt} <= ${now})`,
      sql`(${sql.join(interests.map(cat => sql`${news.category} = ${cat}`), sql` OR `)})`,
    ];
    const newsResults = await db.select().from(news)
      .where(sql.join(newsConditions, sql` AND `))
      .orderBy(desc(news.publishedAt), desc(news.createdAt));

    await this.autoPromoteScheduledItems(newsResults);

    // ── Fetch matching published articles ────────────────────────────────────
    const articlesResults = await db.select().from(articles)
      .where(and(
        eq(articles.status, "published"),
        sql`(${sql.join(interests.map(cat => sql`${articles.category} = ${cat}`), sql` OR `)})`,
      ))
      .orderBy(desc(articles.publishedAt));

    // ── Merge and sort by date descending ────────────────────────────────────
    type FeedItem = { type: "news"; item: News; date: Date } | { type: "article"; item: Article; date: Date };

    const combined: FeedItem[] = [
      ...newsResults.map(n => ({ type: "news" as const, item: n, date: new Date(n.publishedAt || n.createdAt || 0) })),
      ...articlesResults.map(a => ({ type: "article" as const, item: a, date: new Date(a.publishedAt || a.createdAt || 0) })),
    ];

    combined.sort((a, b) => b.date.getTime() - a.date.getTime());

    const total = combined.length;
    const totalPages = Math.ceil(total / safePerPage);
    const offset = (safePage - 1) * safePerPage;
    const paginated = combined.slice(offset, offset + safePerPage);

    return {
      items: paginated.map(({ type, item }) => ({ type, item } as { type: "news"; item: News } | { type: "article"; item: Article })),
      total,
      page: safePage,
      totalPages,
    };
  }

  // ─── Drug Encyclopedia ───────────────────────────────────────────
  async getDrugs(limit = 20): Promise<Drug[]> {
    return db.select().from(drugs).orderBy(desc(drugs.viewCount)).limit(limit);
  }

  async getDrugById(id: string): Promise<Drug | undefined> {
    const [drug] = await db.select().from(drugs).where(eq(drugs.id, id));
    return drug;
  }

  async searchDrugs(query: string): Promise<Drug[]> {
    const q = query.toLowerCase().trim();
    const all = await db.select().from(drugs).orderBy(desc(drugs.viewCount));
    return all.filter(d =>
      d.nameAr?.toLowerCase().includes(q) ||
      d.nameEn?.toLowerCase().includes(q) ||
      d.genericName?.toLowerCase().includes(q)
    );
  }

  async upsertDrug(drug: InsertDrug): Promise<Drug> {
    const existing = await db.select().from(drugs)
      .where(eq(drugs.nameAr, drug.nameAr))
      .limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(drugs)
        .set({ ...drug, updatedAt: new Date() })
        .where(eq(drugs.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(drugs).values(drug).returning();
    return created;
  }

  async incrementDrugViewCount(id: string): Promise<void> {
    await db.update(drugs)
      .set({ viewCount: sql`${drugs.viewCount} + 1` })
      .where(eq(drugs.id, id));
  }

  // ─── Authors ──────────────────────────────────────────────────
  async getAuthors(status?: AuthorStatus): Promise<Author[]> {
    if (status) {
      return db.select().from(authors).where(eq(authors.status, status)).orderBy(desc(authors.createdAt));
    }
    return db.select().from(authors).orderBy(desc(authors.createdAt));
  }

  async getAuthorById(id: string): Promise<Author | undefined> {
    const [a] = await db.select().from(authors).where(eq(authors.id, id));
    return a;
  }

  async getAuthorBySlug(slug: string): Promise<Author | undefined> {
    const [a] = await db.select().from(authors).where(eq(authors.slug, slug));
    return a;
  }

  async getAuthorByEmail(email: string): Promise<Author | undefined> {
    const [a] = await db.select().from(authors).where(eq(authors.email, email));
    return a;
  }

  async createAuthor(author: InsertAuthor & { slug: string }): Promise<Author> {
    const [created] = await db.insert(authors).values(author).returning();
    return created;
  }

  async updateAuthorStatus(id: string, status: AuthorStatus, reviewedBy: string, reviewNotes?: string): Promise<Author | undefined> {
    const [updated] = await db.update(authors)
      .set({ status, reviewedBy, reviewNotes, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(authors.id, id))
      .returning();
    return updated;
  }

  async updateAuthor(id: string, data: Partial<InsertAuthor>): Promise<Author | undefined> {
    const [updated] = await db.update(authors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(authors.id, id))
      .returning();
    return updated;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const result = await db.delete(authors).where(eq(authors.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
