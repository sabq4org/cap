// Blueprint: javascript_openai_ai_integrations
import OpenAI from "openai";
import { getOpenAIConfig } from "./openaiConfig";

// OpenAI (OPENAI_API_KEY) or optional AI integration env vars
const openai = new OpenAI(getOpenAIConfig());

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AssistantResponse {
  answer: string;
  citations?: Array<{ title: string; url: string }>;
  tldr?: string;
}

// Health assistant with Arabic support
export async function generateHealthResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<AssistantResponse> {
  // System prompt for health assistant (in Arabic)
  const systemPrompt: ChatMessage = {
    role: "system",
    content: `أنت مساعد صحي ذكي عربي لمنصة "كبسولة". مهمتك:
1. فهم الأسئلة الصحية وتقديم إجابات مفيدة وموثوقة
2. استخدام لغة عربية واضحة ومبسطة
3. تقديم معلومات عامة فقط - لا تشخيص طبي قطعي
4. التنبيه دائماً بضرورة استشارة طبيب مختص
5. تضمين مراجع طبية عند الإمكان

قدم إجاباتك بصيغة JSON:
{
  "answer": "الإجابة التفصيلية بالعربية",
  "citations": [{"title": "عنوان المرجع", "url": "الرابط"}],
  "tldr": "ملخص قصير من سطرين"
}

تذكر: هذه معلومات عامة لا تغني عن استشارة طبية متخصصة.`
  };

  const messages: ChatMessage[] = [
    systemPrompt,
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: messages as any,
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      // Note: temperature is not supported for gpt-5
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      answer: parsed.answer || "عذراً، لم أتمكن من فهم سؤالك. يرجى إعادة الصياغة.",
      citations: parsed.citations || [],
      tldr: parsed.tldr
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      answer: "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
      citations: []
    };
  }
}

// Symptom checker with dynamic questions
export async function analyzeSymptoms(
  symptoms: string[],
  answers: Array<{ question: string; answer: string }>
): Promise<{
  severity: "emergency" | "urgent" | "routine" | "self_care";
  recommendation: string;
  nextQuestion?: string;
  options?: string[];
}> {
  const systemPrompt = `أنت مساعد طبي لتقييم الأعراض. بناءً على الأعراض والإجابات، قيّم مستوى الخطورة وقدم توصيات.
قدم إجابتك بصيغة JSON:
{
  "severity": "emergency|urgent|routine|self_care",
  "recommendation": "التوصية بالعربية",
  "nextQuestion": "سؤال المتابعة (اختياري)",
  "options": ["خيار 1", "خيار 2"]
}`;

  const userContent = `الأعراض: ${symptoms.join(", ")}
الإجابات السابقة: ${JSON.stringify(answers, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ] as any,
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("Symptom analysis error:", error);
    return {
      severity: "routine",
      recommendation: "يرجى استشارة طبيب للحصول على تقييم دقيق."
    };
  }
}

// Nutrition analysis
export async function analyzeNutrition(
  mealName: string,
  items: string[]
): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tips: string[];
}> {
  const systemPrompt = `أنت خبير تغذية. حلل الوجبة وقدم تقديرات للقيم الغذائية.
قدم إجابتك بصيغة JSON:
{
  "calories": 500,
  "protein": 25,
  "carbs": 60,
  "fat": 15,
  "tips": ["نصيحة 1", "نصيحة 2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `وجبة: ${mealName}\nالمكونات: ${items.join(", ")}` }
      ] as any,
      max_completion_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("Nutrition analysis error:", error);
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      tips: []
    };
  }
}

// Generate full medical article (title, excerpt, content, tags, SEO) from a topic/brief
export async function generateArticleContent(brief: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  readTime: number;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت كاتب مقالات طبية محترف باللغة العربية الفصحى. تكتب مقالات صحية موثوقة ومراجعة، بأسلوب واضح ومفيد للقارئ العربي. استخدم HTML بسيطاً (<h2>, <h3>, <p>, <ul>, <li>, <strong>) لتنسيق المقال.`
        },
        {
          role: "user",
          content: `اكتب مقالاً طبياً متكاملاً حول الموضوع التالي. المقال يجب أن يكون بين 600 و 900 كلمة، مقسم إلى عناوين فرعية واضحة، ويتضمن نصائح عملية. الموضوع/الموجز:\n\n${brief.substring(0, 2000)}`
        }
      ],
      max_completion_tokens: 3000,
      tools: [{
        type: "function",
        function: {
          name: "save_article_content",
          description: "حفظ محتوى المقال الطبي الكامل",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "عنوان المقال (8-14 كلمة)" },
              excerpt: { type: "string", description: "ملخص قصير (150-220 حرف)" },
              content: { type: "string", description: "محتوى المقال الكامل بصيغة HTML بسيطة" },
              tags: { type: "array", items: { type: "string" }, description: "4-7 وسوم عربية" },
              readTime: { type: "integer", description: "وقت القراءة بالدقائق" },
              seoTitle: { type: "string", description: "عنوان SEO (50-60 حرف)" },
              seoDescription: { type: "string", description: "وصف SEO (150-160 حرف)" },
              keywords: { type: "array", items: { type: "string" }, description: "5-8 كلمات مفتاحية" }
            },
            required: ["title", "excerpt", "content", "tags", "readTime", "seoTitle", "seoDescription", "keywords"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "save_article_content" } }
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    const argsString = toolCall && 'function' in toolCall ? toolCall.function?.arguments : undefined;
    if (argsString) {
      const parsed = JSON.parse(argsString) as {
        title?: string;
        excerpt?: string;
        content?: string;
        tags?: string[];
        readTime?: number;
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
      };
      if (!parsed.title || !parsed.content) throw new Error("AI returned empty article");
      return {
        title: parsed.title,
        excerpt: parsed.excerpt || "",
        content: parsed.content,
        tags: parsed.tags || [],
        readTime: parsed.readTime || 5,
        seoTitle: parsed.seoTitle || "",
        seoDescription: parsed.seoDescription || "",
        keywords: parsed.keywords || [],
      };
    }
    throw new Error("No tool call returned");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[generateArticleContent] Error:", message);
    return {
      title: "",
      excerpt: "",
      content: "",
      tags: [],
      readTime: 5,
      seoTitle: "",
      seoDescription: "",
      keywords: [],
    };
  }
}

// Generate news metadata from content
export async function generateNewsMeta(content: string): Promise<{
  title: string;
  subtitle: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}> {
  try {
    console.log("[generateNewsMeta] Starting with content length:", content.length);
    
    // Use gpt-4o with function calling for reliable structured output
    // gpt-5 can have issues with structured output on some proxies
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `أنت محرر صحفي محترف بخبرة 20 سنة في صناعة العناوين الجذابة عالية التأثير.

مهمتك: توليد عناوين رئيسية وفرعية لمحتوى صحفي صحي.

قواعد العنوان الرئيسي (مهم جداً):
- يجب أن يكون العنوان بين 8 و 12 كلمة (لا أقل من 8 كلمات أبداً!)
- جذاب ولافت ويثير الفضول
- يحتوي على المعلومة الأساسية للخبر
- مناسب للنشر الرقمي والسوشيال ميديا
- بأسلوب صحفي احترافي

قواعد العنوان الفرعي:
- بين 6 و 10 كلمات
- يوضح تفاصيل إضافية عن الخبر
- يكمل العنوان الرئيسي ولا يكرره

الأسلوب:
- لغة عربية صحفية قوية وواضحة
- نبرة إعلامية حديثة ومهنية
- خالٍ من المبالغة أو التهويل

قواعد الموجز:
- يحتوي على أهم 3-4 نقاط في الخبر
- بين 150 و 200 حرف
- معلوماتي ومفيد` 
        },
        { 
          role: "user", 
          content: `ولّد عناوين جذابة ومثيرة لهذا المحتوى الصحي:\n\n${content.substring(0, 2000)}` 
        }
      ] as any,
      max_completion_tokens: 1024,
      tools: [{
        type: "function",
        function: {
          name: "save_news_metadata",
          description: "حفظ البيانات الوصفية للخبر",
          parameters: {
            type: "object",
            properties: {
              title: { 
                type: "string", 
                description: "عنوان رئيسي جذاب للخبر (8-12 كلمة، 60-90 حرف)" 
              },
              subtitle: { 
                type: "string", 
                description: "عنوان فرعي توضيحي (6-10 كلمات، 50-80 حرف)" 
              },
              summary: { 
                type: "string", 
                description: "موجز ذكي للخبر (150-200 حرف)" 
              },
              seoTitle: { 
                type: "string", 
                description: "عنوان محسن لمحركات البحث (50-60 حرف)" 
              },
              seoDescription: { 
                type: "string", 
                description: "وصف SEO (150-160 حرف)" 
              },
              keywords: { 
                type: "array", 
                items: { type: "string" },
                description: "5-8 كلمات مفتاحية عربية"
              }
            },
            required: ["title", "subtitle", "summary", "seoTitle", "seoDescription", "keywords"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "save_news_metadata" } }
    });

    console.log("[generateNewsMeta] Response received");
    
    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;
    if (toolCall?.function?.arguments) {
      console.log("[generateNewsMeta] Tool call arguments:", toolCall.function.arguments.substring(0, 300));
      const parsed = JSON.parse(toolCall.function.arguments);
      if (!parsed.title) {
        throw new Error("AI returned empty metadata");
      }
      return parsed;
    }
    
    // Fallback to message content
    const result = response.choices[0]?.message?.content || "{}";
    console.log("[generateNewsMeta] Fallback content:", result.substring(0, 300));
    const parsed = JSON.parse(result);
    if (!parsed.title) {
      throw new Error("AI returned empty metadata");
    }
    return parsed;
  } catch (error: any) {
    console.error("[generateNewsMeta] Error:", error?.message || error);
    throw error;
  }
}

export interface NewsAnalysis {
  category: string;
  relevanceScore: number;
  keywords: string[];
  topics: string[];
  entities: string[];
  credibilityScore: number;
  summary: string;
  isBreaking: boolean;
}

export async function analyzeNewsContent(
  title: string,
  summary: string,
  content: string
): Promise<NewsAnalysis | null> {
  try {
    const text = `العنوان: ${title}\n\nالملخص: ${summary}\n\nالمحتوى: ${content.substring(0, 2000)}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت محلل أخبار صحية متخصص. قم بتحليل الخبر التالي وتصنيفه.

أرجع النتيجة بصيغة JSON فقط:
{
  "category": "اختر من: health-news, saudi-health, health-community, health-reports, nutrition, quality-life, misc",
  "relevanceScore": رقم من 0 إلى 100 يمثل مدى أهمية الخبر للصحة,
  "keywords": ["كلمات مفتاحية رئيسية"],
  "topics": ["المواضيع الرئيسية"],
  "entities": ["الأشخاص أو المؤسسات المذكورة"],
  "credibilityScore": رقم من 0 إلى 100 يمثل مصداقية المصدر,
  "summary": "ملخص قصير بالعربية في جملتين",
  "isBreaking": true إذا كان خبراً عاجلاً أو هاماً جداً
}`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const result = response.choices[0]?.message?.content;
    if (!result) return null;

    return JSON.parse(result) as NewsAnalysis;
  } catch (error: any) {
    console.error("[analyzeNewsContent] Error:", error?.message || error);
    return null;
  }
}

export async function classifyNewsWithAI(title: string, content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `صنف هذا الخبر إلى إحدى الفئات التالية وأرجع اسم الفئة فقط:
- health-news: أخبار صحية عامة
- saudi-health: أخبار صحية سعودية
- health-community: مجتمع صحي
- health-reports: تقارير صحية
- nutrition: تغذية
- quality-life: جودة الحياة
- misc: منوعات`
        },
        {
          role: "user",
          content: `العنوان: ${title}\n\n${content.substring(0, 500)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    return response.choices[0]?.message?.content?.trim() || "misc";
  } catch (error) {
    return "misc";
  }
}

