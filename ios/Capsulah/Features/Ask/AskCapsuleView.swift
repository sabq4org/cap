import SwiftUI

// تبويب «اسأل كبسولة» — التحقق من الشائعات الصحية

struct AskCapsuleView: View {
    @State private var model = AskCapsuleViewModel()
    @FocusState private var isEditorFocused: Bool
    @State private var selectedRumor: RumorSubmission?
    @State private var historyRef: SavedRumorRef?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                header

                switch model.submitPhase {
                case .idle, .failed:
                    composeCard
                    if case .failed(let message) = model.submitPhase {
                        failureNote(message)
                    }
                case .sending, .analyzing:
                    AnalyzingCard()
                case .done(let rumor):
                    VerdictCard(rumor: rumor) {
                        withAnimation(.smooth(duration: 0.3)) { model.reset() }
                    }
                }

                if !model.history.isEmpty {
                    historySection
                }

                if !model.published.isEmpty {
                    publishedSection
                }
            }
            .padding(.bottom, 84)
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .task { await model.loadPublished() }
        .sheet(item: $selectedRumor) { rumor in
            RumorDetailSheet(rumor: rumor)
        }
        .sheet(item: $historyRef) { ref in
            RumorStatusSheet(reference: ref)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(CapTheme.amberSoft)
                        .frame(width: 46, height: 46)
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 19, weight: .semibold))
                        .foregroundStyle(CapTheme.amber)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("اسأل كبسولة")
                        .font(.system(size: 24, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                    Text("وصلتك معلومة صحية مشكوك فيها؟ تحقق منها هنا")
                        .font(.system(size: 12.5))
                        .foregroundStyle(CapTheme.soft)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 14)
    }

    // MARK: - نموذج الإرسال

    private var composeCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("نص الشائعة أو المعلومة")
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(CapTheme.ink)

            TextEditor(text: $model.rumorText)
                .focused($isEditorFocused)
                .font(.system(size: 14.5))
                .foregroundStyle(CapTheme.ink)
                .scrollContentBackground(.hidden)
                .frame(minHeight: 110)
                .padding(10)
                .background(CapTheme.paper, in: .rect(cornerRadius: 14))
                .overlay {
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(isEditorFocused ? CapTheme.greenBright : CapTheme.line, lineWidth: 1)
                }
                .overlay(alignment: .topLeading) {
                    if model.rumorText.isEmpty {
                        Text("مثال: «شرب الماء الدافئ مع الليمون صباحاً يذيب دهون البطن»")
                            .font(.system(size: 13.5))
                            .foregroundStyle(CapTheme.soft.opacity(0.65))
                            .padding(16)
                            .allowsHitTesting(false)
                    }
                }

            Text("أين وصلتك؟")
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(CapTheme.ink)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(RumorPlatform.allCases) { platform in
                        platformChip(platform)
                    }
                }
            }

            TextField("رابط المصدر (اختياري)", text: $model.sourceUrl)
                .font(.system(size: 13.5))
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(CapTheme.paper, in: .rect(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(CapTheme.line, lineWidth: 1))

            Button {
                isEditorFocused = false
                Task { await model.submit() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 13, weight: .semibold))
                    Text("تحقق الآن")
                        .font(.system(size: 15, weight: .heavy))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(
                    model.canSubmit ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(CapTheme.soft.opacity(0.35)),
                    in: .rect(cornerRadius: 16)
                )
            }
            .disabled(!model.canSubmit)

            Text("يحلل الذكاء الاصطناعي المعلومة استناداً إلى مصادر طبية موثوقة، ويراجع فريق كبسولة الأحكام المنشورة")
                .font(.system(size: 11))
                .foregroundStyle(CapTheme.soft)
                .lineSpacing(3)
        }
        .padding(16)
        .background(CapTheme.card, in: .rect(cornerRadius: 24))
        .shadow(color: CapTheme.cardShadow, radius: 12, y: 5)
        .padding(.horizontal, 16)
    }

    private func platformChip(_ platform: RumorPlatform) -> some View {
        let isOn = model.platform == platform
        return Button {
            model.platform = platform
        } label: {
            Text(platform.titleAr)
                .font(.system(size: 12.5, weight: .bold))
                .foregroundStyle(isOn ? .white : CapTheme.soft)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(isOn ? AnyShapeStyle(CapTheme.amber) : AnyShapeStyle(CapTheme.chip), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }

    private func failureNote(_ message: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 13))
                .foregroundStyle(CapTheme.breaking)
            Text(message)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(CapTheme.ink)
            Spacer(minLength: 0)
        }
        .padding(13)
        .background(CapTheme.breaking.opacity(0.08), in: .rect(cornerRadius: 16))
        .padding(.horizontal, 16)
    }

    // MARK: - استفساراتي

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "استفساراتي", subtitle: "تابع حالة ما أرسلته سابقاً")
            ForEach(model.history) { ref in
                Button {
                    historyRef = ref
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(CapTheme.amber)
                            .frame(width: 36, height: 36)
                            .background(CapTheme.amberSoft, in: .circle)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(ref.text)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(CapTheme.ink)
                                .lineLimit(1)
                            Text(ArabicText.timeAgo(from: ref.date))
                                .font(.system(size: 11.5))
                                .foregroundStyle(CapTheme.soft)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.left")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(CapTheme.soft.opacity(0.45))
                    }
                    .padding(11)
                    .background(CapTheme.card.opacity(0.94), in: .rect(cornerRadius: 18))
                    .shadow(color: CapTheme.cardShadow, radius: 7, y: 3)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .contextMenu {
                    Button(role: .destructive) {
                        model.deleteHistoryItem(ref)
                    } label: {
                        Label("حذف من السجل", systemImage: "trash")
                    }
                }
            }
        }
        .padding(.top, 8)
    }

    // MARK: - أحدث التحققات المنشورة

    private var publishedSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: "أحدث التحققات", subtitle: "شائعات فندها فريق كبسولة")
            ForEach(model.published) { rumor in
                Button {
                    selectedRumor = rumor
                    CapAPI.trackRumorView(id: rumor.id)
                } label: {
                    PublishedRumorRow(rumor: rumor)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
            }
        }
        .padding(.top, 8)
    }
}

