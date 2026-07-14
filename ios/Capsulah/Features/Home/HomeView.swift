import SwiftUI

struct HomeView: View {
    @State private var model = HomeViewModel()
    var onAskCapsule: () -> Void = {}

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                AppBar()
                    .padding(.top, 6)

                if model.phase == .loading {
                    loadingPlaceholder
                } else {
                    MorningCapsuleCard(digest: model.digest)

                    if let breaking = model.breaking {
                        BreakingStrip(item: breaking)
                    }

                    CategoryChipsRow(
                        categories: model.categories,
                        selected: model.selectedCategory
                    ) { slug in
                        Task { await model.select(category: slug) }
                    }
                    .padding(.top, 2)

                    SectionHeader(title: "أبرز الأخبار")
                        .padding(.top, 4)

                    if model.isFilterLoading {
                        ProgressView()
                            .padding(.vertical, 30)
                    } else {
                        if let featured = model.featured {
                            FeaturedStoryCard(
                                item: featured,
                                categoryName: model.categoryName(for: featured.category)
                            )
                        }

                        VStack(spacing: 10) {
                            ForEach(model.feed) { item in
                                NewsRowCard(
                                    item: item,
                                    categoryName: model.categoryName(for: item.category)
                                )
                            }
                        }
                    }

                    RumorCTACard(onTap: onAskCapsule)
                        .padding(.top, 4)

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
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .task { await model.load() }
        .refreshable { await model.load() }
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

#Preview {
    HomeView()
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar_SA"))
}