// =====================================================
// AI Image Generation Functions
// =====================================================

export interface ImageGenerationOptions {
  prompt: string;
  quality?: "standard" | "hd";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  style?: "vivid" | "natural";
  model?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  revisedPrompt?: string;
  error?: string;
  generationTimeMs?: number;
}

async function callGeminiImageGeneration(apiKey: string, prompt: string, baseUrl?: string, model?: string): Promise<ImageGenerationResult> {
  const startTime = Date.now();
  const { GoogleGenAI, Modality } = await import('@google/genai');

  const aiConfig: any = { apiKey };
  if (baseUrl) {
    aiConfig.httpOptions = { apiVersion: "", baseUrl };
  }
  const ai = new GoogleGenAI(aiConfig);

  const selectedModel = model || "gemini-2.0-flash-preview-image-generation";
  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: [Modality.IMAGE] },
  });

  const generationTimeMs = Date.now() - startTime;
  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

  if (!imagePart?.inlineData?.data) {
    return { success: false, error: "لم يتم توليد صورة، حاول مرة أخرى", generationTimeMs };
  }

  let imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width && metadata.height) {
      const targetRatio = 16 / 9;
      const currentRatio = metadata.width / metadata.height;
      let cropWidth = metadata.width;
      let cropHeight = metadata.height;
      if (currentRatio < targetRatio) {
        cropHeight = Math.round(metadata.width / targetRatio);
      } else {
        cropWidth = Math.round(metadata.height * targetRatio);
      }
      const left = Math.round((metadata.width - cropWidth) / 2);
      const top = Math.round((metadata.height - cropHeight) / 2);
      imageBuffer = await sharp(imageBuffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(1280, 720)
        .png()
        .toBuffer();
    }
  } catch (cropError) {
    console.error("Image crop/resize error (using original):", cropError);
  }

  return { success: true, imageBuffer, imageMimeType: 'image/png', revisedPrompt: prompt, generationTimeMs };
}

async function cropTo16x9(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width && metadata.height) {
      const targetRatio = 16 / 9;
      const currentRatio = metadata.width / metadata.height;
      let cropWidth = metadata.width;
      let cropHeight = metadata.height;
      if (currentRatio < targetRatio) {
        cropHeight = Math.round(metadata.width / targetRatio);
      } else {
        cropWidth = Math.round(metadata.height * targetRatio);
      }
      const left = Math.round((metadata.width - cropWidth) / 2);
      const top = Math.round((metadata.height - cropHeight) / 2);
      return await sharp(imageBuffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(1280, 720)
        .png()
        .toBuffer();
    }
  } catch (err) {
    console.error("Crop error (using original):", err);
  }
  return imageBuffer;
}

export function buildNewsImagePrompt(options: {
  title: string;
  summary?: string;
  category?: string;
  style?: "photorealistic" | "illustration" | "abstract";
  mood?: "neutral" | "positive" | "serious" | "breaking";
  language?: string;
}): string {
  const {
    title,
    summary = "",
    category = "health",
    style = "photorealistic",
    mood = "neutral",
    language = "Arabic",
  } = options;

  const styleDescriptions: Record<string, string> = {
    photorealistic: "professional photojournalism style, high quality, realistic, clean minimal composition",
    illustration: "modern digital illustration, clean and professional, minimal design",
    abstract: "abstract artistic representation, contemporary design, clean and modern",
  };

  const moodDescriptions: Record<string, string> = {
    neutral: "balanced, professional, informative tone",
    positive: "uplifting, bright, optimistic feel",
    serious: "serious professional tone, authoritative",
    breaking: "dramatic, attention-grabbing, urgent feel",
  };

  return `Create a professional news image for this article:
Title: ${title}
${summary ? `Summary: ${summary}` : ""}
Category: ${category}
Language: ${language} news context
Style: ${styleDescriptions[style] || styleDescriptions.photorealistic}
Mood: ${moodDescriptions[mood] || moodDescriptions.neutral}

CRITICAL REQUIREMENTS:
- ABSOLUTELY NO TEXT, LETTERS, WORDS, NUMBERS, CHARACTERS, OR TYPOGRAPHY OF ANY KIND IN THE IMAGE
- NO Arabic text, NO English text, NO text in any language whatsoever
- NO watermarks, NO logos, NO signs with writing, NO banners with text
- NO newspapers, books, or any objects containing visible text
- The image must be 100% text-free and purely visual
- High quality, suitable for news publication
- Culturally appropriate for ${language} news context
- Professional and credible
- 16:9 aspect ratio
- Focus on visual storytelling through imagery only
- Clean, modern composition with no textual elements
- No human figures, faces, hands, or bodies`;
}