// MARK: - حالة التحليل

struct AnalyzingCard: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var spinning = false

    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(CapTheme.mint, lineWidth: 7)
                    .frame(width: 74, height: 74)
                Circle()
                    .trim(from: 0, to: 0.3)
                    .stroke(CapTheme.greenBright, style: .init(lineWidth: 7, lineCap: .round))
                    .frame(width: 74, height: 74)
                    .rotationEffect(.degrees(spinning ? 360 : 0))
                    .animation(reduceMotion ? nil : .linear(duration: 1.1).repeatForever(autoreverses: false), value: spinning)
                Image(systemName: "sparkles")
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(CapTheme.green)
            }
            Text("كبسولة تتحقق الآن…")
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
            Text("نقارن المعلومة بالمصادر الطبية الموثوقة، تستغرق العملية عادة أقل من دقيقة")
                .font(.system(size: 13))
                .foregroundStyle(CapTheme.soft)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 20)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .background(CapTheme.card, in: .rect(cornerRadius: 24))
        .shadow(color: CapTheme.cardShadow, radius: 12, y: 5)
        .padding(.horizontal, 16)
        .onAppear { spinning = true }
        .accessibilityLabel("جارٍ تحليل الشائعة")
    }
}

// MARK: - لغة الأحكام المشتركة

enum VerdictStyle {
    static func color(_ verdict: String) -> Color {
        switch verdict {
        case "خرافة": CapTheme.breaking
        case "صحيح": CapTheme.green
        default: CapTheme.amber
        }
    }

