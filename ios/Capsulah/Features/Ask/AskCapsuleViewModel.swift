import Foundation
import Observation

// MARK: - سجل الاستفسارات المحفوظ محلياً

struct SavedRumorRef: Codable, Identifiable, Hashable {
    let id: String
    let text: String
    let date: Date
}

enum RumorHistoryStore {
    private static let key = "askCapsule.history.v1"

    static func load() -> [SavedRumorRef] {
        guard let data = UserDefaults.standard.data(forKey: key),
              let refs = try? JSONDecoder().decode([SavedRumorRef].self, from: data)
        else { return [] }
        return refs
    }

    static func save(_ refs: [SavedRumorRef]) {
        let trimmed = Array(refs.prefix(30))
        if let data = try? JSONEncoder().encode(trimmed) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}

// MARK: - نموذج الشاشة

@MainActor
@Observable
final class AskCapsuleViewModel {
    enum SubmitPhase: Equatable {
        case idle
        case sending
        case analyzing          // أُرسلت وتنتظر حكم الذكاء الاصطناعي
        case done(RumorSubmission)
        case failed(String)
    }

    var rumorText = ""
    var platform: RumorPlatform = .whatsapp
    var sourceUrl = ""

    private(set) var submitPhase: SubmitPhase = .idle
    private(set) var published: [RumorSubmission] = []
    private(set) var history: [SavedRumorRef] = RumorHistoryStore.load()

    private var pollTask: Task<Void, Never>?

    var canSubmit: Bool {
        rumorText.trimmingCharacters(in: .whitespacesAndNewlines).count >= 10
            && submitPhase != .sending && submitPhase != .analyzing
    }

    func loadPublished() async {
        guard published.isEmpty else { return }
        published = (try? await CapAPI.fetchPublishedRumors(limit: 10)) ?? []
    }

    func submit() async {
        let text = rumorText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= 10 else { return }
        submitPhase = .sending
        do {
            let receipt = try await CapAPI.submitRumor(
                text: text,
                platform: platform.rawValue,
                sourceUrl: sourceUrl.trimmingCharacters(in: .whitespaces)
            )
            history.insert(SavedRumorRef(id: receipt.id, text: text, date: Date()), at: 0)
            RumorHistoryStore.save(history)
            submitPhase = .analyzing
            poll(id: receipt.id)
        } catch let error as CapAPIError {
            submitPhase = .failed(error.displayMessage)
        } catch {
            submitPhase = .failed("تعذر إرسال الاستفسار — حاول مجدداً")
        }
    }

    /// يستطلع النتيجة كل ثانيتين ونصف حتى يصدر الحكم (٦٠ ثانية كحد أقصى)
    private func poll(id: String) {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            for _ in 0..<24 {
                try? await Task.sleep(for: .seconds(2.5))
                guard !Task.isCancelled, let self else { return }
                if let rumor = try? await CapAPI.fetchRumor(id: id), rumor.hasVerdict {
                    self.submitPhase = .done(rumor)
                    return
                }
            }
            guard let self, !Task.isCancelled else { return }
            if case .analyzing = self.submitPhase {
                self.submitPhase = .failed("التحليل يستغرق وقتاً أطول من المعتاد — ستجد النتيجة لاحقاً في «استفساراتي»")
            }
        }
    }

    func reset() {
        pollTask?.cancel()
        rumorText = ""
        sourceUrl = ""
        platform = .whatsapp
        submitPhase = .idle
    }

    func deleteHistoryItem(_ ref: SavedRumorRef) {
        history.removeAll { $0.id == ref.id }
        RumorHistoryStore.save(history)
    }
}