export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const startTime = Date.now();

  const styleRules = `\n\nSTRICT RULES: No text, letters, numbers, watermarks, or writing of any kind. No human figures, faces, hands, or bodies. Clean simple composition. No 3D renders, no sci-fi effects, no complex backgrounds. Photorealistic photography style.`;
  const fullPrompt = `${options.prompt}${styleRules}`;

  // PRIMARY: Gemini image generation via direct Google API key
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (googleApiKey) {
    try {
      console.log("Generating image via Nano Banana 2 (primary)...");
      const result = await callGeminiImageGeneration(googleApiKey, fullPrompt);
      if (result.success) return result;
      console.warn("Nano Banana 2 failed:", result.error);
    } catch (error: any) {
      console.warn("Nano Banana 2 error, trying fallbacks:", error.message);
    }
  }

  // FALLBACK 1: gpt-image-1 via OpenAI
  const openaiCfg = getOpenAIConfig();
  if (openaiCfg.apiKey && openaiCfg.apiKey !== "missing-openai-api-key") {
    try {
      console.log("Generating image via gpt-image-1 (fallback 1)...");
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI(openaiCfg);
      const response = await client.images.generate({
        model: "gpt-image-1",
        prompt: fullPrompt,
        size: "1536x1024",
      });
      const base64 = (response.data?.[0] as any)?.b64_json;
      if (base64) {
        let imageBuffer = Buffer.from(base64, 'base64');
        imageBuffer = await cropTo16x9(imageBuffer);
        console.log("gpt-image-1 generation successful");
        return { success: true, imageBuffer, imageMimeType: 'image/png', revisedPrompt: fullPrompt, generationTimeMs: Date.now() - startTime };
      }
    } catch (error: any) {
      console.warn("gpt-image-1 failed, trying Gemini fallback:", error.message);
    }
  }

  // FALLBACK 2: Gemini via AI_INTEGRATIONS_* env if configured
  const geminiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const geminiUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  if (geminiKey && geminiUrl) {
    try {
      console.log("Generating image via Gemini (fallback 2)...");
      return await callGeminiImageGeneration(geminiKey, fullPrompt, geminiUrl, "gemini-2.0-flash-preview-image-generation");
    } catch (error: any) {
      console.error("All image generation methods failed:", error.message);
      return { success: false, error: error.message || "فشل في توليد الصورة", generationTimeMs: Date.now() - startTime };
    }
  }

  return {
    success: false,
    error: "لا يوجد مفتاح API لتوليد الصور",
    generationTimeMs: Date.now() - startTime,
  };
}

