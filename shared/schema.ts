// Blueprint: javascript_log_in_with_replit, javascript_database
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, jsonb, index, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = [
  "super_admin",      // مدير النظام - صلاحيات كاملة
  "editor_in_chief",  // رئيس التحرير - إدارة المحتوى والفريق
  "managing_editor",  // مدير التحرير - إشراف على المحررين
  "senior_editor",    // محرر أول - مراجعة ونشر
  "editor",           // محرر - كتابة وتحرير
  "journalist",       // صحفي - كتابة الأخبار
  "reviewer",         // مدقق - تدقيق لغوي
  "contributor",      // مساهم - كتابة مقالات
  "subscriber",       // مشترك - قراءة فقط
] as const;

export type UserRole = typeof userRoleEnum[number];

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  authProvider: varchar("auth_provider").default("replit"),
  role: varchar("role").notNull().default("subscriber"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Role permissions - defines what each role can do
export const rolePermissions: Record<UserRole, string[]> = {
  super_admin: [
    "manage_users", "manage_roles", "manage_settings", "manage_categories",
    "create_news", "edit_news", "delete_news", "publish_news", "schedule_news",
    "feature_news", "view_all_news", "import_content", "manage_media",
    "view_analytics", "manage_system"
  ],
  editor_in_chief: [
    "manage_users", "manage_categories",
    "create_news", "edit_news", "delete_news", "publish_news", "schedule_news",
    "feature_news", "view_all_news", "import_content", "manage_media",
    "view_analytics"
  ],
  managing_editor: [
    "create_news", "edit_news", "delete_news", "publish_news", "schedule_news",
    "feature_news", "view_all_news", "manage_media", "view_analytics"
  ],
  senior_editor: [
    "create_news", "edit_news", "publish_news", "schedule_news",
    "view_all_news", "manage_media"
  ],
  editor: [
    "create_news", "edit_own_news", "view_all_news", "manage_media"
  ],
  journalist: [
    "create_news", "edit_own_news", "view_own_news"
  ],
  reviewer: [
    "view_all_news", "add_review_notes"
  ],
  contributor: [
    "create_news", "edit_own_news", "view_own_news"
  ],
  subscriber: [
    "view_published_news"
  ]
};

// Arabic labels for roles
export const roleLabelsAr: Record<UserRole, string> = {
  super_admin: "مدير النظام",
  editor_in_chief: "رئيس التحرير",
  managing_editor: "مدير التحرير",
  senior_editor: "محرر أول",
  editor: "محرر",
  journalist: "صحفي",
  reviewer: "مدقق لغوي",
  contributor: "مساهم",
  subscriber: "مشترك"
};

// Helper function to check permission
export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// Health profiles
export const healthProfiles = pgTable("health_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  bloodType: varchar("blood_type"),
  conditions: jsonb("conditions").$type<string[]>().default([]),
  medications: jsonb("medications").$type<string[]>().default([]),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  goals: jsonb("goals").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const healthProfilesRelations = relations(healthProfiles, ({ one }) => ({
  user: one(users, {
    fields: [healthProfiles.userId],
    references: [users.id],
  }),
}));

export const insertHealthProfileSchema = createInsertSchema(healthProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHealthProfile = z.infer<typeof insertHealthProfileSchema>;
export type HealthProfile = typeof healthProfiles.$inferSelect;

// Health trackers (blood pressure, blood sugar, weight, etc.)
export const trackers = pgTable("trackers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // "blood_pressure", "blood_sugar", "weight", "heart_rate"
  measuredAt: timestamp("measured_at").notNull().defaultNow(),
  valuePrimary: real("value_primary").notNull(),
  valueSecondary: real("value_secondary"),
  unit: varchar("unit").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trackersRelations = relations(trackers, ({ one }) => ({
  user: one(users, {
    fields: [trackers.userId],
    references: [users.id],
  }),
}));

export const insertTrackerSchema = createInsertSchema(trackers).omit({
  id: true,
  createdAt: true,
});
export type InsertTracker = z.infer<typeof insertTrackerSchema>;
export type Tracker = typeof trackers.$inferSelect;

// Nutrition entries
export const nutritionEntries = pgTable("nutrition_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  mealName: varchar("meal_name").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  items: jsonb("items").$type<Array<{ name: string; quantity: number; unit: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nutritionEntriesRelations = relations(nutritionEntries, ({ one }) => ({
  user: one(users, {
    fields: [nutritionEntries.userId],
    references: [users.id],
  }),
}));

export const insertNutritionEntrySchema = createInsertSchema(nutritionEntries).omit({
  id: true,
  createdAt: true,
});
export type InsertNutritionEntry = z.infer<typeof insertNutritionEntrySchema>;
export type NutritionEntry = typeof nutritionEntries.$inferSelect;

// Articles
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  readTime: integer("read_time").notNull(),
  reviewedBy: varchar("reviewed_by").notNull(),
  medicalReviewDate: timestamp("medical_review_date"),
  sources: jsonb("sources").$type<Array<{ title: string; url: string }>>().default([]),
  status: varchar("status").notNull().default("draft"), // draft, published
  publishedAt: timestamp("published_at"),
  socialContentGenerated: boolean("social_content_generated").default(false),
  socialContentGeneratedAt: timestamp("social_content_generated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// News
export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code", { length: 7 }).unique(), // Short URL code like "AbC1234"
  title: varchar("title").notNull(),
  subtitle: varchar("subtitle"),
  summary: text("summary"),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // "medical", "health", "pharmaceutical", "conference", "awareness", "nutrition"
  source: varchar("source"),
  sourceUrl: varchar("source_url"),
  imageUrl: varchar("image_url"),
  imageAlt: varchar("image_alt"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  keywords: text("keywords").array(),
  viewCount: integer("view_count").default(0).notNull(), // Number of page views (cumulative)
  todayViews: integer("today_views").default(0).notNull(), // Views today
  todayViewsDate: varchar("today_views_date", { length: 10 }), // YYYY-MM-DD (Saudi timezone)
  isTranslated: boolean("is_translated").default(false), // Was translated from another language (e.g. English → Arabic)
  isFeatured: boolean("is_featured").default(false), // Featured news appears in Hero section
  isBreaking: boolean("is_breaking").default(false), // Breaking news flag — red highlight
  status: varchar("status").notNull().default("published"), // "draft", "published", "scheduled", "deleted"
  scheduledAt: timestamp("scheduled_at"), // When to publish scheduled news
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  createdBy: varchar("created_by"), // Who created this news
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_news_category").on(table.category),
  index("idx_news_status").on(table.status),
  index("idx_news_published_at").on(table.publishedAt),
  index("idx_news_is_featured").on(table.isFeatured),
  index("idx_news_short_code").on(table.shortCode),
]);

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

// Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(), // "medical", "health", etc.
  nameAr: varchar("name_ar").notNull(), // Arabic name
  nameEn: varchar("name_en"), // English name (optional)
  color: varchar("color").notNull().default("emerald-600"), // Tailwind color class
  icon: varchar("icon"), // Icon name from lucide-react
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Chat sessions
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // "user", "assistant"
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Array<{ title: string; url: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ==========================================
// News Radar System Tables
// ==========================================

// Source types for news radar
export const radarSourceTypeEnum = ["rss", "api", "website"] as const;
export type RadarSourceType = typeof radarSourceTypeEnum[number];

// News sources for radar monitoring
export const radarSources = pgTable("radar_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameAr: varchar("name_ar"),
  url: text("url").notNull(),
  type: varchar("type").notNull().default("rss"), // rss, api, website
  category: varchar("category"), // health, medicine, nutrition, etc.
  language: varchar("language").notNull().default("ar"), // ar, en
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // 1-5, higher = more important
  fetchInterval: integer("fetch_interval").default(15), // minutes
  lastFetchAt: timestamp("last_fetch_at"),
  lastFetchStatus: varchar("last_fetch_status"), // success, error
  lastFetchError: text("last_fetch_error"),
  itemsCount: integer("items_count").default(0),
  reliability: integer("reliability").default(80), // 0-100 trust score
  logoUrl: text("logo_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRadarSourceSchema = createInsertSchema(radarSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastFetchAt: true,
  lastFetchStatus: true,
  lastFetchError: true,
  itemsCount: true,
});
export type InsertRadarSource = z.infer<typeof insertRadarSourceSchema>;
export type RadarSource = typeof radarSources.$inferSelect;

// URLs excluded from seed (deleted by admin — never re-add on restart)
export const radarExcludedSeeds = pgTable("radar_excluded_seeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Keywords for filtering and categorization
export const radarKeywords = pgTable("radar_keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: varchar("keyword").notNull(),
  keywordAr: varchar("keyword_ar"),
  category: varchar("category").notNull(), // health-news, medicine, nutrition, etc.
  weight: integer("weight").default(1), // importance weight for scoring
  isExclude: boolean("is_exclude").default(false), // true = exclude articles with this keyword
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRadarKeywordSchema = createInsertSchema(radarKeywords).omit({
  id: true,
  createdAt: true,
});
export type InsertRadarKeyword = z.infer<typeof insertRadarKeywordSchema>;
export type RadarKeyword = typeof radarKeywords.$inferSelect;

// Collected news items from radar
export const radarItemStatusEnum = ["pending", "approved", "rejected", "published", "archived"] as const;
export type RadarItemStatus = typeof radarItemStatusEnum[number];

export const radarItems = pgTable("radar_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").references(() => radarSources.id, { onDelete: "set null" }),
  externalId: varchar("external_id"), // Original article ID/URL for deduplication
  title: text("title").notNull(),
  titleAr: text("title_ar"), // Arabic translation if original is in another language
  summary: text("summary"),
  summaryAr: text("summary_ar"),
  content: text("content"),
  contentAr: text("content_ar"),
  originalUrl: text("original_url").notNull(),
  imageUrl: text("image_url"),
  author: varchar("author"),
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  language: varchar("language").default("ar"),
  category: varchar("category"), // AI-classified category
  suggestedCategory: varchar("suggested_category"), // AI suggested
  relevanceScore: integer("relevance_score").default(0), // 0-100
  sentimentScore: integer("sentiment_score"), // -100 to 100
  isBreaking: boolean("is_breaking").default(false), // Breaking news flag
  isDuplicate: boolean("is_duplicate").default(false),
  duplicateOfId: varchar("duplicate_of_id"),
  status: varchar("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  aiAnalysis: jsonb("ai_analysis").$type<{
    topics: string[];
    entities: string[];
    credibilityScore: number;
    summary: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_radar_items_status").on(table.status),
  index("idx_radar_items_source").on(table.sourceId),
  index("idx_radar_items_fetched").on(table.fetchedAt),
  index("idx_radar_items_external").on(table.externalId),
]);

export const radarItemsRelations = relations(radarItems, ({ one }) => ({
  source: one(radarSources, {
    fields: [radarItems.sourceId],
    references: [radarSources.id],
  }),
}));

export const insertRadarItemSchema = createInsertSchema(radarItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fetchedAt: true,
});
export type InsertRadarItem = z.infer<typeof insertRadarItemSchema>;
export type RadarItem = typeof radarItems.$inferSelect;

// Radar alerts configuration
export const radarAlerts = pgTable("radar_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // keyword, source, breaking, relevance
  conditions: jsonb("conditions").$type<{
    keywords?: string[];
    sources?: string[];
    minRelevance?: number;
    categories?: string[];
    isBreaking?: boolean;
  }>(),
  notifyEmail: boolean("notify_email").default(false),
  notifyDashboard: boolean("notify_dashboard").default(true),
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRadarAlertSchema = createInsertSchema(radarAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggeredAt: true,
  triggerCount: true,
});
export type InsertRadarAlert = z.infer<typeof insertRadarAlertSchema>;
export type RadarAlert = typeof radarAlerts.$inferSelect;

// Alert notifications
export const radarNotifications = pgTable("radar_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").references(() => radarAlerts.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").references(() => radarItems.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const radarNotificationsRelations = relations(radarNotifications, ({ one }) => ({
  alert: one(radarAlerts, {
    fields: [radarNotifications.alertId],
    references: [radarAlerts.id],
  }),
  item: one(radarItems, {
    fields: [radarNotifications.itemId],
    references: [radarItems.id],
  }),
}));

export const insertRadarNotificationSchema = createInsertSchema(radarNotifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
  readAt: true,
});
export type InsertRadarNotification = z.infer<typeof insertRadarNotificationSchema>;
export type RadarNotification = typeof radarNotifications.$inferSelect;

