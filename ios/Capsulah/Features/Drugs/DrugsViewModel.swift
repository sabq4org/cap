import Foundation
import Observation

@MainActor
@Observable
final class DrugsViewModel {
    enum Phase {
        case loading
        case ready
        case failed
    }

    private(set) var phase: Phase = .loading
    private(set) var popular: [Drug] = []
    private(set) var results: [Drug] = []
    private(set) var isSearching = false
    private(set) var isGenerating = false
    private(set) var generationError: String?
    var generatedDrug: Drug?

    var searchText = "" {
        didSet { if searchText != oldValue { scheduleSearch() } }
    }

    private var searchTask: Task<Void, Never>?

    var trimmedQuery: String { searchText.trimmingCharacters(in: .whitespaces) }
    var isQueryActive: Bool { trimmedQuery.count >= 2 }

    /// لا نتائج للبحث الحالي — نعرض زر التوليد بالذكاء الاصطناعي
    var showGenerateOffer: Bool {
        isQueryActive && !isSearching && results.isEmpty && !isGenerating
    }

    func load() async {
        guard popular.isEmpty else { return }
        do {
            popular = try await CapAPI.fetchDrugs(limit: 20)
            phase = .ready
        } catch {
            phase = .failed
        }
    }

    func reload() async {
        popular = []
        phase = .loading
        await load()
    }

    func generateCurrent() async {
        let name = trimmedQuery
        guard !name.isEmpty else { return }
        isGenerating = true
        generationError = nil
        defer { isGenerating = false }
        do {
            generatedDrug = try await CapAPI.generateDrug(name: name)
        } catch let error as CapAPIError {
            generationError = error.displayMessage
        } catch {
            generationError = "تعذر توليد المعلومات — حاول مجدداً"
        }
    }

    // MARK: - Internals

    private func scheduleSearch() {
        searchTask?.cancel()
        generationError = nil
        guard isQueryActive else {
            results = []
            isSearching = false
            return
        }
        isSearching = true
        searchTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled, let self else { return }
            let found = (try? await CapAPI.searchDrugs(query: self.trimmedQuery)) ?? []
            guard !Task.isCancelled else { return }
            self.results = found
            self.isSearching = false
        }
    }
}
