import SwiftUI

@main
struct CapsulahApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(session)
                .environment(\.layoutDirection, .rightToLeft)
                .environment(\.locale, Locale(identifier: "ar_SA"))
                .tint(CapTheme.green)
        }
    }
}
