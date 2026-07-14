import SwiftUI

struct NewsDetailView: View {
    @State private var model: NewsDetailViewModel
    @Environment(\.dismiss) private var dismiss

    private let heroHeight: CGFloat = 300

    init(item: NewsItem) {
        _model = State(initialValue: NewsDetailViewModel(item: item))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                stretchyHero
                article
            }
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .ignoresSafeArea(edges: .top)
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .topLeading) { floatingButtons }
        .task { await model.load() }
    }

    // MARK: - الصورة البطولية المرنة

    private var stretchyHero: some View {
        GeometryReader { geo in
            let offset = geo.frame(in: .global).minY
            NewsImage(path: model.item.imageUrl, alt: model.item.imageAlt)
                .frame(width: geo.size.width, height: heroHeight + max(0, offset))
                .clipped()
                .overlay {
                    LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.25), location: 0),
                            .init(color: .clear, location: 0.35),
                            .init(color: CapTheme.paper.opacity(0.0), location: 0.75),
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

    // MARK: - جسم المقال

    private var article: some View {
        VStack(alignment: .leading, spacing: 18) {
            header

            if model.isLoadingBody {
                bodySkeleton
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    ForEach(model.blocks) { block in
                        HTMLBlockView(block: block)
                    }
                }
                .transition(.opacity)
            }

            if !model.item.keywords.isEmpty {
                keywordChips
            }

            if !model.related.isEmpty {
                relatedSection
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 4)
        .padding(.bottom, 48)
        .animation(.easeOut(duration: 0.25), value: model.isLoadingBody)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let name = categoryName {
                Text(name)
                    .font(.system(size: 11.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 5)
                    .background(CapTheme.green, in: .capsule)
            }

            Text(model.item.title)
                .font(.system(size: 23, weight: .heavy))
                .lineSpacing(5)
                .foregroundStyle(CapTheme.ink)
                .multilineTextAlignment(.leading)

            if let subtitle = model.item.subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 16, weight: .medium))
                    .lineSpacing(5)
                    .foregroundStyle(CapTheme.soft)
            }

            meta

            if let summary = model.item.summary, !summary.isEmpty {
                summaryCapsule(summary)
            }
        }
    }

    private var meta: some View {
        HStack(spacing: 8) {
            if let author = model.item.createdBy, !author.isEmpty {
                Circle()
                    .fill(LinearGradient(colors: [CapTheme.greenBright, CapTheme.greenDeep], startPoint: .top, endPoint: .bottom))
                    .frame(width: 26, height: 26)
                    .overlay {
                        Text(String(author.prefix(1)))
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                Text(author)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(CapTheme.greenBright)
                MetaDot()
            }
            if let date = model.item.publishedAt {
                Text(ArabicText.timeAgo(from: date))
                    .font(.system(size: 12.5))
                    .foregroundStyle(CapTheme.soft)
                MetaDot()
            }
            Text("قراءة \(ArabicText.digits(model.item.readingMinutes)) \(model.item.readingMinutes <= 2 ? "دقيقة" : "دقائق")")
                .font(.system(size: 12.5))
                .foregroundStyle(CapTheme.soft)
        }
    }

    /// «كبسولة الخبر» — الملخص في بطاقة العلامة المميزة
    private func summaryCapsule(_ summary: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 7) {
                CapsulePillGlyph()
                    .frame(width: 16, height: 8)
                    .environment(\.colorScheme, .dark)
                Text("كبسولة الخبر")
                    .font(.system(size: 12, weight: .heavy))
            }
            .foregroundStyle(Color(hex: 0xF2FBF6))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(CapTheme.green, in: .capsule)

            Text(summary)
                .font(.system(size: 15.5, weight: .medium))
                .lineSpacing(7)
                .foregroundStyle(CapTheme.ink)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CapTheme.mint, in: .rect(cornerRadius: 20))
        .padding(.top, 2)
    }

    private var bodySkeleton: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(0..<7, id: \.self) { i in
                RoundedRectangle(cornerRadius: 6)
                    .fill(CapTheme.mint)
                    .frame(height: 15)
                    .frame(maxWidth: i % 3 == 2 ? 220 : .infinity)
            }
        }
        .redacted(reason: .placeholder)
        .accessibilityLabel("جارٍ تحميل الخبر")
    }

    private var keywordChips: some View {
        FlowLayoutChips(keywords: model.item.keywords)
            .padding(.top, 4)
    }

    private var relatedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Capsule().fill(CapTheme.green).frame(width: 22, height: 5)
                Text("أخبار ذات صلة")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
            }
            .padding(.top, 10)

            VStack(spacing: 10) {
                ForEach(model.related) { item in
                    NavigationLink(value: item) {
                        RelatedNewsRow(item: item)
                    }
                }
            }
        }
    }

    // MARK: - أزرار عائمة (رجوع + مشاركة)

    private var floatingButtons: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.forward") // RTL: السهم للأمام = رجوع
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(CapTheme.ink)
                    .frame(width: 38, height: 38)
                    .background(.ultraThinMaterial, in: .circle)
            }
            .accessibilityLabel("رجوع")

            Spacer()

            if let url = model.item.webURL {
                ShareLink(item: url, message: Text(model.item.title)) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(CapTheme.ink)
                        .frame(width: 38, height: 38)
                        .background(.ultraThinMaterial, in: .circle)
                }
                .accessibilityLabel("مشاركة الخبر")
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 54)
    }

    private var categoryName: String? {
        // أسماء التصنيفات الشائعة — تُغنينا عن نداء شبكة إضافي هنا
        switch model.item.category {
        case "health-news": "أخبار الصحة"
        case "saudi-health": "الصحة في السعودية"
        case "health-community": "مجتمع صحي"
        case "health-reports": "تقارير صحية"
        case "misc": "متنوع"
        default: model.item.category
        }
    }
}

// MARK: - صف خبر ذي صلة

struct RelatedNewsRow: View {
    let item: NewsItem

    var body: some View {
        HStack(spacing: 12) {
            NewsImage(path: item.imageUrl, alt: item.imageAlt)
                .frame(width: 64, height: 64)
                .clipShape(.rect(cornerRadius: 13))

            VStack(alignment: .leading, spacing: 5) {
                Text(item.title)
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                    .lineSpacing(2)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                if let date = item.publishedAt {
                    Text(ArabicText.timeAgo(from: date))
                        .font(.system(size: 12))
                        .foregroundStyle(CapTheme.soft)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(9)
        .background(CapTheme.card)
        .clipShape(.rect(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(CapTheme.line, lineWidth: 1))
    }
}

// MARK: - رقاقات الكلمات المفتاحية (صفوف متدفقة)

struct FlowLayoutChips: View {
    let keywords: [String]

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(keywords, id: \.self) { keyword in
                Text(keyword)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(CapTheme.soft)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(CapTheme.chip, in: .capsule)
                    .overlay(Capsule().stroke(CapTheme.line, lineWidth: 1))
            }
        }
    }
}

/// تخطيط متدفق بسيط للرقاقات
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal: proposal, subviews: subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (subview, position) in zip(subviews, result.positions) {
            subview.place(
                at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y),
                proposal: .unspecified
            )
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
