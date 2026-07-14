import Foundation

// النماذج مطابقة لاستجابات capsulah.com الفعلية (فُحصت في 2026-07-14)

struct NewsItem: Identifiable, Hashable, Sendable {
    let id: String
    let shortCode: String?
    let title: String
    let subtitle: String?
    let summary: String?
    let content: String?       // HTML — تصل كاملة من نقطة التفاصيل
    let category: String?      // slug مثل health-news
    let imageUrl: String?
    let imageAlt: String?
    let keywords: [String]
    let isFeatured: Bool
    let isBreaking: Bool
    let publishedAt: Date?
    let createdBy: String?

    /// رابط الخبر على الموقع (للمشاركة)
    var webURL: URL? {
        guard let shortCode else { return nil }
        return URL(string: "https://capsulah.com/n/\(shortCode)")
    }

    /// تقدير زمن القراءة من نص المحتوى
    var readingMinutes: Int {
        let text = (content ?? summary ?? "").replacingOccurrences(of: "<[^>]+>", with: " ", options: .regularExpression)
        let words = text.split(whereSeparator: \.isWhitespace).count
        return max(1, Int((Double(words) / 220.0).rounded(.up)))
    }
}

extension NewsItem: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, shortCode, title, subtitle, summary, content, category
        case imageUrl, imageAlt, keywords, isFeatured, isBreaking, publishedAt, createdBy
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        shortCode = try c.decodeIfPresent(String.self, forKey: .shortCode)
        title = try c.decode(String.self, forKey: .title)
        subtitle = try c.decodeIfPresent(String.self, forKey: .subtitle)
        summary = try c.decodeIfPresent(String.self, forKey: .summary)
        content = try c.decodeIfPresent(String.self, forKey: .content)
        category = try c.decodeIfPresent(String.self, forKey: .category)
        imageUrl = try c.decodeIfPresent(String.self, forKey: .imageUrl)
        imageAlt = try c.decodeIfPresent(String.self, forKey: .imageAlt)
        keywords = try c.decodeIfPresent([String].self, forKey: .keywords) ?? []
        isFeatured = try c.decodeIfPresent(Bool.self, forKey: .isFeatured) ?? false
        isBreaking = try c.decodeIfPresent(Bool.self, forKey: .isBreaking) ?? false
        publishedAt = try c.decodeIfPresent(Date.self, forKey: .publishedAt)
        createdBy = try c.decodeIfPresent(String.self, forKey: .createdBy)
    }
}

struct NewsCategory: Identifiable, Hashable, Sendable, Decodable {
    let id: String
    let slug: String
    let nameAr: String
    let sortOrder: Int?
    let isActive: Bool?
}

// MARK: - عينات للمعاينة وحالة انقطاع الشبكة

extension NewsItem {
    static func sample(
        title: String,
        subtitle: String? = nil,
        category: String? = "health-news",
        featured: Bool = false,
        breaking: Bool = false,
        minutesAgo: Int = 20
    ) -> NewsItem {
        NewsItem(
            id: UUID().uuidString,
            shortCode: nil,
            title: title,
            subtitle: subtitle,
            summary: subtitle,
            content: nil,
            category: category,
            imageUrl: nil,
            imageAlt: nil,
            keywords: [],
            isFeatured: featured,
            isBreaking: breaking,
            publishedAt: Date().addingTimeInterval(TimeInterval(-minutesAgo * 60)),
            createdBy: "كبسولة"
        )
    }

    static let samples: [NewsItem] = [
        .sample(
            title: "دراسة سعودية: النوم أقل من ست ساعات يرفع خطر السمنة لدى المراهقين بنسبة الثلث",
            subtitle: "باحثون يوصون بجدول نوم ثابت خلال الإجازة الصيفية",
            featured: true
        ),
        .sample(
            title: "«الغذاء والدواء» تسحب تشغيلة من دواء خافض للضغط",
            category: "saudi-health",
            breaking: true,
            minutesAgo: 8
        ),
        .sample(
            title: "«الغذاء والدواء» توضّح الفرق بين الدواء المكافئ والدواء الأصلي",
            category: "saudi-health",
            minutesAgo: 60
        ),
        .sample(
            title: "تبنَّوا خمس عادات مسائية لصحة القلب وضبط الكوليسترول",
            category: "health-reports",
            minutesAgo: 180
        ),
        .sample(
            title: "كيف تفرق بين ألم القلب والألم العصبي في الصدر؟",
            category: "health-news",
            minutesAgo: 240
        ),
    ]
}

extension NewsCategory {
    static let samples: [NewsCategory] = [
        NewsCategory(id: "1", slug: "health-news", nameAr: "أخبار الصحة", sortOrder: 1, isActive: true),
        NewsCategory(id: "2", slug: "saudi-health", nameAr: "الصحة في السعودية", sortOrder: 2, isActive: true),
        NewsCategory(id: "3", slug: "health-community", nameAr: "مجتمع صحي", sortOrder: 3, isActive: true),
        NewsCategory(id: "4", slug: "health-reports", nameAr: "تقارير صحية", sortOrder: 4, isActive: true),
    ]
}
