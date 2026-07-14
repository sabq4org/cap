import SwiftUI

@main
struct CapsulahApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(\.layoutDirection, .rightToLeft)
                .environment(\.locale, Locale(identifier: "ar_SA"))
                .tint(CapTheme.green)
        }
    }
}