export async function generatePromptFromContent(
  title: string,
  content: string,
  generationType: "realistic" | "artistic" | "hybrid" = "artistic"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a photo art director for a clean, modern Arabic health news portal. Generate a simple, focused image prompt.

CORE PRINCIPLE: One clear subject. Clean background. Simple composition.

STYLE: Clean editorial photography. Soft natural or studio lighting. Uncluttered. Professional but approachable.

PROCESS:
1. Identify the single most recognizable object or scene that represents this article's topic.
2. Describe it simply and clearly — no complex scenes, no multiple elements competing for attention.
3. Choose a clean, neutral background that complements the subject.

GOOD SUBJECT TYPES:
- A specific food or ingredient (for nutrition topics)
- A specific medical device or tool in use (blood pressure cuff, inhaler, etc.)
- A relevant plant, fruit, or natural element
- A close-up of a body part in a clean medical context (an ear, a knee, an eye — no faces)
- A relevant everyday object (running shoes, a scale, a pill organizer)

LIGHTING & BACKGROUND:
- Soft natural daylight or clean studio lighting
- Clean white, light grey, or soft pastel background
- Subtle shadow for depth, nothing dramatic

FORBIDDEN:
- People, faces, hands, bodies
- Text, numbers, labels, watermarks
- Complex 3D renders, microscopic cells, molecules
- Dramatic "god-rays", bioluminescent glow, sci-fi aesthetics
- Multiple competing subjects
- Abstract concepts

EXAMPLES:
- Heart health → "A fresh red apple and a small bowl of walnuts on a clean white marble surface, soft diffused natural light, simple top-down composition, minimal shadow"
- Diabetes → "A glucose meter displaying a reading next to a small pile of blueberries on a light grey surface, soft studio lighting, clean minimal composition"
- Sleep health → "A simple white pillow on crisp linen sheets with a small lavender sprig beside it, soft warm morning light, calm and restful feel"
- Vaccination → "A single clean glass vial and a hypodermic needle on a sterile white surface, clinical studio lighting, simple composition"
- Omega-3 → "Fresh salmon fillet with a lemon wedge and fresh herbs on a white ceramic plate, natural side lighting, food photography style"

Write ONE concise prompt (1-2 sentences max). English only. Return ONLY the prompt text.`
        },
        {
          role: "user",
          content: `Article title: ${title}\n\nArticle content:\n${content.substring(0, 1500)}`
        }
      ],
      max_completion_tokens: 300,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() ||
      "A stethoscope resting on a clean white surface beside a green apple, soft natural light, simple minimal composition.";
  } catch (error) {
    console.error("Error generating prompt:", error);
    return "A stethoscope resting on a clean white surface beside a green apple, soft natural light, simple minimal composition.";
  }
}

// Advanced editorial translation and content generation for RSS news
export interface EditorialTranslation {
  title: string;
  subtitle: string;
  content: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  category: string;
  importanceScore: number;
  isBreaking: boolean;
}

export async function translateAndProcessNews(
  englishTitle: string,
  englishContent: string,
  englishSummary: string,
  sourceUrl: string,
  sourceName: string
): Promise<EditorialTranslation> {
  const systemPrompt = `أنت محرر صحفي متخصص في الترجمة التحريرية الإعلامية للأخبار الصحية.
مهمتك ترجمة ومعالجة الأخبار الإنجليزية إلى العربية بأسلوب صحفي احترافي.

قواعد الترجمة:
1. تجنب الترجمة الحرفية - انقل المعنى بطريقة سلسة وجذابة للقارئ العربي
2. استخدم الأسلوب الصحفي الإعلامي العربي المعاصر
3. حافظ على الدقة العلمية والطبية في المصطلحات
4. اجعل النص مناسباً للجمهور العربي ثقافياً

قواعد العناوين:
- العنوان الرئيسي: جذاب ومثير للفضول (8-12 كلمة)
- العنوان الفرعي: توضيحي ومكمل (6-10 كلمات)
- تجنب الألفاظ الركيكة والتراكيب المترجمة حرفياً

قواعد المحتوى:
- أعد صياغة المحتوى بالكامل بأسلوب عربي أصيل
- حافظ على المعلومات الأساسية والحقائق
- أضف سلاسة وتماسك للنص
- قسّم المحتوى إلى فقرات منفصلة (كل فقرة في <p>...</p>)
- استخدم HTML للتنسيق: <p> للفقرات، <strong> للنص المهم، <ul>/<li> للقوائم إن وجدت

قواعد SEO:
- كلمات مفتاحية عربية ذات صلة بالموضوع (5-8 كلمات)
- عنوان SEO محسن (50-60 حرف)
- وصف SEO جذاب (150-160 حرف)

تقييم الأهمية:
- أعط درجة من 1-10 لأهمية الخبر للقارئ العربي
- حدد إذا كان خبراً عاجلاً

التصنيف:
اختر من: health-news, saudi-health, nutrition, quality-life, health-reports, misc

أرجع النتيجة بصيغة JSON فقط بالشكل التالي:
{
  "title": "العنوان الرئيسي",
  "subtitle": "العنوان الفرعي",
  "content": "<p>الفقرة الأولى</p><p>الفقرة الثانية</p>",
  "summary": "ملخص قصير",
  "seoTitle": "عنوان SEO",
  "seoDescription": "وصف SEO",
  "keywords": ["كلمة1", "كلمة2"],
  "category": "health-news",
  "importanceScore": 7,
  "isBreaking": false
}`;

  const userMessage = `ترجم وحرر هذا الخبر الصحي:

العنوان الإنجليزي: ${englishTitle}

المحتوى الإنجليزي:
${englishContent.substring(0, 4000)}

الملخص الإنجليزي: ${englishSummary}

المصدر: ${sourceName}
الرابط: ${sourceUrl}`;

  try {
    // Use gpt-4o with function calling for reliable structured output
    // gpt-5 can have issues with structured output on some proxies
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ] as any,
      max_completion_tokens: 4096,
      tools: [{
        type: "function",
        function: {
          name: "save_translation",
          description: "حفظ الترجمة التحريرية المعالجة للخبر الصحي",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "العنوان الرئيسي بالعربية" },
              subtitle: { type: "string", description: "العنوان الفرعي بالعربية" },
              content: { type: "string", description: "المحتوى المترجم بتنسيق HTML" },
              summary: { type: "string", description: "ملخص قصير بالعربية" },
              seoTitle: { type: "string", description: "عنوان SEO محسن" },
              seoDescription: { type: "string", description: "وصف SEO" },
              keywords: { type: "array", items: { type: "string" }, description: "الكلمات المفتاحية" },
              category: { type: "string", enum: ["health-news", "saudi-health", "nutrition", "quality-life", "health-reports", "misc"] },
              importanceScore: { type: "number", description: "درجة الأهمية 1-10" },
              isBreaking: { type: "boolean", description: "هل هو خبر عاجل؟" }
            },
            required: ["title", "content", "summary", "category", "importanceScore"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "save_translation" } }
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;
    console.log("Translation tool call received:", toolCall ? "yes" : "no");

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      if (parsed.title && parsed.content) {
        return {
          title: parsed.title,
          subtitle: parsed.subtitle || '',
          content: parsed.content,
          summary: parsed.summary || '',
          seoTitle: parsed.seoTitle || parsed.title,
          seoDescription: parsed.seoDescription || parsed.summary || '',
          keywords: parsed.keywords || [],
          category: parsed.category || 'misc',
          importanceScore: parsed.importanceScore || 5,
          isBreaking: parsed.isBreaking || false
        };
      }
    }

    throw new Error("Failed to get translated content - no valid response from AI");
  } catch (error: any) {
    console.error("Translation error:", error?.message || error);
    throw error;
  }
}

// Auto-select important news based on criteria
export async function evaluateNewsImportance(
  newsItems: Array<{ title: string; summary: string; source: string }>
): Promise<Array<{ index: number; score: number; reason: string; shouldPublish: boolean }>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `أنت محرر أخبار صحية متخصص. مهمتك تقييم الأخبار واختيار الأهم منها للنشر.

معايير التقييم:
1. الصلة بالجمهور العربي والسعودي (0-3 نقاط)
2. الجدة والحداثة (0-2 نقاط)
3. التأثير على الصحة العامة (0-3 نقاط)
4. الموثوقية والمصدر (0-2 نقاط)

إرشادات النشر:
- الأخبار بدرجة 7+ يُنصح بنشرها
- الأخبار بدرجة 5-6 قابلة للنشر مع تعديلات
- الأخبار بدرجة أقل من 5 لا يُنصح بنشرها`
        },
        {
          role: "user",
          content: `قيّم هذه الأخبار:\n\n${newsItems.map((item, i) => 
            `[${i}] العنوان: ${item.title}\nالملخص: ${item.summary}\nالمصدر: ${item.source}`
          ).join('\n\n')}`
        }
      ],
      max_completion_tokens: 2048,
      tools: [{
        type: "function",
        function: {
          name: "evaluate_news",
          description: "تقييم الأخبار",
          parameters: {
            type: "object",
            properties: {
              evaluations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    score: { type: "number", description: "درجة 1-10" },
                    reason: { type: "string", description: "سبب التقييم" },
                    shouldPublish: { type: "boolean" }
                  },
                  required: ["index", "score", "reason", "shouldPublish"]
                }
              }
            },
            required: ["evaluations"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "evaluate_news" } }
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.evaluations || [];
    }
    return [];
  } catch (error) {
    console.error("News evaluation error:", error);
    return [];
  }
}

export interface InfographicData {
  title: string;
  subtitle?: string;
  bulletPoints?: { icon: string; text: string; highlight?: string }[];
  keywords?: string[];
  description?: string;
  visualDesign?: {
    primaryColor: string;
    secondaryColor: string;
    style: 'modern' | 'classic' | 'minimalist' | 'colorful' | 'professional';
    layout: 'vertical' | 'horizontal' | 'grid' | 'timeline' | 'comparison';
    visualElements?: string[];
  };
  dataVisualization?: {
    hasStatistics: boolean;
    statisticsFormat?: string;
  };
  conclusion?: string;
  // legacy compat
  template?: 'stats' | 'tips' | 'health';
  stats?: { value: string; label: string }[];
  points?: string[];
}

export async function extractInfographicFromText(text: string): Promise<InfographicData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت خبير في تصميم الإنفوجرافيك الصحفي وتحويل المحتوى النصي إلى محتوى بصري جذاب.

المهمة: قم بتحليل المحتوى واقترح تصميم إنفوجرافيك احترافي يناسب القارئ العربي.

المطلوب:
1. عنوان جذاب وقصير (أقصى 10 كلمات)
2. عنوان فرعي توضيحي (أقصى 15 كلمة)
3. من 4 إلى 7 نقاط رئيسية مع أيقونة مناسبة لكل نقطة ورقم/نسبة بارزة إن وُجدت
4. اقتراح التصميم المرئي: الألوان المناسبة وأسلوب التصميم والتخطيط
5. خلاصة أو توصية مهمة

معايير الأيقونات - اختر من هذه القائمة فقط:
heart, activity, brain, shield, leaf, droplet, thermometer, zap, target, award, 
trending-up, users, clock, calendar, check-circle, alert-triangle, star, percent,
pill, stethoscope, apple, dna, eye, lungs, bone, microscope, syringe

معايير الألوان: يجب أن تكون احترافية ومريحة للعين، مناسبة للموضوع الصحي.
- للأخبار التحذيرية: درجات الأحمر أو البرتقالي
- للوقاية والصحة: درجات الأخضر أو الأزرق
- للإحصائيات: درجات البنفسجي أو الأزرق الداكن`,
        },
        {
          role: "user",
          content: `حلّل هذا النص وأنتج بيانات الإنفوجرافيك:\n\n${text.substring(0, 3000)}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_infographic",
            description: "إنشاء هيكل إنفوجرافيك احترافي من النص",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                subtitle: { type: "string" },
                bulletPoints: {
                  type: "array",
                  description: "النقاط الرئيسية (4-7 نقاط)",
                  items: {
                    type: "object",
                    properties: {
                      icon: { type: "string", description: "اسم الأيقونة من القائمة المحددة" },
                      text: { type: "string", description: "نص النقطة (جملة واحدة موجزة)" },
                      highlight: { type: "string", description: "رقم أو نسبة بارزة مرتبطة بالنقطة (اختياري)" },
                    },
                    required: ["icon", "text"],
                  },
                },
                conclusion: { type: "string", description: "خلاصة أو توصية (جملة واحدة)" },
                visualDesign: {
                  type: "object",
                  properties: {
                    primaryColor: { type: "string", description: "اللون الأساسي hex مثل #2563eb" },
                    secondaryColor: { type: "string", description: "اللون الثانوي hex" },
                    style: { type: "string", enum: ["modern", "classic", "minimalist", "colorful", "professional"] },
                    layout: { type: "string", enum: ["vertical", "horizontal", "grid", "timeline", "comparison"] },
                  },
                  required: ["primaryColor", "secondaryColor", "style", "layout"],
                },
                dataVisualization: {
                  type: "object",
                  properties: {
                    hasStatistics: { type: "boolean" },
                    statisticsFormat: { type: "string", enum: ["percentage", "number", "comparison"] },
                  },
                  required: ["hasStatistics"],
                },
              },
              required: ["title", "bulletPoints", "visualDesign"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_infographic" } },
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed as InfographicData;
    }
    return { title: "إنفوجرافيك صحي", template: "health" };
  } catch (error) {
    console.error("Error extracting infographic from text:", error);
    return { title: "إنفوجرافيك صحي", template: "health" };
  }
}

export async function generateInfographicPrompt(
  title: string,
  data: Record<string, any>,
  category: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `أنت خبير في تصميم الإنفوجرافيك الصحي.
مهمتك: إنشاء prompt لتوليد إنفوجرافيك جذاب ومعلوماتي.

قواعد:
1. اكتب بالإنجليزية
2. ركز على التصميم البصري الواضح
3. استخدم ألوان هادئة ومريحة للعين
4. أضف عناصر بصرية تمثل البيانات

الفئة: ${category}
أرجع الـ prompt فقط.`
        },
        {
          role: "user",
          content: `العنوان: ${title}\n\nالبيانات: ${JSON.stringify(data)}`
        }
      ],
      max_completion_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || 
      "Clean modern infographic design, healthcare data visualization, professional layout, soft colors";
  } catch (error) {
    return "Clean modern infographic design, healthcare data visualization, professional layout, soft colors";
  }
}

export async function categorizeNewsArticle(
  title: string,
  content: string,
  availableCategories: { slug: string; nameAr: string; description: string | null }[]
): Promise<string> {
  try {
    const categoriesList = availableCategories
      .map(c => `- ${c.slug}: ${c.nameAr}${c.description ? ` (${c.description})` : ''}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `أنت مصنف أخبار صحية. مهمتك تحديد التصنيف الأنسب للخبر من القائمة المتاحة.

التصنيفات المتاحة:
${categoriesList}

القواعد:
1. أرجع فقط الـ slug الخاص بالتصنيف الأنسب (كلمة واحدة فقط بدون أي شرح)
2. إذا كان الخبر عن السعودية أو منطقة سعودية استخدم "saudi-health"
3. إذا كان عن تغذية أو غذاء استخدم "nutrition"
4. إذا كان عن فعالية أو مؤتمر استخدم "health-events"
5. إذا كان تقرير أو دراسة استخدم "health-reports"
6. إذا كان عن المجتمع أو توعية استخدم "health-community"
7. إذا كان عن جودة حياة أو رياضة أو نمط حياة استخدم "quality-life"
8. الأخبار الصحية العامة استخدم "health-news"
9. إذا لم يناسب أي تصنيف استخدم "misc"`
        },
        {
          role: "user",
          content: `صنف هذا الخبر:\n\nالعنوان: ${title}\n\nالمحتوى: ${content?.substring(0, 500) || 'لا يوجد محتوى'}`
        }
      ],
      max_completion_tokens: 50,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content?.trim().toLowerCase() || "misc";
    const validSlugs = availableCategories.map(c => c.slug);
    return validSlugs.includes(result) ? result : "misc";
  } catch (error) {
    console.error("Error categorizing news:", error);
    return "misc";
  }
}

