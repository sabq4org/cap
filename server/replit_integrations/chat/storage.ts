import { db } from "../../db";
import { chatSessions, chatMessages, ChatSession, ChatMessage } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: string): Promise<ChatSession | undefined>;
  getAllConversations(): Promise<ChatSession[]>;
  createConversation(userId: string, title: string): Promise<ChatSession>;
  deleteConversation(id: string): Promise<void>;
  getMessagesByConversation(sessionId: string): Promise<ChatMessage[]>;
  createMessage(sessionId: string, role: string, content: string): Promise<ChatMessage>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: string) {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session;
  },

  async getAllConversations() {
    return db.select().from(chatSessions).orderBy(desc(chatSessions.createdAt));
  },

  async createConversation(userId: string, title: string) {
    const [session] = await db.insert(chatSessions).values({ userId, title }).returning();
    return session;
  },

  async deleteConversation(id: string) {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  },

  async getMessagesByConversation(sessionId: string) {
    return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
  },

  async createMessage(sessionId: string, role: string, content: string) {
    const [message] = await db.insert(chatMessages).values({ sessionId, role, content }).returning();
    return message;
  },
};

