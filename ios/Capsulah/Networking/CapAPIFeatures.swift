import Foundation

// واجهات المرحلة الثانية: الأرشيف، الشائعات، الأدوية، البودكاست، المقالات، والحساب

extension CapAPIError {
    /// رسالة عربية قابلة للعرض من الخادم إن وجدت
    var displayMessage: String {
        switch self {
        case .badStatus: return "تعذر الاتصال بالخادم"
        case .server(let message): return message
        }
    }
}

extension CapAPI {
    // MARK: - الأخبار (أرشيف مقسّم صفحات + بحث)

    static func fetchNewsPage(
        page: Int,
        perPage: Int = 20,
        category: String? = nil,
        search: String? = nil
    ) async throws -> PaginatedNews {
        var query = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "perPage", value: String(perPage)),
        ]
        if let category { query.append(URLQueryItem(name: "category", value: category)) }
        if let search, !search.isEmpty { query.append(URLQueryItem(name: "search", value: search)) }
        return try await get("/api/news", query: query)
    }

    // MARK: - المقالات

    static func fetchArticles(limit: Int = 30) async throws -> [Article] {
        try await get("/api/articles", query: [URLQueryItem(name: "limit", value: String(limit))])
    }

    static func fetchArticle(slug: String) async throws -> Article {
        try await get("/api/articles/\(slug)")
    }

    // MARK: - اسأل كبسولة (الشائعات)

    static func submitRumor(text: String, platform: String, sourceUrl: String?) async throws -> RumorSubmissionReceipt {
        var body: [String: Any] = ["rumorText": text, "sourcePlatform": platform]
        if let sourceUrl, !sourceUrl.isEmpty { body["sourceUrl"] = sourceUrl }
        return try await post("/api/rumors", body: body)
    }

    static func fetchRumor(id: String) async throws -> RumorSubmission {
        try await get("/api/rumors/\(id)")
    }

    static func fetchPublishedRumors(limit: Int = 10) async throws -> [RumorSubmission] {
        try await get("/api/rumors/published", query: [URLQueryItem(name: "limit", value: String(limit))])
    }

    static func trackRumorView(id: String) {
        firePost(path: "/api/rumors/\(id)/view")
    }

    // MARK: - دليل الأدوية

    static func fetchDrugs(limit: Int = 20) async throws -> [Drug] {
        try await get("/api/drugs", query: [URLQueryItem(name: "limit", value: String(limit))])
    }

    static func searchDrugs(query: String) async throws -> [Drug] {
        try await get("/api/drugs/search", query: [URLQueryItem(name: "q", value: query)])
    }

    static func fetchDrug(id: String) async throws -> Drug {
        try await get("/api/drugs/\(id)")
    }

    /// توليد معلومات دواء غير موجود عبر الذكاء الاصطناعي (قد يستغرق ثواني)
    static func generateDrug(name: String) async throws -> Drug {
        try await post("/api/drugs/generate", body: ["name": name], timeout: 60)
    }

    // MARK: - البودكاست

    static func fetchPodcastEpisodes() async throws -> [PodcastEpisode] {
        try await get("/api/podcast/episodes")
    }

    // MARK: - الحساب والكبسولة المخصصة

    static func currentUser() async throws -> UserProfile {
        try await get("/api/auth/user")
    }

    static func login(email: String, password: String) async throws -> AuthUser {
        try await post("/api/auth/login", body: ["email": email, "password": password])
    }

    static func register(email: String, password: String, firstName: String, lastName: String?) async throws -> AuthUser {
        var body: [String: Any] = ["email": email, "password": password, "firstName": firstName]
        if let lastName, !lastName.isEmpty { body["lastName"] = lastName }
        return try await post("/api/auth/register", body: body)
    }

    static func logout() async throws {
        struct LogoutReply: Decodable { let success: Bool? }
        let _: LogoutReply = try await post("/api/auth/logout", body: [:])
    }

    static func fetchInterests() async throws -> [String] {
        struct Reply: Decodable { let interests: [String] }
        let reply: Reply = try await get("/api/capsule/interests")
        return reply.interests
    }

    static func updateInterests(_ interests: [String]) async throws {
        struct Reply: Decodable { let interests: [String] }
        let _: Reply = try await send("PUT", "/api/capsule/interests", body: ["interests": interests])
    }

    static func fetchCapsuleFeed(page: Int = 1, perPage: Int = 20) async throws -> CapsuleFeed {
        try await get("/api/capsule/feed", query: [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "perPage", value: String(perPage)),
        ])
    }

    // MARK: - Internals

    static func post<T: Decodable>(_ path: String, body: [String: Any], timeout: TimeInterval = 25) async throws -> T {
        try await send("POST", path, body: body, timeout: timeout)
    }

    static func send<T: Decodable>(
        _ method: String,
        _ path: String,
        body: [String: Any],
        timeout: TimeInterval = 25
    ) async throws -> T {
        var request = URLRequest(url: base.appending(path: path))
        request.httpMethod = method
        request.timeoutInterval = timeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            // الخادم يرسل \u200E{ message }\u200E عربية قابلة للعرض عند الأخطاء
            if let parsed = try? JSONDecoder().decode(ServerErrorReply.self, from: data), let message = parsed.message {
                throw CapAPIError.server(message)
            }
            throw CapAPIError.badStatus(http.statusCode)
        }
        return try decoder.decode(T.self, from: data)
    }

    struct ServerErrorReply: Decodable { let message: String? }

    /// POST بلا انتظار نتيجة — للعدادات
    static func firePost(path: String) {
        Task.detached(priority: .background) {
            var request = URLRequest(url: base.appending(path: path))
            request.httpMethod = "POST"
            request.timeoutInterval = 10
            _ = try? await URLSession.shared.data(for: request)
        }
    }
}