// ── INFOGRAPHIC AI IMAGE GENERATION ──────────────────────────────────────

export function buildInfographicAIPrompt(data: InfographicData): string {
  const primary = data.visualDesign?.primaryColor || "#059669";
  const secondary = data.visualDesign?.secondaryColor || "#10b981";
  const layout = data.visualDesign?.layout || "vertical";
  const hasStats = data.dataVisualization?.hasStatistics;
  const points = data.bulletPoints || [];
  const title = data.title || "";
  const topicLower = (title + " " + (data.subtitle || "")).toLowerCase();

  // Choose topic-aware hero illustration
  let heroArt = "glowing DNA helix and human body silhouette filled with health icons, surrounded by floating medical symbols";
  let moodColor = "deep teal and midnight blue";
  if (topicLower.match(/قلب|ضغط|نبض|heart|blood/)) {
    heroArt = "a detailed glowing anatomical heart mid-beat, arteries branching outward, ECG wave cutting across, warm red-orange glow on dark background";
    moodColor = "deep crimson and warm coral";
  } else if (topicLower.match(/سكر|سكري|انسولين|diabetes|glucose/)) {
    heroArt = "a stylized glucose molecule crystal glowing in purple light, with a blood drop and a needle icon, energy ripples around it";
    moodColor = "deep purple and electric violet";
  } else if (topicLower.match(/تغذية|غذاء|أكل|وجبة|سعرات|nutrition|food|diet/)) {
    heroArt = "an overhead explosion of vibrant fresh foods — avocado, berries, grains, greens — radiating outward from center, colorful and lush";
    moodColor = "forest green and warm amber";
  } else if (topicLower.match(/نوم|نوم|sleep|راحة/)) {
    heroArt = "a serene night sky scene with a crescent moon, stars, and soft sleep waves flowing over a resting silhouette";
    moodColor = "midnight navy and soft indigo";
  } else if (topicLower.match(/فيتامين|vitamin|مكمل|supplement/)) {
    heroArt = "translucent glowing vitamin capsules floating in space, molecular structures orbiting them, sun rays in the background";
    moodColor = "golden amber and sky blue";
  } else if (topicLower.match(/وزن|رياضة|تمرين|لياقة|fitness|exercise|weight/)) {
    heroArt = "dynamic silhouette of an athlete mid-motion, surrounded by energy rings, heartbeat line, and fitness icons";
    moodColor = "electric blue and neon green";
  } else if (topicLower.match(/إفراط|excess|خطر|danger|تحذير|ضار/)) {
    heroArt = "a dramatic split image: left side dark with overflowing food and warning symbols, right side bright with balanced healthy plate and green checkmark — high contrast";
    moodColor = "warning red and dark charcoal";
  } else if (topicLower.match(/مناعة|immune|فيروس|virus|بكتير/)) {
    heroArt = "microscopic battlefield: bright white blood cells as warriors surrounding dark virus particles, shield emblem glowing in center";
    moodColor = "electric cyan and deep navy";
  } else if (topicLower.match(/ماء|شرب|hydration|ترطيب|water/)) {
    heroArt = "a giant luminous water drop reflecting a healthy body silhouette inside it, surrounded by smaller droplets and wave rings";
    moodColor = "ocean blue and aqua teal";
  } else if (topicLower.match(/دماغ|مخ|ذاكرة|brain|mental|عقل/)) {
    heroArt = "a glowing human brain half-anatomy half-circuit-board, with golden neural synapses firing, floating thoughts as light dots";
    moodColor = "electric gold and deep purple";
  } else if (topicLower.match(/لقيمات|لقيمة|حلوى|رمضان|حلويات/)) {
    heroArt = "a dramatic overhead shot of golden fried dough balls (luqaimat) surrounded by honey drizzle and sugar crystals, with a subtle red warning glow and health alert halo";
    moodColor = "warm amber and deep red";
  }

  const sizeGuide = layout === "horizontal"
    ? "1200×630 px wide landscape"
    : layout === "grid"
    ? "1080×1080 px square"
    : "800×1200 px tall portrait";

  const pointsDesc = points.slice(0, 6).map((p, i) => {
    const num = String(i + 1).padStart(2, "0");
    const stat = p.highlight ? ` — stat: ${p.highlight}` : "";
    return `  ${num}. ${p.text}${stat}`;
  }).join("\n");

  const statsDesc = hasStats && points.filter(p => p.highlight).length >= 2
    ? `\nAt the bottom, show a clean visual data section: large glowing numbers (${points.filter(p => p.highlight).slice(0, 3).map(p => p.highlight).join(", ")}) each beneath a minimal label, arranged in a horizontal row like a stat counter — no boxes, just floating numbers with a thin glowing underline.`
    : "";

  return `You are a world-class infographic designer creating an award-winning Arabic health poster.

SIZE: ${sizeGuide}. Final output must be a single clean poster image, no mock-ups, no device frames.

─── TOP THIRD: HERO ARTWORK ───
Fill the top portion with this cinematic illustration:
${heroArt}
This image should feel like a premium editorial photo. Rich lighting, depth, atmosphere. Let it bleed edge-to-edge.
Over this image, at the very bottom of the hero zone, place the title in large bold Arabic typography:
"${title}"
${data.subtitle ? `Below that, smaller: "${data.subtitle}"` : ""}
Use a soft dark gradient fade beneath the text so it reads clearly over the artwork.

─── MIDDLE: INFORMATION FLOW ───
Below the hero, on a clean dark background (${moodColor} tones, no harsh borders), display these points in a flowing vertical list:

${pointsDesc}

Design language for each point — NO BOXES, NO FRAMES:
• A softly glowing circular number (${secondary} glow) floats to the right
• A single relevant flat icon sits beside the number — heart, lightning bolt, fork, shield, drop, warning triangle, etc. — colorful, simple, clear
• The Arabic text flows naturally to the left of the icon, white, clean, generous line-height
• If a stat exists, the number appears large and bold in ${secondary} color, floating at the far left as an accent — not in a box
• A hairline horizontal separator (subtle, low-opacity) divides each point from the next${statsDesc}

─── BOTTOM: CLOSE ───
${data.conclusion ? `A single closing thought: "${data.conclusion}" — italic, soft grey, centered, with a thin decorative line above it` : ""}
Tiny brand mark bottom-right: "كبسولة" in ${secondary}.

─── DESIGN SOUL ───
Think: Bloomberg infographic meets Arabic newspaper editorial design.
The layout breathes. There is generous whitespace. Typography is the hero alongside the illustration.
NO hard rectangular borders around text. NO boxes. NO frames.
Colors feel rich and intentional — ${moodColor} palette.
Icons are decorative, not functional — they enhance visual rhythm.
This should look like it belongs in a premium health magazine, not a PowerPoint slide.
Arabic text flows right-to-left throughout.`;
}