// Fetch logs for monitoring
export const radarFetchLogs = pgTable("radar_fetch_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").references(() => radarSources.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: varchar("status").notNull(), // running, success, error
  itemsFetched: integer("items_fetched").default(0),
  itemsNew: integer("items_new").default(0),
  itemsDuplicate: integer("items_duplicate").default(0),
  errorMessage: text("error_message"),
});

export const radarFetchLogsRelations = relations(radarFetchLogs, ({ one }) => ({
  source: one(radarSources, {
    fields: [radarFetchLogs.sourceId],
    references: [radarSources.id],
  }),
}));

export type RadarFetchLog = typeof radarFetchLogs.$inferSelect;

// =====================================================
// AI Image Generation System
// =====================================================

// Generation type enum
export const generationTypeEnum = ["realistic", "artistic", "hybrid"] as const;
export type GenerationType = typeof generationTypeEnum[number];

// Arabic labels for generation types
export const generationTypeLabelsAr: Record<GenerationType, string> = {
  realistic: "واقعي",
  artistic: "فني/رسومي",
  hybrid: "هجين"
};

// Image quality enum
export const imageQualityEnum = ["standard", "hd"] as const;
export type ImageQuality = typeof imageQualityEnum[number];

// Image size enum
export const imageSizeEnum = ["1024x1024", "1792x1024", "1024x1792"] as const;
export type ImageSize = typeof imageSizeEnum[number];

