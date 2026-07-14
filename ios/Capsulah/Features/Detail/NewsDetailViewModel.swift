import Foundation
import Observation

@MainActor
@Observable
final class NewsDetailViewModel {
    private(set) var item: NewsItem
    private(set) var blocks: [HTMLBlock] = []
    private(set) var related: [NewsItem] = []
    private(set) var isLoadingBody: Bool

    init(item: NewsItem) {
        self.item = item
        // إن وصل المحتوى مع بطاقة القائمة نعرضه فوراً بلا أي انتظار
        if let content = item.content, !content.isEmpty {
            blocks = HTMLContent.parse(content)
            isLoadingBody = false
        } else {
            isLoadingBody = true
        }
    }

    func load() async {
        CapAPI.trackView(id: item.id)

        async let detailTask = CapAPI.fetchNewsDetail(id: item.id)
        async let relatedTask = CapAPI.fetchRelated(id: item.id)

        if isLoadingBody {
            if let detail = try? await detailTask {
                item = detail
                blocks = HTMLContent.parse(detail.content ?? "")
            }
            isLoadingBody = false
        } else {
            _ = try? await detailTask
        }

        related = (try? await relatedTask) ?? []
    }
}
