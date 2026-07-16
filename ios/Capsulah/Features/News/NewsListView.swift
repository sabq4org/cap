import SwiftUI

// تبويب «الأخبار» — الأرشيف الكامل: بحث، تصنيفات، تحميل تدريجي، وقسم المقالات

struct NewsListView: View {
    @State private var model = NewsListViewModel()

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                header
                searchField
                segmentPicker

                if model.segment == .news {
                    CategoryChipsRow(
                        categories: model.categories,
                        selected: model.selectedCategory
                    ) { slug in
                        Task { await model.select(category: slug) }
                    }
                    .padding(.top, 2)
                }

                switch model.phase {
                case .loading:
                    skeleton
                case .failed:
                    ErrorStateCard { Task { await model.reload() } }
                case .ready:
                    results
                }
            }
            .padding(.bottom, 84)
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .task { await model.load() }
        .refreshable { await model.reload() }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("الأخبار")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                Text(model.segment == .news ? "كل ما يستجد في عالم الصحة" : "مقالات موثوقة يراجعها مختصون")
                    .font(.system(size: 12.5))
                    .foregroundStyle(CapTheme.soft)
            }
            Spacer()
            if model.segment == .news, model.totalCount > 0 {
                Text("\(ArabicText.digits(model.totalCount)) خبر")
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(CapTheme.greenBright)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 6)
                    .background(CapTheme.chip, in: .capsule)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 14)
    }

    private var searchField: some View {
        HStack(spacing: 9) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(CapTheme.soft)
            TextField("ابحث في الأرشيف الصحي…", text: $model.searchText)
                .font(.system(size: 14.5))
                .foregroundStyle(CapTheme.ink)
                .submitLabel(.search)
            if !model.searchText.isEmpty {
                Button {
                    model.searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 15))
                        .foregroundStyle(CapTheme.soft.opacity(0.6))
                }
                .accessibilityLabel("مسح البحث")
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(CapTheme.card, in: .rect(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(CapTheme.line, lineWidth: 1))
        .padding(.horizontal, 16)
    }

    private var segmentPicker: some View {
        HStack(spacing: 6) {
            segmentButton(.news, title: "الأخبار", icon: "newspaper.fill")
            segmentButton(.articles, title: "مقالات", icon: "text.book.closed.fill")
        }
        .padding(4)
        .background(CapTheme.chip, in: .capsule)
        .padding(.horizontal, 16)
    }

    private func segmentButton(_ segment: NewsListViewModel.Segment, title: String, icon: String) -> some View {
        let isOn = model.segment == segment
        return Button {
            withAnimation(.smooth(duration: 0.25)) { model.segment = segment }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                Text(title)
                    .font(.system(size: 13, weight: .bold))
            }
            .foregroundStyle(isOn ? .white : CapTheme.soft)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 9)
            .background(isOn ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(.clear), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }

    @ViewBuilder
    private var results: some View {
        switch model.segment {
        case .news:
            if model.items.isEmpty {
                EmptyStateCard(
                    icon: "doc.text.magnifyingglass",
                    title: "لا توجد نتائج",
                    subtitle: model.searchText.isEmpty ? "لا توجد أخبار في هذا القسم حالياً" : "جرّب كلمات بحث مختلفة"
                )
            } else {
                ForEach(model.items) { item in
                    NewsRowCard(item: item, categoryName: model.categoryName(for: item.category))
                        .task { await model.loadMoreIfNeeded(current: item) }
                }
                if model.isLoadingMore {
                    ProgressView()
                        .padding(.vertical, 16)
                }
            }
        case .articles:
            if model.articles.isEmpty {
                EmptyStateCard(
                    icon: "text.book.closed",
                    title: "لا توجد مقالات",
                    subtitle: "ستجد هنا المقالات الصحية الموثوقة فور نشرها"
                )
            } else {
                ForEach(model.articles) { article in
                    ArticleRowCard(article: article)
                }
            }
        }
    }

    private var skeleton: some View {
        VStack(spacing: 12) {
            ForEach(0..<6, id: \.self) { _ in
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

// MARK: - بطاقة مقال

struct ArticleRowCard: View {
    let article: Article

    var body: some View {
        NavigationLink(value: article) {
            VStack(alignment: .leading, spacing: 0) {
                if article.imageUrl != nil {
                    NewsImage(path: article.imageUrl, alt: article.imageAlt)
                        .frame(height: 150)
                        .clipped()
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(article.title)
                        .font(.system(size: 15.5, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                        .lineSpacing(3)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    Text(article.excerpt)
                        .font(.system(size: 12.5))
                        .foregroundStyle(CapTheme.soft)
                        .lineSpacing(3)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        if let reviewer = article.reviewedBy, !reviewer.isEmpty {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.system(size: 10.5))
                                Text("راجعه \(reviewer)")
                                    .lineLimit(1)
                            }
                            .font(.system(size: 11.5, weight: .bold))
                            .foregroundStyle(CapTheme.greenBright)
                            MetaDot()
                        }
                        Text("قراءة \(ArabicText.digits(article.readTime)) \(article.readTime <= 2 ? "دقيقة" : "دقائق")")
                            .font(.system(size: 11.5))
                            .foregroundStyle(CapTheme.soft)
                    }
                }
                .padding(.horizontal, 15)
                .padding(.vertical, 13)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(CapTheme.card)
            .clipShape(.rect(cornerRadius: 22))
            .shadow(color: CapTheme.cardShadow, radius: 10, y: 4)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
    }
}

// MARK: - حالات عامة

struct EmptyStateCard: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 28, weight: .light))
                .foregroundStyle(CapTheme.green)
                .frame(width: 66, height: 66)
                .background(CapTheme.mint, in: .circle)
            Text(title)
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
            Text(subtitle)
                .font(.system(size: 12.5))
                .foregroundStyle(CapTheme.soft)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 44)
    }
}

struct ErrorStateCard: View {
    var retry: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 26, weight: .light))
                .foregroundStyle(CapTheme.soft)
                .frame(width: 66, height: 66)
                .background(CapTheme.chip, in: .circle)
            Text("تعذر الاتصال")
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
            Text("تأكد من اتصالك بالإنترنت ثم أعد المحاولة")
                .font(.system(size: 12.5))
                .foregroundStyle(CapTheme.soft)
            Button(action: retry) {
                Text("إعادة المحاولة")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 9)
                    .background(CapTheme.askGradient, in: .capsule)
            }
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

#Preview {
    NavigationStack {
        NewsListView()
    }
    .environment(\.layoutDirection, .rightToLeft)
    .environment(\.locale, Locale(identifier: "ar_SA"))
}