// Generation settings (global configuration)
export const generationSettings = pgTable("generation_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthlyQuota: integer("monthly_quota").notNull().default(100),
  defaultGenerationType: varchar("default_generation_type").notNull().default("realistic"),
  defaultQuality: varchar("default_quality").notNull().default("hd"),
  defaultSize: varchar("default_size").notNull().default("1024x1024"),
  enabledModels: jsonb("enabled_models").$type<string[]>().default(["dall-e-3"]),
  maxPromptLength: integer("max_prompt_length").default(1000),
  autoGenerateFromContent: boolean("auto_generate_from_content").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGenerationSettingsSchema = createInsertSchema(generationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGenerationSettings = z.infer<typeof insertGenerationSettingsSchema>;
export type GenerationSettings = typeof generationSettings.$inferSelect;

// Monthly usage tracking
export const generationUsage = pgTable("generation_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month").notNull(), // Format: "2026-01"
  imagesGenerated: integer("images_generated").notNull().default(0),
  infographicsGenerated: integer("infographics_generated").notNull().default(0),
  totalCreditsUsed: integer("total_credits_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generationUsageRelations = relations(generationUsage, ({ one }) => ({
  user: one(users, {
    fields: [generationUsage.userId],
    references: [users.id],
  }),
}));

export const insertGenerationUsageSchema = createInsertSchema(generationUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGenerationUsage = z.infer<typeof insertGenerationUsageSchema>;
export type GenerationUsage = typeof generationUsage.$inferSelect;

// Image generation jobs
export const imageGenerations = pgTable("image_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  newsId: varchar("news_id").references(() => news.id, { onDelete: "set null" }),
  articleId: varchar("article_id").references(() => articles.id, { onDelete: "set null" }),
  prompt: text("prompt").notNull(),
  revisedPrompt: text("revised_prompt"),
  generationType: varchar("generation_type").notNull().default("realistic"),
  quality: varchar("quality").notNull().default("hd"),
  size: varchar("size").notNull().default("1024x1024"),
  model: varchar("model").notNull().default("dall-e-3"),
  status: varchar("status").notNull().default("pending"), // pending, generating, completed, failed
  imageUrl: text("image_url"),
  objectStoragePath: text("object_storage_path"),
  errorMessage: text("error_message"),
  generationTimeMs: integer("generation_time_ms"),
  creditsUsed: integer("credits_used").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const imageGenerationsRelations = relations(imageGenerations, ({ one }) => ({
  user: one(users, {
    fields: [imageGenerations.userId],
    references: [users.id],
  }),
  news: one(news, {
    fields: [imageGenerations.newsId],
    references: [news.id],
  }),
  article: one(articles, {
    fields: [imageGenerations.articleId],
    references: [articles.id],
  }),
}));

export const insertImageGenerationSchema = createInsertSchema(imageGenerations).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  imageUrl: true,
  objectStoragePath: true,
  errorMessage: true,
  generationTimeMs: true,
  revisedPrompt: true,
});
export type InsertImageGeneration = z.infer<typeof insertImageGenerationSchema>;
export type ImageGeneration = typeof imageGenerations.$inferSelect;

