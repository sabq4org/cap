import Foundation

// نماذج المرحلة الثانية — مطابقة لاستجابات capsulah.com الفعلية

// MARK: - أرشيف الأخبار المقسّم صفحات

struct PaginatedNews: Decodable, Sendable {
    let news: [NewsItem]
    let total: Int
    let page: Int
    let totalPages: Int
}

// MARK: - المقالات (المحتوى الدائم)

struct Article: Identifiable, Hashable, Sendable {
    let id: String
    let slug: String
    let title: String
    let excerpt: String
    let content: String?
    let category: String
    let tags: [String]
    let readTime: Int
    let reviewedBy: String?
    let author: String?
    let imageUrl: String?
    let imageAlt: String?
    let keywords: [String]
    let sources: [ArticleSource]
    let publishedAt: Date?

    var webURL: URL? { URL(string: "https://capsulah.com/articles/\(slug)") }
}

struct ArticleSource: Hashable, Sendable, Decodable {
    let title: String
    let url: String
}

extension Article: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, slug, title, excerpt, content, category, tags, readTime
        case reviewedBy, author, imageUrl, imageAlt, keywords, sources, publishedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        slug = try c.decode(String.self, forKey: .slug)
        title = try c.decode(String.self, forKey: .title)
        excerpt = try c.decodeIfPresent(String.self, forKey: .excerpt) ?? ""
        content = try c.decodeIfPresent(String.self, forKey: .content)
        category = try c.decodeIfPresent(String.self, forKey: .category) ?? ""
        tags = try c.decodeIfPresent([String].self, forKey: .tags) ?? []
        readTime = try c.decodeIfPresent(Int.self, forKey: .readTime) ?? 3
        reviewedBy = try c.decodeIfPresent(String.self, forKey: .reviewedBy)
        author = try c.decodeIfPresent(String.self, forKey: .author)
        imageUrl = try c.decodeIfPresent(String.self, forKey: .imageUrl)
        imageAlt = try c.decodeIfPresent(String.self, forKey: .imageAlt)
        keywords = try c.decodeIfPresent([String].self, forKey: .keywords) ?? []
        sources = try c.decodeIfPresent([ArticleSource].self, forKey: .sources) ?? []
        publishedAt = try c.decodeIfPresent(Date.self, forKey: .publishedAt)
    }
}

// MARK: - اسأل كبسولة (الشائعات)

struct RumorSubmissionReceipt: Decodable, Sendable {
    let id: String
    let message: String?
}

struct RumorVerdictResponse: Hashable, Sendable, Decodable {
    let verdict: String        // خرافة | صحيح جزئياً | صحيح
    let explanation: String
    let shortSummary: String?
    let sources: [ArticleSource]?
}

struct RumorSubmission: Identifiable, Hashable, Sendable {
    let id: String
    let rumorText: String
    let sourcePlatform: String?
    let sourceUrl: String?
    let status: String         // pending | ai_responded | published | rejected
    let aiResponse: RumorVerdictResponse?
    let viewCount: Int
    let createdAt: Date?

    var hasVerdict: Bool { aiResponse != nil }
}

extension RumorSubmission: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, rumorText, sourcePlatform, sourceUrl, status, aiResponse, viewCount, createdAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        rumorText = try c.decode(String.self, forKey: .rumorText)
        sourcePlatform = try c.decodeIfPresent(String.self, forKey: .sourcePlatform)
        sourceUrl = try c.decodeIfPresent(String.self, forKey: .sourceUrl)
        status = try c.decodeIfPresent(String.self, forKey: .status) ?? "pending"
        aiResponse = try c.decodeIfPresent(RumorVerdictResponse.self, forKey: .aiResponse)
        viewCount = try c.decodeIfPresent(Int.self, forKey: .viewCount) ?? 0
        createdAt = try c.decodeIfPresent(Date.self, forKey: .createdAt)
    }
}

/// منصات مصدر الشائعة كما يعرفها الخادم
enum RumorPlatform: String, CaseIterable, Identifiable {
    case whatsapp, tiktok, twitter, facebook, other

    var id: String { rawValue }

    var titleAr: String {
        switch self {
        case .whatsapp: "واتساب"
        case .tiktok: "تيك توك"
        case .twitter: "إكس"
        case .facebook: "فيسبوك"
        case .other: "مصدر آخر"
        }
    }
}

// MARK: - دليل الأدوية

struct Drug: Identifiable, Hashable, Sendable {
    let id: String
    let nameAr: String
    let nameEn: String?
    let genericName: String?
    let category: String?
    let description: String?
    let uses: [String]
    let sideEffects: [String]
    let contraindications: [String]
    let dosage: String?
    let warnings: [String]
    let interactions: [String]
    let pregnancy: String?
    let storage: String?
    let aiGenerated: Bool
    let viewCount: Int
}