export async function generateInfographicImage(data: InfographicData): Promise<ImageGenerationResult> {
  const startTime = Date.now();
  const prompt = buildInfographicAIPrompt(data);

  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return { success: false, error: "مفتاح Google API غير مهيأ" };
  }

  try {
    console.log("[Infographic AI] Generating image...");
    const { GoogleGenAI, Modality } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: googleApiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] } as any,
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      return { success: false, error: "لم يُولَّد الإنفوجرافيك، حاول مرة أخرى", generationTimeMs: Date.now() - startTime };
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    return {
      success: true,
      imageBuffer,
      imageMimeType: 'image/png',
      revisedPrompt: prompt,
      generationTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("[Infographic AI] Generation error:", error.message);
    return { success: false, error: error.message || "فشل في التوليد", generationTimeMs: Date.now() - startTime };
  }
}

export async function generateEditorialInsights(analyticsData: any): Promise<{
  summary: string;
  categoryRecommendations: { category: string; action: string; reason: string; priority: "high" | "medium" | "low" }[];
  newSectionSuggestions: { name: string; description: string; reasoning: string }[];
  contentStrategy: string[];
  growthTips: string[];
}> {
  const systemPrompt = `أنت مستشار تحريري خبير ومحلل بيانات صحفي متخصص في الصحافة الصحية الرقمية العربية.
مهمتك تحليل بيانات أداء صحيفة "كبسولة" الصحية وتقديم توصيات عملية وذكية للمحرر المسؤول.

القواعد:
1. حلل البيانات بعمق — لا تكرر الأرقام فقط، بل استنتج الأنماط والفرص
2. قدم توصيات عملية قابلة للتطبيق فوراً
3. اقترح أبواب/تصنيفات جديدة بناءً على الفجوات في المحتوى الحالي واتجاهات القراء
4. استخدم لغة عربية واضحة ومهنية
5. ركز على ما يهم القارئ السعودي والعربي
6. كن صريحاً في نقاط الضعف واقترح حلولاً

أجب بتنسيق JSON التالي بالضبط:
{
  "summary": "ملخص تحليلي شامل للوضع الحالي (3-4 جمل)",
  "categoryRecommendations": [
    {
      "category": "اسم التصنيف",
      "action": "زيادة النشر | تقليل النشر | تحسين الجودة | إعادة تصنيف",
      "reason": "السبب مع أرقام داعمة",
      "priority": "high | medium | low"
    }
  ],
  "newSectionSuggestions": [
    {
      "name": "اسم الباب الجديد المقترح",
      "description": "وصف مختصر للباب",
      "reasoning": "لماذا هذا الباب مهم الآن"
    }
  ],
  "contentStrategy": ["توصية استراتيجية 1", "توصية 2", ...],
  "growthTips": ["نصيحة نمو 1", "نصيحة 2", ...]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `حلل بيانات أداء صحيفة كبسولة الصحية وقدم توصياتك:

📊 إحصائيات عامة:
- إجمالي الأخبار المنشورة: ${analyticsData.totalStats.published}
- إجمالي المشاهدات: ${analyticsData.totalStats.totalViews}
- متوسط المشاهدات لكل خبر: ${analyticsData.totalStats.avgViewsPerNews}
- عدد أيام النشاط: ${analyticsData.totalStats.daysActive} يوم

📂 أداء التصنيفات (مرتبة بالمشاهدات):
${analyticsData.categoryPerformance.map((c: any) => `- ${c.category}: ${c.count} خبر، ${c.views} مشاهدة، متوسط ${c.avgViews} مشاهدة/خبر`).join('\n')}

📈 ترند النشر (آخر 30 يوم):
${analyticsData.publishingTrend.filter((d: any) => d.count > 0).map((d: any) => `- ${d.date}: ${d.count} خبر`).join('\n') || 'لا توجد بيانات نشر'}

🏆 أعلى 10 أخبار مشاهدة:
${analyticsData.topPerformingNews.map((n: any, i: number) => `${i + 1}. [${n.category}] ${n.title} (${n.views} مشاهدة)`).join('\n')}

⚠️ تصنيفات ضعيفة الأداء:
${analyticsData.lowPerformingCategories.length > 0 ? analyticsData.lowPerformingCategories.map((c: any) => `- ${c.category}: ${c.count} خبر، متوسط ${c.avgViews} مشاهدة`).join('\n') : 'لا توجد تصنيفات ضعيفة'}

📡 مصادر الرادار:
${analyticsData.radarSourcePerformance.map((s: any) => `- ${s.name}: ${s.itemsCount} خبر`).join('\n') || 'لا توجد مصادر'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return JSON.parse(content);
  } catch (error: any) {
    console.error("[AI Insights] Error:", error.message);
    return {
      summary: "تعذر إنشاء التحليل حالياً. يرجى المحاولة مرة أخرى.",
      categoryRecommendations: [],
      newSectionSuggestions: [],
      contentStrategy: [],
      growthTips: [],
    };
  }
}


export interface ArchiveSearchResult {
  id: string;
  type: "news" | "article";
  title: string;
  excerpt: string;
  url: string;
  category: string;
  publishedAt: Date | null;
}

export interface ArchiveChatResponse {
  answer: string;
  sources: Array<{ title: string; url: string; type: "news" | "article" }>;
  foundInArchive: boolean;
}

export async function generateArchiveChatResponse(
  userMessage: string,
  archiveResults: ArchiveSearchResult[]
): Promise<ArchiveChatResponse> {
  const hasResults = archiveResults.length > 0;

  const archiveContext = hasResults
    ? archiveResults
        .map(
          (r, i) =>
            `[${i + 1}] ${r.type === "news" ? "خبر" : "مقال"}: "${r.title}"\nالفئة: ${r.category}\nالمحتوى: ${r.excerpt}\nالرابط: ${r.url}`
        )
        .join("\n\n")
    : "لا توجد نتائج في الأرشيف.";

  const systemPrompt = `أنت "مساعد كبسولة"، مساعد ذكي متخصص في الإجابة عن الأسئلة من أرشيف موقع كبسولة الصحي.

قواعد مهمة:
1. أجب فقط بناءً على المحتوى المقدم من الأرشيف أدناه.
2. إذا لم تجد معلومات كافية في الأرشيف، قل ذلك بصراحة بدلاً من اختراع معلومات.
3. اذكر المصادر بأرقامها [1], [2], إلخ عند الإشارة إليها في إجابتك.
4. استخدم لغة عربية واضحة ومناسبة.
5. لا تخترع أو تتخيل أخباراً أو معلومات غير موجودة في الأرشيف.

أرشيف كبسولة المتاح:
${archiveContext}

قدم إجابتك بصيغة JSON:
{
  "answer": "الإجابة التفصيلية بالعربية مع الإشارة للمصادر",
  "foundInArchive": true/false,
  "usedSources": [1, 2, ...]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userMessage },
      ],
      max_tokens: 2000,
      response_format: { type: "json_object" as const },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const usedIndices: number[] = parsed.usedSources || [];
    const sources = usedIndices
      .filter((i) => i >= 1 && i <= archiveResults.length)
      .map((i) => ({
        title: archiveResults[i - 1].title,
        url: archiveResults[i - 1].url,
        type: archiveResults[i - 1].type,
      }));

    return {
      answer:
        parsed.answer ||
        "عذراً، لم أتمكن من معالجة سؤالك. يرجى المحاولة مرة أخرى.",
      sources,
      foundInArchive: parsed.foundInArchive ?? hasResults,
    };
  } catch (error) {
    console.error("[ArchiveChat] OpenAI error:", error);
    return {
      answer: "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
      sources: [],
      foundInArchive: false,
    };
  }
}

// =====================================================
// Medical Content Capsule AI Functions
// =====================================================

export interface FactCheckResult {
  verdict: "موثوق" | "مشكوك فيه" | "مضلل";
  credibilityScore: number;
  explanation: string;
  notes: Array<{ claim: string; assessment: string }>;
}

export async function factCheckMedicalContent(text: string): Promise<FactCheckResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت مدقق طبي متخصص ذو خبرة واسعة في تقييم المحتوى الطبي والصحي.
مهمتك: تقييم دقة المحتوى الطبي المقدم مقارنةً بالإجماع العلمي الطبي الراسخ وتوصيات منظمة الصحة العالمية.

أرجع نتيجتك بصيغة JSON فقط:
{
  "verdict": "موثوق" أو "مشكوك فيه" أو "مضلل",
  "credibilityScore": رقم من 0 إلى 100,
  "explanation": "شرح موجز للحكم بالعربية (جملتان إلى ثلاث)",
  "notes": [
    {"claim": "الادعاء أو المعلومة المحددة", "assessment": "تقييم دقة هذه المعلومة بالعربية"}
  ]
}

معايير التقييم:
- موثوق (80-100): يتوافق مع الإجماع العلمي الطبي الحديث
- مشكوك فيه (40-79): يحتوي على معلومات غير دقيقة أو مبالغ فيها أو تحتاج تحققاً
- مضلل (0-39): يتناقض مع الحقائق الطبية الراسخة أو ينشر معلومات خاطئة`,
        },
        {
          role: "user",
          content: `قيّم دقة هذا المحتوى الطبي:\n\n${text}`,
        },
      ],
      max_completion_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      verdict: parsed.verdict || "مشكوك فيه",
      credibilityScore: parsed.credibilityScore ?? 50,
      explanation: parsed.explanation || "تعذر تقييم المحتوى.",
      notes: parsed.notes || [],
    };
  } catch (error: any) {
    console.error("[factCheckMedicalContent] Error:", error?.message);
    throw error;
  }
}

