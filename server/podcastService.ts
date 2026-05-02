import OpenAI from "openai";
import { objectStorageClient } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import type { News } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const audioOpenai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function generatePodcastScript(newsItems: News[]): Promise<string> {
  const newsContent = newsItems.map((item, i) => {
    const content = item.summary || item.content?.substring(0, 500) || "";
    return `الخبر ${i + 1}: ${item.title}\n${content}`;
  }).join("\n\n---\n\n");

  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `أنت مذيع بودكاست صحي محترف باللغة العربية. مهمتك كتابة سكريبت بودكاست يومي جذاب وطبيعي يُقرأ بصوت واضح.

قواعد السكريبت:
- ابدأ بتحية دافئة وذكر اليوم والتاريخ
- قدّم كل خبر بطريقة سردية ممتعة وسلسة
- استخدم لغة عربية فصحى واضحة مناسبة للإذاعة
- اربط الأخبار ببعضها بانتقالات طبيعية
- اختتم بخلاصة إيجابية وتحية ودية
- السكريبت يجب أن يكون بين 3 إلى 5 دقائق (حوالي 500-800 كلمة)
- لا تضع أي تعليمات للمذيع أو ملاحظات بين قوسين
- اكتب النص كما سيُنطق مباشرة، بدون عناوين أو تنسيق`,
      },
      {
        role: "user",
        content: `اليوم هو ${today}. اكتب سكريبت بودكاست "كبسولة الصحية" اليومي بناءً على الأخبار التالية:\n\n${newsContent}`,
      },
    ],
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}

interface AudioChatMessage {
  role: "system" | "user";
  content: string;
}

interface AudioCompletionRequest {
  model: string;
  modalities: string[];
  audio: { voice: string; format: string };
  messages: AudioChatMessage[];
}

interface AudioMessageResponse {
  audio?: {
    data?: string;
  };
}

interface AudioChoiceResponse {
  message?: AudioMessageResponse;
}

interface AudioCompletionResponse {
  choices: AudioChoiceResponse[];
}

async function generateAudio(script: string): Promise<Buffer> {
  const request: AudioCompletionRequest = {
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "shimmer", format: "mp3" },
    messages: [
      {
        role: "system",
        content: "You are an assistant that performs text-to-speech. Read the provided text naturally and clearly.",
      },
      {
        role: "user",
        content: `Repeat the following text verbatim: ${script}`,
      },
    ],
  };

  const response = (await (audioOpenai.chat.completions.create as (req: AudioCompletionRequest) => Promise<AudioCompletionResponse>)(request));

  const audioData = response.choices[0]?.message?.audio?.data ?? "";
  if (!audioData) {
    throw new Error("No audio data returned from TTS API");
  }
  return Buffer.from(audioData, "base64");
}

async function uploadAudioToStorage(audioBuffer: Buffer, episodeId: string): Promise<string> {
  const privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
  if (!privateObjectDir) {
    throw new Error("PRIVATE_OBJECT_DIR not set");
  }

  const filename = `podcast-${episodeId}.mp3`;
  const fullPath = `${privateObjectDir}/podcasts/${filename}`;
  const pathParts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
  const bucketName = pathParts[0];
  const objectName = pathParts.slice(1).join("/");

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  await file.save(audioBuffer, {
    contentType: "audio/mpeg",
    metadata: {
      cacheControl: "public, max-age=86400",
    },
  });

  return `/objects/podcasts/${filename}`;
}

export async function generatePodcastEpisode(episodeId: string): Promise<void> {
  try {
    await storage.updatePodcastEpisode(episodeId, { status: "generating", errorMessage: null });

    const recentNews = await storage.getNews(undefined, 20);
    const today = new Date().toISOString().split("T")[0];
    const todayNews = recentNews.filter(
      (item) =>
        item.status === "published" &&
        item.publishedAt &&
        new Date(item.publishedAt).toISOString().split("T")[0] === today
    );

    const selectedNews = todayNews.length >= 3
      ? todayNews.slice(0, 5)
      : recentNews.filter((item) => item.status === "published").slice(0, 5);

    if (selectedNews.length === 0) {
      await storage.updatePodcastEpisode(episodeId, {
        status: "failed",
        errorMessage: "لا توجد أخبار منشورة متاحة لتوليد البودكاست",
      });
      return;
    }

    const script = await generatePodcastScript(selectedNews);
    if (!script) {
      await storage.updatePodcastEpisode(episodeId, {
        status: "failed",
        errorMessage: "فشل توليد سكريبت البودكاست",
      });
      return;
    }

    await storage.updatePodcastEpisode(episodeId, {
      scriptText: script,
      sourceArticleIds: selectedNews.map((n) => n.id),
      newsCount: selectedNews.length,
    });

    const audioBuffer = await generateAudio(script);

    const audioUrl = await uploadAudioToStorage(audioBuffer, episodeId);

    await storage.updatePodcastEpisode(episodeId, {
      audioUrl,
      status: "ready",
      updatedAt: new Date(),
    });
  } catch (error: any) {
    console.error("[podcastService] Error generating episode:", error);
    await storage.updatePodcastEpisode(episodeId, {
      status: "failed",
      errorMessage: error?.message || "خطأ غير معروف",
    });
  }
}
