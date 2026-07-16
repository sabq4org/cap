import SwiftUI

enum CapTab: Hashable, CaseIterable {
    case home, news, ask, drugs, profile

    var title: String {
        switch self {
        case .home: "الرئيسية"
        case .news: "الأخبار"
        case .ask: "اسأل"
        case .drugs: "الأدوية"
        case .profile: "حسابي"
        }
    }

    var icon: String {
        switch self {
        case .home: "house"
        case .news: "newspaper"
        case .ask: "pills"
        case .drugs: "pills"
        case .profile: "person"
        }
    }

    var iconFilled: String { icon + ".fill" }
}

struct RootTabView: View {
    @State private var selection: CapTab = .home
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ZStack(alignment: .bottom) {
                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                CapTabBar(selection: $selection)
            }
            .ignoresSafeArea(.keyboard)
            .background(CapTheme.paper)
            .navigationDestination(for: NewsItem.self) { item in
                NewsDetailView(item: item)
            }
            .navigationDestination(for: Article.self) { article in
                ArticleDetailView(article: article)
            }
            .navigationDestination(for: Drug.self) { drug in
                DrugDetailView(drug: drug)
            }
        }
        .tint(CapTheme.green)
        .task {
            #if DEBUG
            // للاختبار الآلي من سطر الأوامر: يفتح أول خبر مباشرة
            if ProcessInfo.processInfo.environment["AUTO_OPEN_FIRST_NEWS"] == "1",
               let first = try? await CapAPI.fetchNews(limit: 1).first {
                path.append(first)
            }
            // AUTO_TAB=news|ask|drugs|profile يفتح التبويب مباشرة للقطات الآلية
            switch ProcessInfo.processInfo.environment["AUTO_TAB"] {
            case "news": selection = .news
            case "ask": selection = .ask
            case "drugs": selection = .drugs
            case "profile": selection = .profile
            default: break
            }
            #endif
        }
    }

    @ViewBuilder
    private var content: some View {
        switch selection {
        case .home:
            HomeView(
                onAskCapsule: { selection = .ask },
                onProfile: { selection = .profile }
            )
        case .news:
            NewsListView()
        case .ask:
            AskCapsuleView()
        case .drugs:
            DrugsView()
        case .profile:
            ProfileView()
        }
    }
}

// MARK: - شريط التبويبات المخصص

struct CapTabBar: View {
    @Binding var selection: CapTab

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            tabButton(.home)
            tabButton(.news)
            askButton
            tabButton(.drugs)
            tabButton(.profile)
        }
        .padding(.top, 6)
        .frame(maxWidth: .infinity)
        .background {
            Rectangle()
                .fill(.ultraThinMaterial)
                .overlay(alignment: .top) {
                    Rectangle().fill(CapTheme.line).frame(height: 0.5)
                }
                .ignoresSafeArea(edges: .bottom)
        }
    }

    private func tabButton(_ tab: CapTab) -> some View {
        let isOn = selection == tab
        return Button {
            selection = tab
        } label: {
            VStack(spacing: 3) {
                Image(systemName: isOn ? tab.iconFilled : tab.icon)
                    .font(.system(size: 21, weight: .medium))
                    .frame(height: 24)
                Text(tab.title)
                    .font(.system(size: 10, weight: .bold))
            }
            .foregroundStyle(isOn ? CapTheme.greenBright : CapTheme.soft)
            .frame(maxWidth: .infinity)
            .contentShape(.rect)
        }
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }

    private var askButton: some View {
        Button {
            selection = .ask
        } label: {
            VStack(spacing: 3) {
                ZStack {
                    Circle()
                        .fill(CapTheme.askGradient)
                        .frame(width: 44, height: 44)
                        .shadow(color: Color(hex: 0x137C4B).opacity(0.30), radius: 7, y: 3)
                    AskCapsuleGlyph()
                        .frame(width: 21, height: 11)
                }
                .offset(y: -9)
                Text("اسأل")
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(CapTheme.greenBright)
                    .offset(y: -9)
            }
            .frame(maxWidth: .infinity)
            .contentShape(.rect)
        }
        .accessibilityLabel("اسأل كبسولة، التحقق من شائعة")
        .accessibilityAddTraits(selection == .ask ? .isSelected : [])
    }
}

/// كبسولة مائلة بخط قسمة — أيقونة زر «اسأل» من لغة الشعار
struct AskCapsuleGlyph: View {
    var body: some View {
        ZStack {
            Capsule()
                .stroke(.white, lineWidth: 2)
            Rectangle()
                .fill(.white)
                .frame(width: 2)
        }
        .rotationEffect(.degrees(-35))
    }
}
