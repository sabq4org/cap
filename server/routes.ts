import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  if (existingCategories.length === 0) {
    const cats = [
      { name: "Health", slug: "health", description: "General health tips and news" },
      { name: "Nutrition", slug: "nutrition", description: "Diet and nutrition advice" },
      { name: "Fitness", slug: "fitness", description: "Exercises and workouts" },
      { name: "Mental Health", slug: "mental-health", description: "Mental wellbeing" },
    ];
    
    for (const cat of cats) {
      await storage.createCategory(cat);
    }
    
    // Create some dummy articles
    const healthCat = (await storage.getCategories()).find(c => c.slug === "health");
    if (healthCat) {
      await storage.createArticle({
        title: "The Importance of Sleep",
        slug: "importance-of-sleep",
        content: "Sleep is essential for your body to repair itself...",
        summary: "Why getting 8 hours of sleep is crucial for your health.",
        imageUrl: "https://images.unsplash.com/photo-1541781777631-fa95371aad95?auto=format&fit=crop&q=80",
        categoryId: healthCat.id,
        status: "published",
        isFeatured: true,
      });
      await storage.createArticle({
        title: "5 Tips for a Healthy Heart",
        slug: "5-tips-healthy-heart",
        content: "Cardiovascular health is important...",
        summary: "Simple changes to improve your heart health.",
        imageUrl: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&q=80",
        categoryId: healthCat.id,
        status: "published",
        isFeatured: false,
      });
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed DB
  seedDatabase().catch(console.error);

  // === Articles ===
  app.get(api.articles.list.path, async (req, res) => {
    const options = {
      category: req.query.category as string,
      featured: req.query.featured === 'true',
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const articles = await storage.getArticles(options);
    res.json(articles);
  });

  app.get(api.articles.get.path, async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  });

  app.post(api.articles.create.path, isAuthenticated, async (req, res) => {
    // TODO: Add admin check here
    try {
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle({
        ...input,
        authorId: (req.user as any).claims.sub, // Set author from session
      });
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Categories ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
        if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Health Logs ===
  app.get(api.healthLogs.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const logs = await storage.getHealthLogs(userId);
    res.json(logs);
  });

  app.post(api.healthLogs.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.healthLogs.create.input.parse(req.body);
      const log = await storage.createHealthLog({
        ...input,
        userId: (req.user as any).claims.sub,
      });
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Chat ===
  app.get(api.chat.history.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const history = await storage.getChatHistory(userId);
    res.json(history);
  });

  app.post(api.chat.send.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { message } = req.body;
      
      // Save user message
      await storage.createChatMessage({
        userId,
        message,
        sender: 'user',
      });

      // Mock AI response
      const botResponseText = `I am a mock AI. You said: "${message}". I can help you with health questions!`;
      
      // Save bot response
      const botMessage = await storage.createChatMessage({
        userId,
        message: botResponseText,
        sender: 'bot',
      });

      res.json(botMessage);
    } catch (err) {
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  return httpServer;
}
