import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").references(() => categories.id),
  authorId: varchar("author_id").references(() => users.id),
  status: text("status", { enum: ["draft", "published"] }).default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const healthLogs = pgTable("health_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["nutrition", "symptom", "general", "vitals"] }).notNull(),
  data: jsonb("data").notNull(), // Flexible for different types of logs
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  sender: text("sender", { enum: ["user", "bot"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const articlesRelations = relations(articles, ({ one }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const healthLogsRelations = relations(healthLogs, ({ one }) => ({
  user: one(users, {
    fields: [healthLogs.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, updatedAt: true, authorId: true }); // Author ID set by session
export const insertHealthLogSchema = createInsertSchema(healthLogs).omit({ id: true, createdAt: true, userId: true }); // User ID set by session
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, userId: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type HealthLog = typeof healthLogs.$inferSelect;
export type InsertHealthLog = z.infer<typeof insertHealthLogSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Request types
export type CreateArticleRequest = InsertArticle;
export type UpdateArticleRequest = Partial<InsertArticle>;
export type CreateHealthLogRequest = InsertHealthLog;
export type CreateChatMessageRequest = InsertChatMessage;

// Response types
export type ArticleResponse = Article & { category?: Category }; // Joined
export type HealthLogResponse = HealthLog;
export type ChatMessageResponse = ChatMessage;
