import Foundation
import Observation

@MainActor
@Observable
final class HomeViewModel {
    enum Phase {
        case loading
        case ready
        case offline   // فشل الاتصال — نعرض عينات مع تنبيه خفيف
    }

    private(set) var phase: Phase = .loading
    private(set) var digest: [NewsItem] = []      // عناوين «كبسولة الصباح»
    private(set) var breaking: NewsItem?
    private(set) var featured: NewsItem?
    private(set) var feed: [NewsItem] = []
    private(set) var categories: [NewsCategory] = []
    private(set) var selectedCategory: String?    // nil = «لك»
    private(set) var isFilterLoading = false

    private var allNews: [NewsItem] = []

    func load() async {
        async let newsTask = CapAPI.fetchNews(limit: 20)
        async let categoriesTask = CapAPI.fetchCategories()

        do {
            let news = try await newsTask
            let cats = (try? await categoriesTask) ?? []
            categories = cats
                .filter { $0.isActive ?? true }
                .sorted { ($0.sortOrder ?? 99) < ($1.sortOrder ?? 99) }
            apply(news)
            phase = .ready
        } catch {
            apply(NewsItem.samples)
            categories = NewsCategory.samples
            phase = .offline
        }
    }

    func select(category slug: String?) async {
        guard slug != selectedCategory else { return }
        selectedCategory = slug

        guard phase == .ready else {
            apply(NewsItem.samples)
            return
        }
        guard let slug else {
            apply(allNews.isEmpty ? NewsItem.samples : allNews)
            return
        }

        isFilterLoading = true
        defer { isFilterLoading = false }
        if let filtered = try? await CapAPI.fetchNews(limit: 20, category: slug) {
            applyFiltered(filtered)
        }
    }

    func categoryName(for slug: String?) -> String? {
        guard let slug else { return nil }
        return categories.first { $0.slug == slug }?.nameAr
    }

    // MARK: - Internals

    private func apply(_ news: [NewsItem]) {
        allNews = news
        digest = Array(news.prefix(3))
        breaking = news.first { $0.isBreaking }
        featured = news.first { $0.isFeatured } ?? news.first
        feed = news
            .filter { $0.id != featured?.id }
            .prefix(8)
            .map { $0 }
    }

    /// عند التصفية بالتصنيف تبقى «كبسولة الصباح» والعاجل من الخلاصة العامة
    private func applyFiltered(_ news: [NewsItem]) {
        featured = news.first
        feed = news
            .dropFirst()
            .prefix(8)
            .map { $0 }
    }
}
