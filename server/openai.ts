// Blueprint: javascript_openai_ai_integrations
import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

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
    // gpt-5 has issues with structured output on Replit AI Integrations
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

export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const startTime = Date.now();
  
  try {
    const geminiApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const geminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

    if (!geminiApiKey || !geminiBaseUrl) {
      return {
        success: false,
        error: "تكامل Gemini غير مهيأ",
        generationTimeMs: Date.now() - startTime,
      };
    }

    const { GoogleGenAI, Modality } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        apiVersion: "",
        baseUrl: geminiBaseUrl,
      },
    });

    const illustrativeStyle = `Style: flat vector illustration, clean lines, soft pastel colors, modern infographic design, NO text/words/letters in image, landscape 16:9 composition.`;

    const fullPrompt = `${options.prompt}\n\n${illustrativeStyle}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ 
        role: "user", 
        parts: [{ text: fullPrompt }] 
      }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const generationTimeMs = Date.now() - startTime;
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      return {
        success: false,
        error: "لم يتم توليد صورة، حاول مرة أخرى",
        generationTimeMs,
      };
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
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

    return {
      success: true,
      imageBuffer,
      imageMimeType: 'image/png',
      revisedPrompt: options.prompt,
      generationTimeMs,
    };
  } catch (error: any) {
    console.error("Image generation error:", error);
    return {
      success: false,
      error: error.message || "فشل في توليد الصورة",
      generationTimeMs: Date.now() - startTime,
    };
  }
}

export async function generatePromptFromContent(
  title: string,
  content: string,
  generationType: "realistic" | "artistic" | "hybrid" = "artistic"
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating image generation prompts that ACCURATELY represent the specific topic of a news article.

Your PRIMARY goal: The generated image MUST clearly represent the EXACT subject of the article. A viewer should be able to guess what the article is about just by looking at the image.

Steps:
1. First, identify the MAIN SUBJECT of the article (e.g., diabetes medication, children vaccination, heart surgery, hospital opening, food safety study, etc.)
2. Then describe a scene that DIRECTLY illustrates that specific subject
3. Add style details last

Rules:
- Write the prompt in English ONLY
- The image MUST be about the specific topic, NOT a generic health image
- If the article is about diabetes → show insulin, blood glucose monitor, pancreas
- If about a new hospital → show a modern hospital building
- If about nutrition/diet → show the specific foods mentioned
- If about a specific disease → show relevant organs, symptoms visualization, treatment
- If about a medical study → show the specific subject being studied
- If about exercise → show people doing that specific exercise
- Do NOT use real names of people or trademarks
- NO text, words, letters, or writing should appear in the image
- Describe 2-3 specific visual elements that are UNIQUE to this article's topic
- Style: flat vector illustration, clean design, soft pastel colors, modern infographic style

Return ONLY the prompt text, nothing else.`
        },
        {
          role: "user",
          content: `Article title: ${title}\n\nArticle content:\n${content.substring(0, 1500)}`
        }
      ],
      max_completion_tokens: 500,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() || 
      "Flat vector illustration of healthcare concept with medical icons, stethoscope, heart symbol, clean geometric shapes, soft pastel gradient background, modern infographic style";
  } catch (error) {
    console.error("Error generating prompt:", error);
    return "Flat vector illustration of healthcare concept with medical icons, stethoscope, heart symbol, clean geometric shapes, soft pastel gradient background, modern infographic style";
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
    // Try with JSON response format first (more reliable)
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 4096,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    console.log("OpenAI translation response received, length:", content?.length || 0);
    
    if (content) {
      try {
        const parsed = JSON.parse(content);
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
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        // Try extracting JSON from content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
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
      model: "openai/gpt-4o-mini",
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

export default openai;
