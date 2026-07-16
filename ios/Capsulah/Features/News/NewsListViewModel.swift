import Foundation
import Observation

@MainActor
@Observable
final class NewsListViewModel {
    enum Segment: Hashable {
        case news, articles
    }

    enum Phase {
        case loading
        case ready
        case failed
    }

    var segment: Segment = .news {
        didSet { if segment != oldValue { Task { await reload() } } }
    }

    private(set) var phase: Phase = .loading
    private(set) var items: [NewsItem] = []
    private(set) var articles: [Article] = []
    private(set) var categories: [NewsCategory] = []
    private(set) var selectedCategory: String?
    private(set) var isLoadingMore = false
    private(set) var totalCount = 0

    var searchText = "" {
        didSet { if searchText != oldValue { scheduleSearch() } }
    }

    private var page = 1
    private var totalPages = 1
    private var searchTask: Task<Void, Never>?

    var canLoadMore: Bool { segment == .news && page < totalPages && !isLoadingMore }

    func load() async {
        guard items.isEmpty && articles.isEmpty else { return }
        if categories.isEmpty {
            let cats = (try? await CapAPI.fetchCategories()) ?? []
            categories = cats
                .filter { $0.isActive ?? true }
                .sorted { ($0.sortOrder ?? 99) < ($1.sortOrder ?? 99) }
        }
        await reload()
    }

    func reload() async {
        phase = .loading
        switch segment {
        case .news:
            await loadNewsPage(1, replacing: true)
        case .articles:
            do {
                articles = try await CapAPI.fetchArticles()
                phase = .ready
            } catch {
                phase = .failed
            }
        }
    }

    func select(category slug: String?) async {
        guard slug != selectedCategory else { return }
        selectedCategory = slug
        await reload()
    }

    func loadMoreIfNeeded(current item: NewsItem) async {
        guard canLoadMore, item.id == items.last?.id else { return }
        await loadNewsPage(page + 1, replacing: false)
    }

    func categoryName(for slug: String?) -> String? {
        guard let slug else { return nil }
        return categories.first { $0.slug == slug }?.nameAr
    }

    // MARK: - Internals

    private func loadNewsPage(_ target: Int, replacing: Bool) async {
        if !replacing { isLoadingMore = true }
        defer { isLoadingMore = false }
        do {
            let result = try await CapAPI.fetchNewsPage(
                page: target,
                category: selectedCategory,
                search: searchText.trimmingCharacters(in: .whitespaces).isEmpty ? nil : searchText
            )
            page = result.page
            totalPages = result.totalPages
            totalCount = result.total
            items = replacing ? result.news : items + result.news
            phase = .ready
        } catch {
            if replacing {
                items = []
                phase = .failed
            }
        }
    }

    private func scheduleSearch() {
        searchTask?.cancel()
        searchTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(450))
            guard !Task.isCancelled, let self else { return }
            await self.reload()
        }
    }
}
