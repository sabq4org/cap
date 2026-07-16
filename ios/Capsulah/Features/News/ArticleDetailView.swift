import SwiftUI

// شاشة تفاصيل المقال — تستعمل نفس محرك عرض HTML الخاص بالأخبار

struct ArticleDetailView: View {
    let article: Article

    @Environment(\.dismiss) private var dismiss
    @State private var blocks: [HTMLBlock] = []
    @State private var isLoading = true

    private let heroHeight: CGFloat = 260

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                if article.imageUrl != nil {
                    hero
                }
                body_
            }
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .ignoresSafeArea(edges: article.imageUrl != nil ? .top : [])
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .topLeading) { floatingButtons }
        .task { await load() }
    }

    private var hero: some View {
        GeometryReader { geo in
            let offset = geo.frame(in: .global).minY
            NewsImage(path: article.imageUrl, alt: article.imageAlt)
                .frame(width: geo.size.width, height: heroHeight + max(0, offset))
                .clipped()
                .overlay {
                    LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.25), location: 0),
                            .init(color: .clear, location: 0.35),
                            .init(color: CapTheme.paper, location: 1),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
                .offset(y: -max(0, offset))
        }
        .frame(height: heroHeight)
    }

    private var body_: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "text.book.closed.fill")
                        .font(.system(size: 10.5))
                    Text("مقال صحي")
                        .font(.system(size: 11.5, weight: .heavy))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 5)
                .background(CapTheme.green, in: .capsule)
                .padding(.top, article.imageUrl == nil ? 56 : 0)

                Text(article.title)
                    .font(.system(size: 23, weight: .heavy))
                    .lineSpacing(5)
                    .foregroundStyle(CapTheme.ink)
                    .multilineTextAlignment(.leading)

                meta

                if !article.excerpt.isEmpty {
                    Text(article.excerpt)
                        .font(.system(size: 15.5, weight: .medium))
                        .lineSpacing(7)
                        .foregroundStyle(CapTheme.ink)
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(CapTheme.mint, in: .rect(cornerRadius: 20))
                }
            }

            if isLoading {
                skeleton
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    ForEach(blocks) { block in
                        HTMLBlockView(block: block)
                    }
                }
                .transition(.opacity)
            }

            if !article.sources.isEmpty {
                sourcesSection
            }

            if !article.keywords.isEmpty {
                FlowLayoutChips(keywords: article.keywords)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 4)
        .padding(.bottom, 48)
        .animation(.easeOut(duration: 0.25), value: isLoading)
    }

    private var meta: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 8) {
                if let author = article.author, !author.isEmpty {
                    Text(author)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(CapTheme.greenBright)
                    MetaDot()
                }
                Text("قراءة \(ArabicText.digits(article.readTime)) \(article.readTime <= 2 ? "دقيقة" : "دقائق")")
                    .font(.system(size: 12.5))
                    .foregroundStyle(CapTheme.soft)
                if let date = article.publishedAt {
                    MetaDot()
                    Text(ArabicText.timeAgo(from: date))
                        .font(.system(size: 12.5))
                        .foregroundStyle(CapTheme.soft)
                }
            }
            if let reviewer = article.reviewedBy, !reviewer.isEmpty {
                HStack(spacing: 5) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 11.5))
                    Text("تمت مراجعته طبياً بواسطة \(reviewer)")
                }
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(CapTheme.greenBright)
                .padding(.horizontal, 11)
                .padding(.vertical, 6)
                .background(CapTheme.chip, in: .capsule)
            }
        }
    }

    private var sourcesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Capsule().fill(CapTheme.green).frame(width: 22, height: 5)
                Text("المصادر")
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
            }
            ForEach(article.sources, id: \.self) { source in
                if let url = URL(string: source.url) {
                    Link(destination: url) {
                        HStack(spacing: 8) {
                            Image(systemName: "link")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(CapTheme.greenBright)
                            Text(source.title)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(CapTheme.ink)
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)
                            Spacer(minLength: 0)
                        }
                        .padding(12)
                        .background(CapTheme.card, in: .rect(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(CapTheme.line, lineWidth: 1))
                    }
                }
            }
        }
        .padding(.top, 6)
    }

    private var skeleton: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(0..<7, id: \.self) { i in
                RoundedRectangle(cornerRadius: 6)
                    .fill(CapTheme.mint)
                    .frame(height: 15)
                    .frame(maxWidth: i % 3 == 2 ? 220 : .infinity)
            }
        }
        .redacted(reason: .placeholder)
        .accessibilityLabel("جارٍ تحميل المقال")
    }

    private var floatingButtons: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.forward")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(CapTheme.ink)
                    .frame(width: 38, height: 38)
                    .background(.ultraThinMaterial, in: .circle)
            }
            .accessibilityLabel("رجوع")

            Spacer()

            if let url = article.webURL {
                ShareLink(item: url, message: Text(article.title)) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(CapTheme.ink)
                        .frame(width: 38, height: 38)
                        .background(.ultraThinMaterial, in: .circle)
                }
                .accessibilityLabel("مشاركة المقال")
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 54)
    }

    private func load() async {
        // القائمة قد تصل بلا محتوى كامل — نجلب المقال بنصه عند الحاجة
        if let content = article.content, !content.isEmpty {
            blocks = HTMLContent.parse(content)
        } else if let full = try? await CapAPI.fetchArticle(slug: article.slug),
                  let content = full.content {
            blocks = HTMLContent.parse(content)
        }
        isLoading = false
    }
}