    static func icon(_ verdict: String) -> String {
        switch verdict {
        case "خرافة": "xmark.seal.fill"
        case "صحيح": "checkmark.seal.fill"
        default: "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - بطاقة الحكم

struct VerdictCard: View {
    let rumor: RumorSubmission
    var onNewQuestion: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let response = rumor.aiResponse {
                HStack(spacing: 8) {
                    Image(systemName: VerdictStyle.icon(response.verdict))
                        .font(.system(size: 15, weight: .bold))
                    Text(response.verdict)
                        .font(.system(size: 15, weight: .heavy))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(VerdictStyle.color(response.verdict), in: .capsule)

                Text(rumor.rumorText)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(CapTheme.soft)
                    .lineSpacing(4)
                    .padding(13)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(CapTheme.chip, in: .rect(cornerRadius: 14))

                if let summary = response.shortSummary, !summary.isEmpty {
                    Text(summary)
                        .font(.system(size: 15.5, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                        .lineSpacing(5)
                }

                Text(response.explanation)
                    .font(.system(size: 14.5))
                    .foregroundStyle(CapTheme.ink.opacity(0.88))
                    .lineSpacing(7)

                if let sources = response.sources, !sources.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("المصادر")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(CapTheme.ink)
                        ForEach(sources, id: \.self) { source in
                            if let url = URL(string: source.url) {
                                Link(destination: url) {
                                    HStack(spacing: 7) {
                                        Image(systemName: "link")
                                            .font(.system(size: 10.5, weight: .semibold))
                                        Text(source.title)
                                            .font(.system(size: 12.5, weight: .medium))
                                            .lineLimit(1)
                                    }
                                    .foregroundStyle(CapTheme.greenBright)
                                }
                            }
                        }
                    }
                    .padding(.top, 2)
                }
            }

            Button(action: onNewQuestion) {
                Text("استفسار جديد")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(CapTheme.askGradient, in: .rect(cornerRadius: 16))
            }
            .padding(.top, 4)

            Text("هذا التحليل استرشادي ولا يغني عن استشارة الطبيب")
                .font(.system(size: 10.5))
                .foregroundStyle(CapTheme.soft)
                .frame(maxWidth: .infinity)
        }
        .padding(16)
        .background(CapTheme.card, in: .rect(cornerRadius: 24))
        .shadow(color: CapTheme.cardShadow, radius: 12, y: 5)
        .padding(.horizontal, 16)
    }
}

// MARK: - صف تحقق منشور

struct PublishedRumorRow: View {
    let rumor: RumorSubmission

    var body: some View {
        HStack(spacing: 11) {
            if let response = rumor.aiResponse {
                Image(systemName: VerdictStyle.icon(response.verdict))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(VerdictStyle.color(response.verdict))
                    .frame(width: 40, height: 40)
                    .background(VerdictStyle.color(response.verdict).opacity(0.12), in: .circle)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(rumor.rumorText)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(CapTheme.ink)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                if let verdict = rumor.aiResponse?.verdict {
                    Text(verdict)
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(VerdictStyle.color(verdict))
                }
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.left")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(CapTheme.soft.opacity(0.45))
        }
        .padding(12)
        .background(CapTheme.card.opacity(0.94), in: .rect(cornerRadius: 18))
        .shadow(color: CapTheme.cardShadow, radius: 7, y: 3)
    }
}

// MARK: - تفاصيل تحقق منشور

struct RumorDetailSheet: View {
    let rumor: RumorSubmission
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let response = rumor.aiResponse {
                    HStack(spacing: 8) {
                        Image(systemName: VerdictStyle.icon(response.verdict))
                            .font(.system(size: 15, weight: .bold))
                        Text(response.verdict)
                            .font(.system(size: 15, weight: .heavy))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(VerdictStyle.color(response.verdict), in: .capsule)

                    Text(rumor.rumorText)
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(CapTheme.soft)
                        .lineSpacing(5)
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(CapTheme.chip, in: .rect(cornerRadius: 16))

                    if let summary = response.shortSummary, !summary.isEmpty {
                        Text(summary)
                            .font(.system(size: 16.5, weight: .heavy))
                            .foregroundStyle(CapTheme.ink)
                            .lineSpacing(5)
                    }

                    Text(response.explanation)
                        .font(.system(size: 15))
                        .foregroundStyle(CapTheme.ink.opacity(0.9))
                        .lineSpacing(8)

                    if let sources = response.sources, !sources.isEmpty {
                        VStack(alignment: .leading, spacing: 9) {
                            Text("المصادر")
                                .font(.system(size: 14, weight: .heavy))
                                .foregroundStyle(CapTheme.ink)
                            ForEach(sources, id: \.self) { source in
                                if let url = URL(string: source.url) {
                                    Link(destination: url) {
                                        HStack(spacing: 8) {
                                            Image(systemName: "link")
                                                .font(.system(size: 11, weight: .semibold))
                                            Text(source.title)
                                                .font(.system(size: 13, weight: .medium))
                                                .multilineTextAlignment(.leading)
                                        }
                                        .foregroundStyle(CapTheme.greenBright)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding(20)
            .padding(.top, 8)
        }
        .background(CapTheme.paper)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .environment(\.layoutDirection, .rightToLeft)
    }
}

// MARK: - حالة استفسار من السجل

struct RumorStatusSheet: View {
    let reference: SavedRumorRef
    @State private var rumor: RumorSubmission?
    @State private var failed = false

    var body: some View {
        Group {
            if let rumor, rumor.hasVerdict {
                RumorDetailSheet(rumor: rumor)
            } else {
                VStack(spacing: 14) {
                    if failed {
                        Image(systemName: "wifi.slash")
                            .font(.system(size: 26, weight: .light))
                            .foregroundStyle(CapTheme.soft)
                        Text("تعذر جلب الحالة")
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundStyle(CapTheme.ink)
                    } else if rumor != nil {
                        Image(systemName: "hourglass")
                            .font(.system(size: 26, weight: .light))
                            .foregroundStyle(CapTheme.amber)
                        Text("لا يزال قيد التحليل")
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundStyle(CapTheme.ink)
                        Text("عد لاحقاً لمعرفة النتيجة")
                            .font(.system(size: 12.5))
                            .foregroundStyle(CapTheme.soft)
                    } else {
                        ProgressView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(CapTheme.paper)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
                .environment(\.layoutDirection, .rightToLeft)
            }
        }
        .task {
            do {
                rumor = try await CapAPI.fetchRumor(id: reference.id)
            } catch {
                failed = true
            }
        }
    }
}

#Preview {
    AskCapsuleView()
        .environment(\.layoutDirection, .rightToLeft)
        .environment(\.locale, Locale(identifier: "ar_SA"))
}
