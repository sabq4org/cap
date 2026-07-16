import Foundation

// عميل API عام (قراءة فقط) لواجهات capsulah.com المفتوحة

enum CapAPIError: Error {
    case badStatus(Int)
    case server(String)   // رسالة عربية جاهزة للعرض من الخادم
}

enum CapAPI {
    static let base = URL(string: "https://capsulah.com")!

    static func fetchNews(limit: Int = 20, category: String? = nil) async throws -> [NewsItem] {
        var query = [URLQueryItem(name: "limit", value: String(limit))]
        if let category {
            query.append(URLQueryItem(name: "category", value: category))
        }
        return try await get("/api/news", query: query)
    }

    static func fetchTrending(limit: Int = 6) async throws -> [NewsItem] {
        try await get("/api/news/trending", query: [URLQueryItem(name: "limit", value: String(limit))])
    }

    static func fetchCategories() async throws -> [NewsCategory] {
        try await get("/api/categories")
    }

    static func fetchNewsDetail(id: String) async throws -> NewsItem {
        try await get("/api/news/\(id)")
    }

    static func fetchRelated(id: String, limit: Int = 4) async throws -> [NewsItem] {
        try await get("/api/news/\(id)/related", query: [URLQueryItem(name: "limit", value: String(limit))])
    }

    /// تسجيل مشاهدة — fire and forget
    static func trackView(id: String) {
        Task.detached(priority: .background) {
            var request = URLRequest(url: base.appending(path: "/api/news/\(id)/view"))
            request.httpMethod = "POST"
            request.timeoutInterval = 10
            _ = try? await URLSession.shared.data(for: request)
        }
    }

    /// imageUrl يصل نسبياً مثل ‎/objects/uploads/…‎ — نكمله بأصل الموقع
    static func imageURL(_ path: String?) -> URL? {
        guard let path, !path.isEmpty else { return nil }
        if path.hasPrefix("http") { return URL(string: path) }
        return URL(string: path, relativeTo: base)?.absoluteURL
    }

    // MARK: - Internals

    static func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        var components = URLComponents(url: base.appending(path: path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }

        var request = URLRequest(url: components.url!)
        request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw CapAPIError.badStatus(http.statusCode)
        }
        return try decoder.decode(T.self, from: data)
    }

    static var decoder: JSONDecoder { makeDecoder() }

    private static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let raw = try decoder.singleValueContainer().decode(String.self)
            let fractional = Date.ISO8601FormatStyle(includingFractionalSeconds: true)
            if let date = try? Date(raw, strategy: fractional) { return date }
            if let date = try? Date(raw, strategy: .iso8601) { return date }
            throw DecodingError.dataCorrupted(.init(
                codingPath: decoder.codingPath,
                debugDescription: "تنسيق تاريخ غير معروف: \(raw)"
            ))
        }
        return decoder
    }
}
