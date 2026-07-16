import SwiftUI

struct HomeView: View {
    @State private var model = HomeViewModel()
    @State private var didAppear = false
    @State private var showPodcast = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var onAskCapsule: () -> Void = {}
    var onProfile: () -> Void = {}

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                AppBar(onProfile: onProfile)
                    .padding(.top, 8)

                if model.phase == .loading {
                    loadingPlaceholder
                } else {
                    MorningCapsuleCard(digest: model.digest, onListen: { showPodcast = true })
                        .homeEntrance(didAppear: didAppear, delay: 0, reduceMotion: reduceMotion)

                    if let breaking = model.breaking {
                        BreakingStrip(item: breaking)
                            .homeEntrance(didAppear: didAppear, delay: 0.04, reduceMotion: reduceMotion)
                    }

                    CategoryChipsRow(
                        categories: model.categories,
                        selected: model.selectedCategory
                    ) { slug in
                        Task { await model.select(category: slug) }
                    }
                    .padding(.top, 2)
                    .homeEntrance(didAppear: didAppear, delay: 0.08, reduceMotion: reduceMotion)

                    SectionHeader(title: "أبرز الأخبار", subtitle: model.selectedCategory == nil ? "مختارة لك اليوم" : "أحدث أخبار القسم")
                        .padding(.top, 6)
                        .homeEntrance(didAppear: didAppear, delay: 0.12, reduceMotion: reduceMotion)

                    if model.isFilterLoading {
                        ProgressView()
                            .padding(.vertical, 30)
                    } else {
                        if let featured = model.featured {
                            FeaturedStoryCard(
                                item: featured,
                                categoryName: model.categoryName(for: featured.category)
                            )
                            .homeEntrance(didAppear: didAppear, delay: 0.16, reduceMotion: reduceMotion)
                        }

                        LazyVStack(spacing: 12) {
                            ForEach(model.feed) { item in
                                NewsRowCard(
                                    item: item,
                                    categoryName: model.categoryName(for: item.category)
                                )
                            }
                        }
                    }

                    RumorCTACard(onTap: onAskCapsule)
                        .padding(.top, 6)

                    if model.phase == .offline {
                        Label("تعذر الاتصال — تعرض الآن محتويات تجريبية", systemImage: "wifi.slash")
                            .font(.system(size: 12))
                            .foregroundStyle(CapTheme.soft)
                            .padding(.top, 4)
                    }
                }
            }
            .padding(.bottom, 84) // مساحة لشريط التبويبات العائم
        }
        .background(HomeBackdrop())
        .scrollIndicators(.hidden)
        .task {
            await model.load()
            withAnimation(reduceMotion ? nil : .smooth(duration: 0.55)) {
                didAppear = true
            }
        }
        .refreshable { await model.load() }
        .sheet(isPresented: $showPodcast) {
            PodcastSheet()
                .presentationDetents([.large])
                .presentationDragIndicator(.hidden)
        }
    }

    private var loadingPlaceholder: some View {
        VStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 28)
                .fill(CapTheme.mint)
                .frame(height: 230)
                .padding(.horizontal, 16)
            RoundedRectangle(cornerRadius: 24)
                .fill(CapTheme.mint)
                .frame(height: 250)
                .padding(.horizontal, 16)
            ForEach(0..<2, id: \.self) { _ in
                RoundedRectangle(cornerRadius: 20)
                    .fill(CapTheme.mint)
                    .frame(height: 94)
                    .padding(.horizontal, 16)
            }
        }
        .redacted(reason: .placeholder)
        .accessibilityLabel("جارٍ التحميل")
    }
}

private struct HomeBackdrop: View {
    var body: some View {
        ZStack(alignment: .top) {
            CapTheme.paper
            RadialGradient(
                colors: [CapTheme.greenBright.opacity(0.09), .clear],
                center: .init(x: 0.92, y: 0.02),
                startRadius: 10,
                endRadius: 290
            )
            .frame(height: 420)
            .allowsHitTesting(false)
        }
        .ignoresSafeArea()
    }
}

private extension View {
    func homeEntrance(didAppear: Bool, delay: Double, reduceMotion: Bool) -> some View {
        opacity(didAppear ? 1 : 0)
            .offset(y: didAppear || reduceMotion ? 0 : 10)
            .animation(reduceMotion ? nil : .smooth(duration: 0.45).delay(delay), value: didAppear)
    }
}

#Preview {
    HomeView()
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar_SA"))
}