export async function simplifyMedicalText(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت متخصص في تبسيط المصطلحات الطبية للجمهور العام.
مهمتك: إعادة صياغة النص الطبي التالي بلغة عربية سهلة وواضحة يفهمها أي شخص، مع الحفاظ على المعنى الكامل والدقيق.

قواعد:
- استبدل كل مصطلح طبي معقد بتفسير مبسط
- استخدم جملاً قصيرة وواضحة
- تجنب الأرقام العلمية المعقدة وفسّرها بشكل عملي
- أضف أمثلة من الحياة اليومية عند الحاجة
- أرجع النص المبسط مباشرةً دون تعليقات إضافية`,
        },
        {
          role: "user",
          content: `بسّط هذا النص الطبي:\n\n${text}`,
        },
      ],
      max_completion_tokens: 4096,
    });

    return response.choices[0]?.message?.content || "تعذر تبسيط النص.";
  } catch (error: any) {
    console.error("[simplifyMedicalText] Error:", error?.message);
    throw error;
  }
}

export interface PdfNewsResult {
  headline: string;
  summary: string;
  keyStats: string[];
  advice: string;
  fullDraft: string;
}

export async function extractNewsFromPdf(pdfText: string): Promise<PdfNewsResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت محرر صحفي متخصص في تحويل الدراسات الطبية العلمية إلى أخبار صحية سهلة القراءة.
مهمتك: قراءة نص الدراسة الطبية وتحويله إلى خبر صحفي عربي جاهز للنشر.

أرجع نتيجتك بصيغة JSON فقط:
{
  "headline": "عنوان إخباري جذاب وواضح (8-12 كلمة)",
  "summary": "ملخص من فقرة واحدة يوضح النتائج الرئيسية (100-150 كلمة)",
  "keyStats": ["إحصاء أو رقم رئيسي 1", "إحصاء أو رقم رئيسي 2", "..."],
  "advice": "النصيحة العملية أو التوصية للقارئ بناءً على نتائج الدراسة (2-3 جمل)",
  "fullDraft": "مسودة الخبر الكاملة جاهزة للنشر بأسلوب صحفي احترافي بالعربية (4-6 فقرات)"
}

تذكر:
- اكتب بأسلوب صحفي عربي احترافي
- استخدم لغة مبسطة يفهمها القارئ العام
- اذكر أبرز الأرقام والإحصاءات من الدراسة
- أضف سياقاً يساعد القارئ على فهم أهمية النتائج`,
        },
        {
          role: "user",
          content: `حوّل هذه الدراسة الطبية إلى خبر صحفي:\n\n${pdfText.substring(0, 8000)}`,
        },
      ],
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      headline: parsed.headline || "",
      summary: parsed.summary || "",
      keyStats: parsed.keyStats || [],
      advice: parsed.advice || "",
      fullDraft: parsed.fullDraft || "",
    };
  } catch (error: any) {
    console.error("[extractNewsFromPdf] Error:", error?.message);
    throw error;
  }
}

// =====================================================
// Rumor Debunker (اسأل كبسولة)
// =====================================================

export interface RumorDebunkResult {
  verdict: "خرافة" | "صحيح جزئياً" | "صحيح";
  explanation: string;
  shortSummary: string;
  sources: Array<{ title: string; url: string }>;
}

async function searchMedicalSources(rumorText: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngineId) return [];

  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // Trusted medical domains to prioritise
  const trustedDomains = ['who.int', 'mayoclinic.org', 'webmd.com', 'pubmed.ncbi.nlm.nih.gov',
    'healthline.com', 'medlineplus.gov', 'ncbi.nlm.nih.gov', 'nhs.uk', 'harvard.edu',
    'clevelandclinic.org', 'nih.gov', 'cdc.gov'];

  try {
    // Two parallel searches: Arabic + English to maximise coverage
    const arabicQuery = encodeURIComponent(rumorText.substring(0, 100));
    // Strip Arabic to get a concise English search query (first ~60 chars of rumour, let AI rephrase later)
    const englishQuery = encodeURIComponent(rumorText.substring(0, 60) + ' medical fact');

    const [arRes, enRes] = await Promise.allSettled([
      fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${arabicQuery}&num=5&lr=lang_ar`),
      fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${englishQuery}&num=5`),
    ]);

    const processItems = (items: any[]) => {
      for (const item of items || []) {
        const domain = (() => { try { return new URL(item.link).hostname.replace(/^www\./, ''); } catch { return ''; } })();
        const isTrusted = trustedDomains.some(d => domain.endsWith(d));
        // Accept trusted sites immediately; accept others only if under 10 results so far
        if (isTrusted || results.length < 3) {
          if (!results.find(r => r.url === item.link)) {
            results.push({ title: item.title, url: item.link, snippet: item.snippet || '' });
          }
        }
        if (results.length >= 4) break;
      }
    };

    if (arRes.status === 'fulfilled' && arRes.value.ok) {
      const data = await arRes.value.json();
      processItems(data.items || []);
    }
    if (enRes.status === 'fulfilled' && enRes.value.ok) {
      const data = await enRes.value.json();
      processItems(data.items || []);
    }
  } catch (err) {
    console.error('[searchMedicalSources] Error:', err);
  }

  return results.slice(0, 4);
}

