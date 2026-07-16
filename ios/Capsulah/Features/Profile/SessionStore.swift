import Foundation
import Observation

// جلسة المستخدم — كوكي \u200Econnect.sid\u200E تحفظها URLSession تلقائياً وتبقى بين الإطلاقات

@MainActor
@Observable
final class SessionStore {
    enum State {
        case unknown        // لم نتحقق بعد
        case signedOut
        case signedIn(UserProfile)
    }

    private(set) var state: State = .unknown
    private(set) var interests: [String] = []
    private(set) var isBusy = false
    private(set) var authError: String?

    var user: UserProfile? {
        if case .signedIn(let profile) = state { return profile }
        return nil
    }

    var isSignedIn: Bool { user != nil }

    /// عند فتح التطبيق: هل الجلسة المخزنة ما تزال صالحة؟
    func bootstrap() async {
        guard case .unknown = state else { return }
        do {
            let profile = try await CapAPI.currentUser()
            state = .signedIn(profile)
            interests = (try? await CapAPI.fetchInterests()) ?? []
        } catch {
            state = .signedOut
        }
    }

    func login(email: String, password: String) async {
        await authenticate {
            _ = try await CapAPI.login(email: email, password: password)
        }
    }

    func register(email: String, password: String, firstName: String, lastName: String?) async {
        await authenticate {
            _ = try await CapAPI.register(email: email, password: password, firstName: firstName, lastName: lastName)
        }
    }

    func logout() async {
        isBusy = true
        defer { isBusy = false }
        try? await CapAPI.logout()
        state = .signedOut
        interests = []
    }

    func updateInterests(_ newInterests: [String]) async {
        let previous = interests
        interests = newInterests
        do {
            try await CapAPI.updateInterests(newInterests)
        } catch {
            interests = previous
        }
    }

    // MARK: - Internals

    private func authenticate(_ operation: () async throws -> Void) async {
        isBusy = true
        authError = nil
        defer { isBusy = false }
        do {
            try await operation()
            let profile = try await CapAPI.currentUser()
            state = .signedIn(profile)
            interests = (try? await CapAPI.fetchInterests()) ?? []
        } catch let error as CapAPIError {
            authError = error.displayMessage
        } catch {
            authError = "تعذر الاتصال — تأكد من الشبكة وأعد المحاولة"
        }
    }
}
