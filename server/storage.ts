import { db } from "./db";
import {
  articles, categories, healthLogs, chatMessages,
  type Article, type InsertArticle,
  type Category, type InsertCategory,
  type HealthLog, type InsertHealthLog,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Articles
  getArticles(options?: { category?: string; featured?: boolean; limit?: number }): Promise<(Article & { category: Category | null })[]>;
  getArticleBySlug(slug: string): Promise<(Article & { category: Category | null }) | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Health Logs
  getHealthLogs(userId: string): Promise<HealthLog[]>;
  createHealthLog(log: InsertHealthLog): Promise<HealthLog>;
  
  // Chat
  getChatHistory(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Articles
  async getArticles(options?: { category?: string; featured?: boolean; limit?: number }): Promise<(Article & { category: Category | null })[]> {
    let query = db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      summary: articles.summary,
      imageUrl: articles.imageUrl,
      categoryId: articles.categoryId,
      authorId: articles.authorId,
      status: articles.status,
      publishedAt: articles.publishedAt,
      isFeatured: articles.isFeatured,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      category: categories
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id));

    const conditions = [];
    if (options?.category) {
      conditions.push(eq(categories.slug, options.category));
    }
    if (options?.featured) {
      conditions.push(eq(articles.isFeatured, true));
    }

    let finalQuery: any = query;
    if (conditions.length > 0) {
      finalQuery = finalQuery.where(and(...conditions));
    }
    
    finalQuery = finalQuery.orderBy(desc(articles.createdAt));
    
    if (options?.limit) {
      finalQuery = finalQuery.limit(options.limit);
    }

    return await finalQuery;
  }

  async getArticleBySlug(slug: string): Promise<(Article & { category: Category | null }) | undefined> {
    const [result] = await db.select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      summary: articles.summary,
      imageUrl: articles.imageUrl,
      categoryId: articles.categoryId,
      authorId: articles.authorId,
      status: articles.status,
      publishedAt: articles.publishedAt,
      isFeatured: articles.isFeatured,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      category: categories
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.slug, slug));
    
    return result;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article> {
    const [updatedArticle] = await db.update(articles)
      .set(article)
      .where(eq(articles.id, id))
      .returning();
    return updatedArticle;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Health Logs
  async getHealthLogs(userId: string): Promise<HealthLog[]> {
    return await db.select().from(healthLogs)
      .where(eq(healthLogs.userId, userId))
      .orderBy(desc(healthLogs.date));
  }

  async createHealthLog(log: InsertHealthLog): Promise<HealthLog> {
    const [newLog] = await db.insert(healthLogs).values(log).returning();
    return newLog;
  }

  // Chat
  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(articles.createdAt); // Order by creation time
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