export async function debunkMedicalRumor(rumorText: string): Promise<RumorDebunkResult> {
  // Step 1: Fetch real, verifiable sources from Google before calling AI
  const realSources = await searchMedicalSources(rumorText);
  const sourcesContext = realSources.length > 0
    ? `\n\nمصادر حقيقية وجدناها على الإنترنت مرتبطة بهذا الموضوع — استخدمها كمراجع إذا كانت ذات صلة:\n${realSources.map((s, i) => `[${i + 1}] ${s.title}\n    الرابط: ${s.url}\n    الملخص: ${s.snippet}`).join('\n')}`
    : '';

  const systemPrompt = `أنت خبير طبي وعلمي متخصص في تفنيد الشائعات الطبية بدقة وحزم. مهمتك تحليل الشائعات الطبية المنتشرة على الإنترنت وتقديم ردود علمية موثوقة باللغة العربية.

قواعد مهمة جداً:
1. كن حازماً وعلمياً في حكمك
2. الرد يجب أن يكون باللغة العربية الفصحى الواضحة
3. لا تتردد في الحكم القاطع عند وجود أدلة علمية كافية
4. للمصادر: استخدم فقط الروابط المقدَّمة لك أدناه — لا تخترع أي رابط من عندك
5. إذا كانت المصادر المقدَّمة غير ذات صلة بالموضوع، أعِد حقل sources كمصفوفة فارغة []

أرجع النتيجة بصيغة JSON فقط:
{
  "verdict": "خرافة" | "صحيح جزئياً" | "صحيح",
  "explanation": "شرح علمي مفصل يوضح الحقيقة العلمية، الأسباب، والمخاطر إن وجدت (200-400 كلمة)",
  "shortSummary": "جملة واحدة موجزة تلخص الحكم للعنوان",
  "sources": [
    {"title": "العنوان كما هو مُقدَّم", "url": "الرابط كما هو مُقدَّم بدون تعديل"}
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `الشائعة الطبية:\n${rumorText}${sourcesContext}` }
      ] as any,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    // Validate that returned URLs actually came from our real sources (prevent hallucination)
    const allowedUrls = new Set(realSources.map(s => s.url));
    const validatedSources = (parsed.sources || []).filter((s: any) =>
      s?.url && s?.title && (allowedUrls.has(s.url) || allowedUrls.size === 0)
    );

    return {
      verdict: parsed.verdict || "صحيح جزئياً",
      explanation: parsed.explanation || "تعذر تحليل الشائعة.",
      shortSummary: parsed.shortSummary || parsed.explanation?.substring(0, 100) || "",
      sources: validatedSources,
    };
  } catch (error) {
    console.error("[debunkMedicalRumor] Error:", error);
    return {
      verdict: "صحيح جزئياً",
      explanation: "عذراً، تعذر تحليل هذه الشائعة حالياً. يرجى المحاولة مرة أخرى.",
      shortSummary: "تعذر التحليل",
      sources: [],
    };
  }
}

// WhatsApp Newsletter Generation
// =====================================================

export interface NewsletterContent {
  title: string;
  points: string[];
  readMoreUrl?: string;
}

/**
 * Generate a WhatsApp-formatted morning newsletter from recent news items.
 * Takes top news headlines + summaries and produces a short, readable Arabic summary.
 */
export async function generateWhatsAppNewsletter(
  newsItems: Array<{ title: string; summary?: string; category?: string }>,
  interests: string[] = []
): Promise<NewsletterContent> {
  const interestLabels: Record<string, string> = {
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

  const interestText = interests.length > 0
    ? `الاهتمامات المحددة: ${interests.map(i => interestLabels[i] || i).join("، ")}`
    : "جميع المواضيع الصحية";

  const newsText = newsItems
    .slice(0, 10)
    .map((n, i) => `${i + 1}. ${n.title}${n.summary ? ` — ${n.summary.substring(0, 120)}` : ""}`)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت محرر متخصص في كتابة نشرات واتساب الصحية. مهمتك:
1. اختيار أبرز وأهم الأخبار الصحية من القائمة المعطاة
2. كتابة عنوان رئيسي جذاب وموجز (10 كلمات كحد أقصى)
3. توليد 3-5 نقاط صحية مختصرة ومفيدة بالعربية
4. كل نقطة لا تتجاوز 100 حرف
5. اللغة سهلة وواضحة مناسبة لعموم القراء
6. مراعاة الاهتمامات المحددة عند وجودها

أرجع النتيجة بصيغة JSON:
{
  "title": "عنوان رئيسي جذاب",
  "points": ["نقطة 1", "نقطة 2", "نقطة 3", "نقطة 4"]
}`,
        },
        {
          role: "user",
          content: `${interestText}\n\nأبرز أخبار اليوم:\n${newsText}`,
        },
      ],
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      title: parsed.title || "كبسولة الصباح الصحية",
      points: Array.isArray(parsed.points) ? parsed.points : [],
    };
  } catch (error: any) {
    console.error("[generateWhatsAppNewsletter] Error:", error.message);
    return {
      title: "أبرز الأخبار الصحية اليوم",
      points: newsItems.slice(0, 4).map((n) => n.title),
    };
  }
}

// =====================================================
// Social Content Generation for Articles
// =====================================================

export interface SocialContentResult {
  xThread: string[];
  reelsScript: Array<{ scene: number; duration: string; dialogue: string }>;
  instagramPoints: { points: string[]; hashtags: string[] };
}

export async function generateSocialContent(
  articleTitle: string,
  articleContent: string
): Promise<SocialContentResult> {
  const truncatedContent = articleContent.substring(0, 3000);

  const [xResult, reelsResult, igResult] = await Promise.all([
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت خبير سوشيال ميديا عربي متخصص في المحتوى الصحي. مهمتك توليد ثريد X (تويتر) احترافي بالعربية من مقال طبي.

قواعد الثريد:
- كل تغريدة يجب ألا تتجاوز 280 حرفاً (عدّ الحروف بدقة)
- الثريد يبدأ بتغريدة جذابة تثير الفضول
- كل تغريدة تحمل فكرة واحدة واضحة
- استخدم الأرقام (1/ 2/ 3/) لترقيم الثريد
- الأسلوب: إعلامي، مختصر، مفيد
- عدد التغريدات: 6-8 تغريدات
- لا تضع hashtags في كل تغريدة، فقط في الأخيرة

أرجع النتيجة بصيغة JSON:
{"tweets": ["نص التغريدة الأولى", "نص الثانية", ...]}`
        },
        {
          role: "user",
          content: `المقال: ${articleTitle}\n\n${truncatedContent}`
        }
      ],
      max_completion_tokens: 2048,
      response_format: { type: "json_object" },
    }),

    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت كاتب سكريبت محترف للريلز والتيك توك بالعربية. مهمتك تحويل مقال طبي إلى سكريبت فيديو قصير 30-60 ثانية.

قواعد السكريبت:
- مقسّم إلى 5-7 مشاهد قصيرة
- كل مشهد له وقت محدد (ثواني)
- الحوار طبيعي وعفوي بالعربية
- الأسلوب: تثقيفي وجذاب ومناسب لجمهور السوشيال ميديا
- الافتتاح قوي يجذب الانتباه في أول 3 ثوانٍ
- الخاتمة تدعو للمتابعة أو التفاعل

أرجع النتيجة بصيغة JSON:
{"scenes": [{"scene": 1, "duration": "0-5 ثوانٍ", "dialogue": "نص الحوار"}, ...]}`
        },
        {
          role: "user",
          content: `المقال: ${articleTitle}\n\n${truncatedContent}`
        }
      ],
      max_completion_tokens: 2048,
      response_format: { type: "json_object" },
    }),

    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت خبير محتوى إنستغرام عربي متخصص في الصحة. مهمتك استخلاص نقاط إنفوغرافيك من مقال طبي.

قواعد النقاط:
- 5-7 نقاط مختصرة وجذابة
- كل نقطة تبدأ بإيموجي مناسب
- الأسلوب: مرئي وبصري وسهل القراءة
- الجمل قصيرة ومباشرة (15-25 كلمة لكل نقطة)
- اقترح 8-10 هاشتاقات طبية عربية وإنجليزية مناسبة

أرجع النتيجة بصيغة JSON:
{"points": ["نقطة 1", "نقطة 2", ...], "hashtags": ["#الصحة", "#health", ...]}`
        },
        {
          role: "user",
          content: `المقال: ${articleTitle}\n\n${truncatedContent}`
        }
      ],
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  ]);

  const xData = JSON.parse(xResult.choices[0]?.message?.content || "{}");
  const reelsData = JSON.parse(reelsResult.choices[0]?.message?.content || "{}");
  const igData = JSON.parse(igResult.choices[0]?.message?.content || "{}");

  return {
    xThread: xData.tweets || [],
    reelsScript: reelsData.scenes || [],
    instagramPoints: {
      points: igData.points || [],
      hashtags: igData.hashtags || [],
    },
  };
}

// Generate drug information in Arabic using AI
export async function generateDrugInfo(drugName: string): Promise<{
  nameAr: string;
  nameEn: string;
  genericName: string;
  category: string;
  description: string;
  uses: string[];
  sideEffects: string[];
  contraindications: string[];
  dosage: string;
  warnings: string[];
  interactions: string[];
  pregnancy: string;
  storage: string;
} | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `أنت صيدلاني خبير. مهمتك تقديم معلومات دقيقة وشاملة عن الأدوية باللغة العربية.
قدّم المعلومات بصيغة JSON فقط دون أي نص إضافي.`,
        },
        {
          role: "user",
          content: `قدّم معلومات شاملة عن الدواء: "${drugName}"
أجب بـ JSON فقط بهذا الهيكل بالضبط:
{
  "nameAr": "الاسم التجاري بالعربية",
  "nameEn": "الاسم التجاري بالإنجليزية",
  "genericName": "المادة الفعّالة",
  "category": "تصنيف الدواء (مضاد حيوي / مسكن / إلخ)",
  "description": "وصف موجز للدواء في جملتين",
  "uses": ["استخدام 1", "استخدام 2", "استخدام 3"],
  "sideEffects": ["عرَض جانبي 1", "عرَض جانبي 2", "عرَض جانبي 3"],
  "contraindications": ["موانع استخدام 1", "موانع استخدام 2"],
  "dosage": "الجرعة المعتادة للبالغين",
  "warnings": ["تحذير 1", "تحذير 2"],
  "interactions": ["تفاعل مع دواء 1", "تفاعل مع دواء 2"],
  "pregnancy": "معلومات الاستخدام أثناء الحمل والرضاعة",
  "storage": "طريقة التخزين الصحيحة"
}
إذا لم يكن الدواء معروفاً أو لم تجد معلومات كافية أجب بـ: null`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (!parsed || !parsed.nameAr) return null;
    return parsed;
  } catch (e) {
    console.error("generateDrugInfo error:", e);
    return null;
  }
}

export default openai;