// Infographic templates
export const infographicTemplates = pgTable("infographic_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameAr: varchar("name_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  category: varchar("category").notNull(), // health, statistics, comparison, timeline, process
  previewImageUrl: text("preview_image_url"),
  defaultWidth: integer("default_width").default(1200),
  defaultHeight: integer("default_height").default(630),
  layoutConfig: jsonb("layout_config").$type<Record<string, any>>().default({}),
  colorScheme: jsonb("color_scheme").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInfographicTemplateSchema = createInsertSchema(infographicTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInfographicTemplate = z.infer<typeof insertInfographicTemplateSchema>;
export type InfographicTemplate = typeof infographicTemplates.$inferSelect;

// Infographic jobs
export const infographicJobs = pgTable("infographic_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  templateId: varchar("template_id").references(() => infographicTemplates.id, { onDelete: "set null" }),
  newsId: varchar("news_id").references(() => news.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  contentData: jsonb("content_data").$type<Record<string, any>>().notNull(),
  customPrompt: text("custom_prompt"),
  width: integer("width").default(1200),
  height: integer("height").default(630),
  status: varchar("status").notNull().default("pending"), // pending, generating, completed, failed
  resultImageUrl: text("result_image_url"),
  objectStoragePath: text("object_storage_path"),
  errorMessage: text("error_message"),
  generationTimeMs: integer("generation_time_ms"),
  creditsUsed: integer("credits_used").default(2),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const infographicJobsRelations = relations(infographicJobs, ({ one }) => ({
  user: one(users, {
    fields: [infographicJobs.userId],
    references: [users.id],
  }),
  template: one(infographicTemplates, {
    fields: [infographicJobs.templateId],
    references: [infographicTemplates.id],
  }),
  news: one(news, {
    fields: [infographicJobs.newsId],
    references: [news.id],
  }),
}));

export const insertInfographicJobSchema = createInsertSchema(infographicJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  resultImageUrl: true,
  objectStoragePath: true,
  errorMessage: true,
  generationTimeMs: true,
});
export type InsertInfographicJob = z.infer<typeof insertInfographicJobSchema>;
export type InfographicJob = typeof infographicJobs.$inferSelect;

// ── Admin Accounts (Admin panel staff) ───────────────────────────────────────
export const adminAccounts = pgTable("admin_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  displayName: varchar("display_name").notNull(),
  role: varchar("role").notNull().default("editor"),
  permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminAccountSchema = createInsertSchema(adminAccounts).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertAdminAccount = z.infer<typeof insertAdminAccountSchema>;
export type AdminAccount = typeof adminAccounts.$inferSelect;

export const viewCountryStats = pgTable("view_country_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  countryName: varchar("country_name").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
});

export type ViewCountryStat = typeof viewCountryStats.$inferSelect;

export const viewReferrerStats = pgTable("view_referrer_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source", { length: 50 }).notNull(),
  sourceLabel: varchar("source_label").notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
});

export type ViewReferrerStat = typeof viewReferrerStats.$inferSelect;

// ── Ads (Advertisement Banners) ──────────────────────────────────────────────
export const adPositionEnum = ["above_featured", "below_featured", "news_sidebar"] as const;
export type AdPosition = typeof adPositionEnum[number];

export const adPositionLabelsAr: Record<AdPosition, string> = {
  above_featured: "فوق الأخبار البارزة",
  below_featured: "أسفل الأخبار البارزة",
  news_sidebar: "الشريط الجانبي للأخبار",
};

export const ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull(),
  position: varchar("position").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  weight: integer("weight").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdSchema = createInsertSchema(ads).omit({ id: true, createdAt: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

// ==========================================
// Health Trend Radar System Tables
// ==========================================

export const trendStrengthEnum = ["low", "medium", "high", "very_high"] as const;
export type TrendStrength = typeof trendStrengthEnum[number];

export const healthTrends = pgTable("health_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: varchar("keyword").notNull(),
  keywordAr: varchar("keyword_ar"),
  category: varchar("category"), // diabetes, heart, mental, nutrition, etc.
  trendScore: integer("trend_score").notNull().default(0), // 0-100
  trendStrength: varchar("trend_strength").notNull().default("low"), // low, medium, high, very_high
  searchVolume: integer("search_volume"), // approximate search volume
  weeklyChange: integer("weekly_change"), // % change vs last week
  region: varchar("region").notNull().default("SA"), // SA, AE, KW, etc.
  articleSuggestions: jsonb("article_suggestions").$type<string[]>().default([]),
  aiContext: text("ai_context"), // AI-generated context about why this is trending
  recordedAt: timestamp("recorded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_health_trends_recorded").on(table.recordedAt),
  index("idx_health_trends_score").on(table.trendScore),
]);

export const insertHealthTrendSchema = createInsertSchema(healthTrends).omit({
  id: true,
  recordedAt: true,
  updatedAt: true,
});
export type InsertHealthTrend = z.infer<typeof insertHealthTrendSchema>;
export type HealthTrend = typeof healthTrends.$inferSelect;

export const trendAlerts = pgTable("trend_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trendId: varchar("trend_id").references(() => healthTrends.id, { onDelete: "cascade" }),
  keyword: varchar("keyword").notNull(),
  keywordAr: varchar("keyword_ar"),
  message: text("message").notNull(),
  spikePercent: integer("spike_percent"), // how much it spiked
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrendAlertSchema = createInsertSchema(trendAlerts).omit({
  id: true,
  createdAt: true,
  isRead: true,
  readAt: true,
});
export type InsertTrendAlert = z.infer<typeof insertTrendAlertSchema>;
export type TrendAlert = typeof trendAlerts.$inferSelect;

// =====================================================
// Podcast Episodes
// =====================================================

export const podcastEpisodes = pgTable("podcast_episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  scriptText: text("script_text").notNull(),
  audioUrl: text("audio_url"),
  sourceArticleIds: jsonb("source_article_ids").$type<string[]>().default([]),
  episodeDate: varchar("episode_date", { length: 10 }).notNull(), // YYYY-MM-DD
  status: varchar("status").notNull().default("pending"), // pending, generating, ready, failed
  errorMessage: text("error_message"),
  durationSeconds: integer("duration_seconds"),
  newsCount: integer("news_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPodcastEpisodeSchema = createInsertSchema(podcastEpisodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPodcastEpisode = z.infer<typeof insertPodcastEpisodeSchema>;
export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;

export const adminPermissions = [
  { key: "publish_news",       label: "نشر المحتوى" },
  { key: "edit_news",          label: "تعديل المحتوى" },
  { key: "delete_news",        label: "حذف المحتوى" },
  { key: "ai_content",         label: "توليد محتوى بالذكاء الاصطناعي" },
  { key: "ai_images",          label: "توليد الصور بالذكاء الاصطناعي" },
  { key: "manage_radar",       label: "إدارة رادار الأخبار" },
  { key: "import_wordpress",   label: "استيراد WordPress" },
  { key: "manage_categories",  label: "إدارة التصنيفات" },
  { key: "view_analytics",     label: "عرض الإحصائيات" },
  { key: "manage_users",       label: "إدارة المستخدمين" },
] as const;

// ── Capsule Logs ─────────────────────────────────────────────────────────────

export type CapsuleLogFactCheckResult = {
  verdict: "موثوق" | "مشكوك فيه" | "مضلل";
  credibilityScore: number;
  explanation: string;
  notes: Array<{ claim: string; assessment: string }>;
};

export type CapsuleLogSimplifyResult = {
  simplified: string;
};

export type CapsuleLogPdfResult = {
  headline: string;
  summary: string;
  keyStats: string[];
  advice: string;
  fullDraft: string;
};

export type CapsuleLogResult =
  | CapsuleLogFactCheckResult
  | CapsuleLogSimplifyResult
  | CapsuleLogPdfResult;

export const capsuleLogs = pgTable("capsule_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tool: varchar("tool").notNull(), // "fact-check" | "simplify" | "pdf-capsule"
  inputSnippet: text("input_snippet").notNull(),
  result: jsonb("result").$type<CapsuleLogResult>().notNull(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_capsule_logs_created_at").on(table.createdAt),
  index("idx_capsule_logs_tool").on(table.tool),
]);

export const insertCapsuleLogSchema = createInsertSchema(capsuleLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertCapsuleLog = z.infer<typeof insertCapsuleLogSchema>;
export type CapsuleLog = typeof capsuleLogs.$inferSelect;

// ── Advertisements ────────────────────────────────────────────────────────────
export const advertisements = pgTable("advertisements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  position: varchar("position").notNull().default("sidebar"),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  rotationInterval: integer("rotation_interval").default(15).notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  impressionCount: integer("impression_count").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true, createdAt: true, updatedAt: true, clickCount: true, impressionCount: true,
});
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;

// ── Ad Daily Stats ────────────────────────────────────────────────────────────
export const adStats = pgTable("ad_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull().references(() => advertisements.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
}, (table) => [
  uniqueIndex("uq_ad_stats_ad_date").on(table.adId, table.date),
]);

export const adStatsRelations = relations(adStats, ({ one }) => ({
  ad: one(advertisements, {
    fields: [adStats.adId],
    references: [advertisements.id],
  }),
}));

export type AdStat = typeof adStats.$inferSelect;

// =====================================================
// Rumor Submissions (اسأل كبسولة)
// =====================================================

export const rumorStatusEnum = ["pending", "ai_responded", "published", "rejected"] as const;
export type RumorStatus = typeof rumorStatusEnum[number];

export const rumorSourceEnum = ["tiktok", "whatsapp", "facebook", "twitter", "other"] as const;
export type RumorSource = typeof rumorSourceEnum[number];

export const rumorVerdictEnum = ["خرافة", "صحيح جزئياً", "صحيح"] as const;
export type RumorVerdict = typeof rumorVerdictEnum[number];

export const rumorSubmissions = pgTable("rumor_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rumorText: text("rumor_text").notNull(),
  sourcePlatform: varchar("source_platform").notNull().default("other"),
  sourceUrl: varchar("source_url"),
  status: varchar("status").notNull().default("pending"),
  aiResponse: jsonb("ai_response").$type<{
    verdict: string;
    explanation: string;
    shortSummary: string;
    sources: Array<{ title: string; url: string }>;
  }>(),
  editorNotes: text("editor_notes"),
  publishedNewsId: varchar("published_news_id").references(() => news.id, { onDelete: "set null" }),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rumor_submissions_status").on(table.status),
  index("idx_rumor_submissions_created").on(table.createdAt),
]);

export const insertRumorSubmissionSchema = createInsertSchema(rumorSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  aiResponse: true,
  editorNotes: true,
  publishedNewsId: true,
  viewCount: true,
});
export type InsertRumorSubmission = z.infer<typeof insertRumorSubmissionSchema>;
export type RumorSubmission = typeof rumorSubmissions.$inferSelect;

// ── WhatsApp Newsletter Subscription System ────────────────────────────────────

export const whatsappInterestsEnum = [
  "heart",       // القلب
  "nutrition",   // التغذية
  "diabetes",    // السكري
  "pressure",    // الضغط
  "mother",      // صحة الأم
  "child",       // صحة الطفل
  "mental",      // الصحة النفسية
  "fitness",     // اللياقة البدنية
  "general",     // صحة عامة
] as const;
export type WhatsappInterest = typeof whatsappInterestsEnum[number];

export const whatsappInterestLabels: Record<WhatsappInterest, string> = {
  heart: "القلب والأوعية الدموية",
  nutrition: "التغذية والغذاء",
  diabetes: "السكري",
  pressure: "ضغط الدم",
  mother: "صحة الأم والحمل",
  child: "صحة الطفل",
  mental: "الصحة النفسية",
  fitness: "اللياقة البدنية",
  general: "صحة عامة",
};

export const whatsappSubscribers = pgTable("whatsapp_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }),
  interests: jsonb("interests").$type<WhatsappInterest[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isActive: boolean("is_active").default(true).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wa_subscribers_phone").on(table.phone),
  index("idx_wa_subscribers_status").on(table.status),
]);

export const insertWhatsappSubscriberSchema = createInsertSchema(whatsappSubscribers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  subscribedAt: true,
  unsubscribedAt: true,
  lastMessageAt: true,
});
export type InsertWhatsappSubscriber = z.infer<typeof insertWhatsappSubscriberSchema>;
export type WhatsappSubscriber = typeof whatsappSubscribers.$inferSelect;

export const whatsappNewsletters = pgTable("whatsapp_newsletters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  interests: jsonb("interests").$type<WhatsappInterest[]>().default([]),
  recipientsCount: integer("recipients_count").default(0).notNull(),
  sentAt: timestamp("sent_at"),
  scheduledAt: timestamp("scheduled_at"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  sentBy: varchar("sent_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhatsappNewsletterSchema = createInsertSchema(whatsappNewsletters).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});
export type InsertWhatsappNewsletter = z.infer<typeof insertWhatsappNewsletterSchema>;
export type WhatsappNewsletter = typeof whatsappNewsletters.$inferSelect;

// WhatsApp settings
export const whatsappSettings = pgTable("whatsapp_settings", {
  id: varchar("id").primaryKey().default("default"),
  apiProvider: varchar("api_provider", { length: 50 }).default("mock"),
  apiKey: text("api_key"),
  phoneNumberId: varchar("phone_number_id"),
  sendHour: integer("send_hour").default(7).notNull(),
  sendMinute: integer("send_minute").default(0).notNull(),
  isAutoSendEnabled: boolean("is_auto_send_enabled").default(false).notNull(),
  welcomeMessage: text("welcome_message"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WhatsappSettings = typeof whatsappSettings.$inferSelect;

