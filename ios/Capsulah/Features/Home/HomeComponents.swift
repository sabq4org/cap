import SwiftUI

// مكونات الشاشة الرئيسية — مطابقة لمعاينة التصميم المعتمدة

// MARK: - ترويسة التطبيق

struct AppBar: View {
    var onProfile: () -> Void = {}

    var body: some View {
        HStack(spacing: 12) {
            HStack(spacing: 9) {
                Image("LogoMark")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 34, height: 34)
                    .padding(4)
                    .background(CapTheme.card.opacity(0.9), in: .rect(cornerRadius: 13))
                    .shadow(color: CapTheme.cardShadow, radius: 8, y: 3)
                VStack(alignment: .leading, spacing: 1) {
                    Text("كبسُولة")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundStyle(CapTheme.green)
                    Text("صحيفة صحيّة")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(CapTheme.soft)
                }
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("كبسولة، صحيفة صحية")

            Spacer()

            Button {
                // الإشعارات — مرحلة لاحقة
            } label: {
                Image(systemName: "bell")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(CapTheme.soft)
                    .frame(width: 42, height: 42)
                    .background(CapTheme.card.opacity(0.86), in: .circle)
                    .shadow(color: CapTheme.cardShadow, radius: 8, y: 3)
            }
            .accessibilityLabel("الإشعارات")

            Button(action: onProfile) {
                Circle()
                    .fill(LinearGradient(
                        colors: [CapTheme.greenBright, CapTheme.greenDeep],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 42, height: 42)
                    .overlay {
                        Image(systemName: "person.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    .overlay(Circle().stroke(.white.opacity(0.65), lineWidth: 2))
                    .shadow(color: CapTheme.green.opacity(0.18), radius: 9, y: 4)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("حسابي")
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - بطاقة كبسولة الصباح / المساء

struct MorningCapsuleCard: View {
    let digest: [NewsItem]
    var onListen: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .center) {
                HStack(spacing: 6) {
                    CapsulePillGlyph()
                        .frame(width: 16, height: 8)
                    Text(SaudiTime.capsuleTitle)
                        .font(.system(size: 11.5, weight: .heavy))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 11)
                .padding(.vertical, 5)
                .background(CapTheme.green, in: .capsule)

                Spacer()

                Text(SaudiTime.todayLine)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(CapTheme.soft)
            }

            HStack(spacing: 6) {
                Image(systemName: SaudiTime.isMorning ? "sun.max.fill" : "moon.stars.fill")
                    .font(.system(size: 12, weight: .semibold))
                Text(SaudiTime.greeting)
                    .font(.system(size: 13.5, weight: .bold))
            }
            .foregroundStyle(CapTheme.greenBright)
            .padding(.top, 14)

            Text(SaudiTime.isMorning ? "موجزك الصحي اليوم في خمس دقائق" : "خلاصة يومك الصحي قبل النوم")
                .font(.system(size: 20.5, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
                .lineSpacing(3)
                .padding(.top, 3)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(digest) { item in
                    NavigationLink(value: item) {
                        HStack(alignment: .firstTextBaseline, spacing: 9) {
                            Capsule()
                                .fill(CapTheme.greenBright)
                                .frame(width: 11, height: 5)
                                .offset(y: -2)
                            Text(item.title)
                                .font(.system(size: 13.5, weight: .medium))
                                .foregroundStyle(CapTheme.ink.opacity(0.82))
                                .lineLimit(1)
                            Spacer(minLength: 0)
                        }
                        .contentShape(.rect)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 13)

            HStack(spacing: 12) {
                Button(action: onListen) {
                    HStack(spacing: 9) {
                        ZStack {
                            Circle()
                                .fill(.white.opacity(0.22))
                                .frame(width: 27, height: 27)
                            Image(systemName: "play.fill")
                                .font(.system(size: 11, weight: .bold))
                        }
                        Text("استمع للموجز")
                            .font(.system(size: 14.5, weight: .heavy))
                        EqualizerBars()
                    }
                    .foregroundStyle(.white)
                    .padding(.leading, 8)
                    .padding(.trailing, 18)
                    .padding(.vertical, 8)
                    .background(CapTheme.askGradient, in: .capsule)
                    .shadow(color: Color(hex: 0x1E9960).opacity(0.30), radius: 8, y: 4)
                }

                Spacer()

                Text("\(ArabicText.digits(digest.count)) أخبار · ٥ دقائق")
                    .font(.system(size: 12))
                    .foregroundStyle(CapTheme.soft)
            }
            .padding(.top, 16)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            ZStack {
                LinearGradient(
                    colors: [Color(light: 0xEDF8F1, dark: 0x152118), Color(light: 0xFDFEFD, dark: 0x0F1813)],
                    startPoint: .topTrailing,
                    endPoint: .bottomLeading
                )
                RadialGradient(
                    colors: [Color(hex: 0x4CC98A).opacity(0.20), .clear],
                    center: .init(x: 0.9, y: 0.0),
                    startRadius: 10,
                    endRadius: 240
                )
                // كبسولتان زخرفيتان شفافتان من لغة الشعار
                Capsule()
                    .stroke(CapTheme.greenBright.opacity(0.14), lineWidth: 10)
                    .frame(width: 120, height: 52)
                    .rotationEffect(.degrees(-32))
                    .offset(x: -150, y: 88)
                Capsule()
                    .fill(CapTheme.greenBright.opacity(0.10))
                    .frame(width: 46, height: 20)
                    .rotationEffect(.degrees(-32))
                    .offset(x: 148, y: -66)
            }
        }
        .clipShape(.rect(cornerRadius: 28))
        .overlay(RoundedRectangle(cornerRadius: 28).stroke(.white.opacity(0.72), lineWidth: 1))
        .shadow(color: CapTheme.cardShadow, radius: 18, y: 8)
        .padding(.horizontal, 16)
    }
}

/// موجات صوتية صغيرة تتنفس داخل زر الاستماع
struct EqualizerBars: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animating = false

    private let heights: [CGFloat] = [8, 14, 10, 16, 9]

    var body: some View {
        HStack(spacing: 2.5) {
            ForEach(heights.indices, id: \.self) { i in
                Capsule()
                    .fill(.white.opacity(0.9))
                    .frame(width: 2.5, height: heights[i])
                    .scaleEffect(y: animating && !reduceMotion ? 0.45 : 1, anchor: .center)
                    .animation(
                        reduceMotion ? nil :
                            .easeInOut(duration: 0.55)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.13),
                        value: animating
                    )
            }
        }
        .onAppear { animating = true }
        .accessibilityHidden(true)
    }
}

/// كبسولة صغيرة نصفها ممتلئ — من لغة الشعار
struct CapsulePillGlyph: View {
    var color: Color = .white

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Capsule().fill(color.opacity(0.28))
                Capsule()
                    .fill(color)
                    .frame(width: geo.size.width / 2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .clipShape(.capsule)
            }
        }
    }
}

// MARK: - شريط العاجل

struct BreakingStrip: View {
    let item: NewsItem
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulsing = false

    var body: some View {
        NavigationLink(value: item) {
            HStack(spacing: 10) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(CapTheme.breaking)
                        .frame(width: 7, height: 7)
                        .background {
                            Circle()
                                .fill(CapTheme.breaking.opacity(0.18))
                                .frame(width: 17, height: 17)
                                .scaleEffect(pulsing ? 1.25 : 1)
                        }
                    Text("عاجل")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(CapTheme.breaking)
                }
                Text(item.title)
                    .font(.system(size: 12.5))
                    .foregroundStyle(CapTheme.soft)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(CapTheme.card.opacity(0.88), in: .capsule)
            .shadow(color: CapTheme.cardShadow, radius: 8, y: 3)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                pulsing = true
            }
        }
        .accessibilityLabel("خبر عاجل: \(item.title)")
    }
}

// MARK: - رقاقات التصنيفات

struct CategoryChipsRow: View {
    let categories: [NewsCategory]
    let selected: String?
    let onSelect: (String?) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(title: "لك", slug: nil)
                ForEach(categories) { category in
                    chip(title: category.nameAr, slug: category.slug)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func chip(title: String, slug: String?) -> some View {
        let isOn = slug == selected
        return Button {
            onSelect(slug)
        } label: {
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(isOn ? .white : CapTheme.soft)
                .padding(.horizontal, 15)
                .padding(.vertical, 8)
                .background(isOn ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(CapTheme.card.opacity(0.82)), in: .capsule)
                .overlay {
                    if !isOn {
                        Capsule().stroke(CapTheme.line, lineWidth: 1)
                    }
                }
                .shadow(color: isOn ? CapTheme.green.opacity(0.20) : .clear, radius: 7, y: 3)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

// MARK: - عنوان قسم

struct SectionHeader: View {
    let title: String
    var subtitle: String?
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            Image(systemName: "sparkles")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(CapTheme.green)
                .frame(width: 34, height: 34)
                .background(CapTheme.mint, in: .rect(cornerRadius: 11))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(CapTheme.soft)
                }
            }
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(CapTheme.greenBright)
            }
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - صورة خبر

struct NewsImage: View {
    let path: String?
    var alt: String?

    var body: some View {
        Group {
            if let url = CapAPI.imageURL(path) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .accessibilityLabel(alt ?? "")
    }

    private var placeholder: some View {
        ZStack {
            LinearGradient(
                colors: [CapTheme.mint, CapTheme.chip],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 26, weight: .light))
                .foregroundStyle(CapTheme.green.opacity(0.45))
        }
    }
}

// MARK: - بطاقة الخبر البارز

struct FeaturedStoryCard: View {
    let item: NewsItem
    var categoryName: String?

    var body: some View {
        NavigationLink(value: item) {
            VStack(alignment: .leading, spacing: 0) {
                NewsImage(path: item.imageUrl, alt: item.imageAlt)
                    .frame(height: 184)
                    .clipped()
                    .overlay {
                        LinearGradient(
                            colors: [.clear, CapTheme.greenDeep.opacity(0.22)],
                            startPoint: .center,
                            endPoint: .bottom
                        )
                    }
                    .overlay(alignment: .topLeading) {
                        if let categoryName {
                            Text(categoryName)
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(Color(hex: 0xE9F7EF))
                                .padding(.horizontal, 11)
                                .padding(.vertical, 4)
                                .background(CapTheme.greenDeep.opacity(0.82), in: .capsule)
                                .padding(12)
                        }
                    }

                VStack(alignment: .leading, spacing: 8) {
                    Text(item.title)
                        .font(.system(size: 16.5, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                        .lineSpacing(3)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        if let author = item.createdBy {
                            Text(author)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(CapTheme.greenBright)
                            MetaDot()
                        }
                        if let date = item.publishedAt {
                            Text(ArabicText.timeAgo(from: date))
                                .font(.system(size: 12))
                                .foregroundStyle(CapTheme.soft)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(CapTheme.card)
            .clipShape(.rect(cornerRadius: 24))
            .shadow(color: CapTheme.cardShadow, radius: 14, y: 6)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
    }
}

struct MetaDot: View {
    var body: some View {
        Circle()
            .fill(CapTheme.soft.opacity(0.5))
            .frame(width: 3, height: 3)
    }
}

// MARK: - صف خبر مدمج

struct NewsRowCard: View {
    let item: NewsItem
    var categoryName: String?

    var body: some View {
        NavigationLink(value: item) {
            HStack(spacing: 12) {
                NewsImage(path: item.imageUrl, alt: item.imageAlt)
                    .frame(width: 82, height: 82)
                    .clipShape(.rect(cornerRadius: 16))

                VStack(alignment: .leading, spacing: 6) {
                    Text(item.title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                        .lineSpacing(2)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        if let categoryName {
                            Text(categoryName)
                                .font(.system(size: 12))
                                .foregroundStyle(CapTheme.soft)
                        }
                        if let date = item.publishedAt {
                            MetaDot()
                            Text(ArabicText.timeAgo(from: date))
                                .font(.system(size: 12))
                                .foregroundStyle(CapTheme.soft)
                        }
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.left")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(CapTheme.soft.opacity(0.45))
            }
            .padding(11)
            .background(CapTheme.card.opacity(0.94))
            .clipShape(.rect(cornerRadius: 20))
            .shadow(color: CapTheme.cardShadow, radius: 9, y: 4)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
    }
}

// MARK: - بطاقة «اسأل كبسولة»

struct RumorCTACard: View {
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.shield")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(CapTheme.amber)
                    .frame(width: 44, height: 44)
                    .background(CapTheme.amberSoft, in: .rect(cornerRadius: 14))

                VStack(alignment: .leading, spacing: 3) {
                    Text("وصلتك معلومة صحية مشكوك فيها؟")
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                    Text("أرسلها وسيتحقق منها فريق كبسولة بالذكاء الاصطناعي")
                        .font(.system(size: 11.5))
                        .foregroundStyle(CapTheme.soft)
                        .lineLimit(1)
                }

                Spacer(minLength: 8)

                Text("تحقق الآن")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(CapTheme.amber, in: .capsule)
            }
            .padding(15)
            .background {
                LinearGradient(
                    colors: [CapTheme.amberSoft, CapTheme.card],
                    startPoint: .topTrailing,
                    endPoint: .bottomLeading
                )
            }
            .clipShape(.rect(cornerRadius: 24))
            .overlay {
                RoundedRectangle(cornerRadius: 24)
                    .stroke(CapTheme.amber.opacity(0.20), lineWidth: 1)
            }
            .shadow(color: CapTheme.cardShadow, radius: 12, y: 5)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
    }
}
