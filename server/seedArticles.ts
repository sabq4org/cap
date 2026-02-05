import { storage } from "./storage";
import type { InsertArticle } from "@shared/schema";

const articles: InsertArticle[] = [
  {
    slug: "healthy-eating-habits",
    title: "عادات الأكل الصحية: دليل شامل لحياة أفضل",
    excerpt: "تعرف على أهم العادات الغذائية الصحية التي يمكن أن تحسن حياتك وتحميك من الأمراض المزمنة.",
    content: `# عادات الأكل الصحية

تناول الطعام الصحي ليس مجرد حمية مؤقتة، بل أسلوب حياة يجب أن نتبعه للحصول على صحة أفضل وحياة أطول.

## أهم العادات الصحية

### 1. تناول الخضروات والفواكه
يجب تناول ما لا يقل عن 5 حصص من الخضروات والفواكه يومياً.

### 2. شرب الماء الكافي
احرص على شرب 8 أكواب من الماء يومياً على الأقل.

### 3. تقليل السكريات المضافة
السكريات المضافة ترتبط بالعديد من الأمراض المزمنة.

## نصائح عملية
- تناول الإفطار دائماً
- اجعل نصف طبقك من الخضروات
- قلل من الملح والسكر
- تناول البروتين في كل وجبة`,
    category: "التغذية",
    tags: ["تغذية", "صحة", "وقاية"],
    readTime: 5,
    reviewedBy: "د. أحمد محمود",
    medicalReviewDate: new Date("2024-01-15"),
    sources: [
      { title: "منظمة الصحة العالمية", url: "https://www.who.int" },
      { title: "جمعية القلب الأمريكية", url: "https://www.heart.org" }
    ],
    status: "published",
    publishedAt: new Date()
  },
  {
    slug: "exercise-benefits",
    title: "فوائد الرياضة على الصحة الجسدية والنفسية",
    excerpt: "ممارسة الرياضة المنتظمة لها فوائد عديدة على الصحة الجسدية والنفسية. اكتشف كيف يمكن للرياضة أن تغير حياتك.",
    content: `# فوائد الرياضة

الرياضة المنتظمة هي مفتاح الصحة الجيدة والعمر المديد.

## الفوائد الجسدية
- تقوية العضلات والعظام
- تحسين صحة القلب
- التحكم بالوزن
- تقليل خطر الأمراض المزمنة

## الفوائد النفسية
- تحسين المزاج
- تقليل القلق والاكتئاب
- تحسين جودة النوم
- زيادة الثقة بالنفس`,
    category: "الرياضة",
    tags: ["رياضة", "لياقة", "صحة نفسية"],
    readTime: 6,
    reviewedBy: "د. سارة علي",
    medicalReviewDate: new Date("2024-02-01"),
    sources: [
      { title: "المعهد الوطني للصحة", url: "https://www.nih.gov" }
    ],
    status: "published",
    publishedAt: new Date()
  },
  {
    slug: "sleep-importance",
    title: "أهمية النوم الجيد للصحة العامة",
    excerpt: "النوم الجيد ضروري للصحة الجسدية والنفسية. تعرف على فوائد النوم الكافي وكيفية تحسين جودة نومك.",
    content: `# أهمية النوم

النوم الجيد أساس الصحة الجيدة والإنتاجية العالية.

## فوائد النوم الكافي
- تجديد الطاقة
- تقوية المناعة
- تحسين الذاكرة والتركيز
- دعم صحة القلب

## نصائح لنوم أفضل
- حافظ على روتين نوم منتظم
- تجنب الشاشات قبل النوم
- اجعل غرفة نومك مظلمة وهادئة
- تجنب الكافيين بعد الظهر`,
    category: "الصحة العامة",
    tags: ["نوم", "صحة", "نمط حياة"],
    readTime: 4,
    reviewedBy: "د. محمد حسن",
    medicalReviewDate: new Date("2024-02-10"),
    sources: [
      { title: "مؤسسة النوم الوطنية", url: "https://www.sleepfoundation.org" }
    ],
    status: "published",
    publishedAt: new Date()
  }
];

export async function seedArticles() {
  try {
    // Check if articles already exist
    const existingArticles = await storage.getArticles();
    if (existingArticles && existingArticles.length > 0) {
      console.log("✓ Articles already seeded, skipping");
      return;
    }
    
    for (const article of articles) {
      await storage.createArticle(article);
    }
    console.log("✓ Articles seeded successfully");
  } catch (error) {
    console.error("Error seeding articles:", error);
  }
}
