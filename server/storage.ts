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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, isNull, asc, like, or, ilike } from "drizzle-orm";

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
  getNewsPaginated(category?: string, page?: number, perPage?: number): Promise<{ news: News[]; total: number; page: number; totalPages: number }>;
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

  // User management operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;
  updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }): Promise<User | undefined>;
}

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
        .where(
          and(
            eq(articles.status, "published"),
            eq(articles.category, category)
          )
        )
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
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
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
  private async autoPromoteScheduledItems(items: News[]): Promise<void> {
    const now = new Date();
    for (const item of items) {
      if (item.status === 'scheduled' && item.scheduledAt && item.scheduledAt <= now) {
        await db
          .update(news)
          .set({ status: 'published', publishedAt: item.scheduledAt })
          .where(eq(news.id, item.id));
        item.status = 'published';
        item.publishedAt = item.scheduledAt;
      }
    }
  }

  async getNews(category?: string, limit: number = 50): Promise<News[]> {
    const now = new Date();
    let results: News[];
    
    if (category) {
      results = await db
        .select()
        .from(news)
        .where(eq(news.category, category))
        .orderBy(desc(news.publishedAt), desc(news.createdAt))
        .limit(limit);
    } else {
      results = await db
        .select()
        .from(news)
        .orderBy(desc(news.publishedAt), desc(news.createdAt))
        .limit(limit);
    }
    
    await this.autoPromoteScheduledItems(results);
    
    return results.filter(item => {
      if (item.status === 'deleted') return false;
      if (item.status === 'draft') return false;
      if (item.status === 'scheduled' && item.scheduledAt && item.scheduledAt > now) return false;
      return true;
    });
  }

  async getNewsPaginated(category?: string, page: number = 1, perPage: number = 20): Promise<{ news: News[]; total: number; page: number; totalPages: number }> {
    const now = new Date();
    const conditions = [
      sql`${news.status} != 'deleted'`,
      sql`${news.status} != 'draft'`,
      sql`(${news.status} != 'scheduled' OR ${news.scheduledAt} IS NULL OR ${news.scheduledAt} <= ${now})`,
    ];

    if (category) {
      conditions.push(sql`${news.category} = ${category}`);
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
      conditions.push(sql`(${news.title} ILIKE ${'%' + search + '%'} OR ${news.summary} ILIKE ${'%' + search + '%'})`);
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
    const allNews = await db
      .select()
      .from(news)
      .orderBy(desc(news.publishedAt));
    
    const lowerKeyword = keyword.toLowerCase();
    return allNews.filter(item => {
      if (item.keywords && Array.isArray(item.keywords)) {
        return (item.keywords as string[]).some(k => k.toLowerCase() === lowerKeyword);
      }
      return false;
    });
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const [newsItem] = await db
      .insert(news)
      .values(newsData as any)
      .returning();
    return newsItem;
  }

  async updateNews(id: string, newsData: Partial<InsertNews>): Promise<News | undefined> {
    const [updated] = await db
      .update(news)
      .set(newsData as any)
      .where(eq(news.id, id))
      .returning();
    return updated;
  }

  async incrementViewCount(id: string): Promise<void> {
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }); // YYYY-MM-DD
    const [item] = await db.select({ todayViewsDate: news.todayViewsDate }).from(news).where(eq(news.id, id));
    if (!item) return;
    if (item.todayViewsDate === todaySA) {
      await db.update(news).set({ viewCount: sql`${news.viewCount} + 2`, todayViews: sql`${news.todayViews} + 2` }).where(eq(news.id, id));
    } else {
      await db.update(news).set({ viewCount: sql`${news.viewCount} + 2`, todayViews: 2, todayViewsDate: todaySA }).where(eq(news.id, id));
    }
  }

  async deleteNews(id: string): Promise<boolean> {
    const result = await db
      .delete(news)
      .where(eq(news.id, id))
      .returning();
    return result.length > 0;
  }

  async softDeleteNews(id: string): Promise<boolean> {
    const [result] = await db
      .update(news)
      .set({ status: 'deleted', deletedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
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
    const allNews = await db.select().from(news);
    const publishedNews = allNews.filter(n => n.status === 'published').length;
    const draftNews = allNews.filter(n => n.status === 'draft').length;
    const scheduledNews = allNews.filter(n => n.status === 'scheduled').length;
    const deletedNews = allNews.filter(n => n.status === 'deleted').length;
    const featuredNews = allNews.filter(n => n.isFeatured).length;

    // Saudi timezone today start
    const todaySA = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }); // YYYY-MM-DD
    const todayStartUTC = new Date(`${todaySA}T00:00:00+03:00`);
    const todayNews = allNews.filter(n => n.createdAt && new Date(n.createdAt) >= todayStartUTC).length;
    const miscNews = allNews.filter(n => n.category === 'misc' || n.category === 'منوعات').length;

    // Translation stats
    const totalTranslated = allNews.filter(n => n.isTranslated).length;
    const todayTranslated = allNews.filter(n => n.isTranslated && n.createdAt && new Date(n.createdAt) >= todayStartUTC).length;

    // View stats
    const totalViews = allNews.reduce((sum, n) => sum + (n.viewCount || 0), 0);
    // Today's views: only sum todayViews for rows where todayViewsDate = today
    // (articles published today are initialized at startup via initTodayViews)
    const todayViews = allNews
      .filter(n => n.todayViewsDate === todaySA)
      .reduce((sum, n) => sum + (n.todayViews || 0), 0);

    const allArticles = await db.select().from(articles);
    const publishedArticles = allArticles.filter(a => a.status === 'published').length;
    const draftArticles = allArticles.filter(a => a.status === 'draft').length;
    const miscArticles = allArticles.filter(a => a.category === 'misc' || a.category === 'منوعات').length;

    const allUsers = await db.select().from(users);
    const allChatSessions = await db.select().from(chatSessions);
    const allChatMessages = await db.select().from(chatMessages);

    const allRadarSources = await db.select().from(radarSources);
    const activeRadarSources = allRadarSources.filter(s => s.isActive).length;

    return {
      totalNews: allNews.length,
      publishedNews,
      draftNews,
      scheduledNews,
      deletedNews,
      featuredNews,
      todayNews,
      miscNews,
      totalTranslated,
      todayTranslated,
      totalViews,
      todayViews,
      totalArticles: allArticles.length,
      publishedArticles,
      draftArticles,
      miscArticles,
      totalContent: allNews.length + allArticles.length,
      publishedContent: publishedNews + publishedArticles,
      unclassified: miscNews + miscArticles,
      totalUsers: allUsers.length,
      totalChatSessions: allChatSessions.length,
      totalChatMessages: allChatMessages.length,
      totalRadarSources: allRadarSources.length,
      activeRadarSources,
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
    const allItems = await db.select().from(radarItems);
    return {
      total: allItems.length,
      pending: allItems.filter(i => i.status === 'pending').length,
      approved: allItems.filter(i => i.status === 'approved').length,
      rejected: allItems.filter(i => i.status === 'rejected').length,
      published: allItems.filter(i => i.status === 'published').length,
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
}

export const storage = new DatabaseStorage();