extension Drug: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, nameAr, nameEn, genericName, category, description
        case uses, sideEffects, contraindications, dosage, warnings
        case interactions, pregnancy, storage, aiGenerated, viewCount
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        nameAr = try c.decode(String.self, forKey: .nameAr)
        nameEn = try c.decodeIfPresent(String.self, forKey: .nameEn)
        genericName = try c.decodeIfPresent(String.self, forKey: .genericName)
        category = try c.decodeIfPresent(String.self, forKey: .category)
        description = try c.decodeIfPresent(String.self, forKey: .description)
        uses = try c.decodeIfPresent([String].self, forKey: .uses) ?? []
        sideEffects = try c.decodeIfPresent([String].self, forKey: .sideEffects) ?? []
        contraindications = try c.decodeIfPresent([String].self, forKey: .contraindications) ?? []
        dosage = try c.decodeIfPresent(String.self, forKey: .dosage)
        warnings = try c.decodeIfPresent([String].self, forKey: .warnings) ?? []
        interactions = try c.decodeIfPresent([String].self, forKey: .interactions) ?? []
        pregnancy = try c.decodeIfPresent(String.self, forKey: .pregnancy)
        storage = try c.decodeIfPresent(String.self, forKey: .storage)
        aiGenerated = try c.decodeIfPresent(Bool.self, forKey: .aiGenerated) ?? false
        viewCount = try c.decodeIfPresent(Int.self, forKey: .viewCount) ?? 0
    }
}

// MARK: - البودكاست

struct PodcastEpisode: Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let scriptText: String?
    let audioUrl: String?
    let episodeDate: String    // YYYY-MM-DD
    let status: String         // pending | generating | ready | failed
    let durationSeconds: Int?
    let newsCount: Int

    var isPlayable: Bool { status == "ready" && audioUrl != nil }

    var audioURL: URL? { CapAPI.imageURL(audioUrl) }

    var durationLine: String? {
        guard let durationSeconds, durationSeconds > 0 else { return nil }
        let minutes = max(1, durationSeconds / 60)
        return "\(ArabicText.digits(minutes)) \(minutes <= 2 ? "دقيقة" : minutes <= 10 ? "دقائق" : "دقيقة")"
    }

    /// "الأحد ١٢ يوليو" من episodeDate
    var dateLine: String {
        let parser = DateFormatter()
        parser.dateFormat = "yyyy-MM-dd"
        parser.timeZone = SaudiTime.timeZone
        guard let date = parser.date(from: episodeDate) else { return episodeDate }
        let formatter = DateFormatter()
        formatter.calendar = SaudiTime.calendar
        formatter.timeZone = SaudiTime.timeZone
        formatter.locale = Locale(identifier: "ar_SA")
        formatter.dateFormat = "EEEE d MMMM"
        return formatter.string(from: date)
    }
}

extension PodcastEpisode: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, title, scriptText, audioUrl, episodeDate, status, durationSeconds, newsCount
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        scriptText = try c.decodeIfPresent(String.self, forKey: .scriptText)
        audioUrl = try c.decodeIfPresent(String.self, forKey: .audioUrl)
        episodeDate = try c.decodeIfPresent(String.self, forKey: .episodeDate) ?? ""
        status = try c.decodeIfPresent(String.self, forKey: .status) ?? "pending"
        durationSeconds = try c.decodeIfPresent(Int.self, forKey: .durationSeconds)
        newsCount = try c.decodeIfPresent(Int.self, forKey: .newsCount) ?? 0
    }
}

// MARK: - الحساب

/// استجابة تسجيل الدخول/التسجيل المختصرة
struct AuthUser: Decodable, Sendable {
    let id: String
    let email: String?
    let firstName: String?
    let lastName: String?
}

/// الملف الكامل من \u200E/api/auth/user\u200E
struct UserProfile: Identifiable, Sendable {
    let id: String
    let email: String?
    let firstName: String?
    let lastName: String?
    let profileImageUrl: String?
    let role: String?

    var displayName: String {
        let name = [firstName, lastName].compactMap { $0 }.joined(separator: " ")
        return name.isEmpty ? (email ?? "مستخدم كبسولة") : name
    }

    var initial: String { String(displayName.prefix(1)) }
}

extension UserProfile: Decodable {
    enum CodingKeys: String, CodingKey {
        case id, email, firstName, lastName, profileImageUrl, role
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        email = try c.decodeIfPresent(String.self, forKey: .email)
        firstName = try c.decodeIfPresent(String.self, forKey: .firstName)
        lastName = try c.decodeIfPresent(String.self, forKey: .lastName)
        profileImageUrl = try c.decodeIfPresent(String.self, forKey: .profileImageUrl)
        role = try c.decodeIfPresent(String.self, forKey: .role)
    }
}

// MARK: - الكبسولة المخصصة

struct CapsuleFeed: Decodable, Sendable {
    let items: [CapsuleFeedItem]
    let total: Int
    let page: Int
    let totalPages: Int
}

enum CapsuleFeedItem: Identifiable, Hashable, Sendable {
    case news(NewsItem)
    case article(Article)

    var id: String {
        switch self {
        case .news(let item): "news-\(item.id)"
        case .article(let item): "article-\(item.id)"
        }
    }
}

extension CapsuleFeedItem: Decodable {
    enum CodingKeys: String, CodingKey { case type, item }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let type = try c.decode(String.self, forKey: .type)
        switch type {
        case "article":
            self = .article(try c.decode(Article.self, forKey: .item))
        default:
            self = .news(try c.decode(NewsItem.self, forKey: .item))
        }
    }
}
