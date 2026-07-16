import SwiftUI

// تبويب «دليل الأدوية» — بحث، الأكثر بحثاً، وتوليد بالذكاء الاصطناعي

struct DrugsView: View {
    @State private var model = DrugsViewModel()
    @FocusState private var searchFocused: Bool

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 14) {
                header
                searchField

                if model.isQueryActive {
                    searchResults
                } else {
                    popularSection
                }

                disclaimer
            }
            .padding(.bottom, 84)
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .task { await model.load() }
        .refreshable { await model.reload() }
        .navigationDestination(item: $model.generatedDrug) { drug in
            DrugDetailView(drug: drug)
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(CapTheme.mint)
                    .frame(width: 46, height: 46)
                Image(systemName: "pills.fill")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(CapTheme.green)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("دليل الأدوية")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                Text("الاستخدام، الجرعات، التحذيرات، والتداخلات")
                    .font(.system(size: 12.5))
                    .foregroundStyle(CapTheme.soft)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 14)
    }

    private var searchField: some View {
        HStack(spacing: 9) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(CapTheme.soft)
            TextField("اكتب اسم الدواء بالعربية أو الإنجليزية…", text: $model.searchText)
                .focused($searchFocused)
                .font(.system(size: 14.5))
                .foregroundStyle(CapTheme.ink)
                .submitLabel(.search)
                .autocorrectionDisabled()
            if model.isSearching {
                ProgressView().controlSize(.small)
            } else if !model.searchText.isEmpty {
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
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(searchFocused ? CapTheme.greenBright : CapTheme.line, lineWidth: 1)
        }
        .padding(.horizontal, 16)
    }

    // MARK: - نتائج البحث

    @ViewBuilder
    private var searchResults: some View {
        if model.isGenerating {
            generatingCard
        } else if let error = model.generationError {
            VStack(spacing: 10) {
                Text(error)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(CapTheme.ink)
                    .multilineTextAlignment(.center)
                Button("إعادة المحاولة") {
                    Task { await model.generateCurrent() }
                }
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(CapTheme.greenBright)
            }
            .frame(maxWidth: .infinity)
            .padding(18)
            .background(CapTheme.card, in: .rect(cornerRadius: 20))
            .padding(.horizontal, 16)
        } else if model.showGenerateOffer {
            generateOfferCard
        } else {
            ForEach(model.results) { drug in
                DrugRowCard(drug: drug)
            }
        }
    }

    private var generateOfferCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 24, weight: .medium))
                .foregroundStyle(CapTheme.green)
                .frame(width: 58, height: 58)
                .background(CapTheme.mint, in: .circle)
            Text("«\(model.trimmedQuery)» غير موجود في الدليل بعد")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
                .multilineTextAlignment(.center)
            Text("يمكن لكبسولة تجهيز صفحته الآن بالذكاء الاصطناعي من مصادر دوائية موثوقة")
                .font(.system(size: 12.5))
                .foregroundStyle(CapTheme.soft)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
            Button {
                Task { await model.generateCurrent() }
            } label: {
                HStack(spacing: 7) {
                    Image(systemName: "wand.and.stars")
                        .font(.system(size: 13, weight: .semibold))
                    Text("جهّز المعلومات")
                        .font(.system(size: 14, weight: .heavy))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 22)
                .padding(.vertical, 11)
                .background(CapTheme.askGradient, in: .capsule)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 26)
        .padding(.horizontal, 18)
        .background(CapTheme.card, in: .rect(cornerRadius: 22))
        .shadow(color: CapTheme.cardShadow, radius: 10, y: 4)
        .padding(.horizontal, 16)
    }

    private var generatingCard: some View {
        VStack(spacing: 14) {
            ProgressView()
                .controlSize(.large)
                .tint(CapTheme.green)
            Text("نجهّز صفحة «\(model.trimmedQuery)»…")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
            Text("ثوانٍ قليلة — نجمع المعلومات ونرتبها لك")
                .font(.system(size: 12.5))
                .foregroundStyle(CapTheme.soft)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 34)
        .background(CapTheme.card, in: .rect(cornerRadius: 22))
        .padding(.horizontal, 16)
        .accessibilityLabel("جارٍ توليد معلومات الدواء")
    }

    // MARK: - الأكثر بحثاً

    @ViewBuilder
    private var popularSection: some View {
        switch model.phase {
        case .loading:
            VStack(spacing: 12) {
                ForEach(0..<5, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 18)
                        .fill(CapTheme.mint)
                        .frame(height: 76)
                        .padding(.horizontal, 16)
                }
            }
            .redacted(reason: .placeholder)
            .accessibilityLabel("جارٍ التحميل")
        case .failed:
            ErrorStateCard { Task { await model.reload() } }
        case .ready:
            if model.popular.isEmpty {
                EmptyStateCard(
                    icon: "pills",
                    title: "الدليل يكبر تدريجياً",
                    subtitle: "ابحث عن أي دواء وسنجهّز صفحته فوراً"
                )
            } else {
                SectionHeader(title: "الأكثر بحثاً", subtitle: "أدوية يسأل عنها القراء كثيراً")
                    .padding(.top, 4)
                ForEach(model.popular) { drug in
                    DrugRowCard(drug: drug)
                }
            }
        }
    }

    private var disclaimer: some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "stethoscope")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(CapTheme.amber)
            Text("المعلومات الدوائية هنا للتثقيف الصحي فقط ولا تغني عن استشارة الطبيب أو الصيدلي")
                .font(.system(size: 11.5))
                .foregroundStyle(CapTheme.soft)
                .lineSpacing(3)
        }
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CapTheme.amberSoft.opacity(0.6), in: .rect(cornerRadius: 16))
        .padding(.horizontal, 16)
        .padding(.top, 6)
    }
}

// MARK: - صف دواء

struct DrugRowCard: View {
    let drug: Drug

    var body: some View {
        NavigationLink(value: drug) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(CapTheme.mint)
                        .frame(width: 46, height: 46)
                    Image(systemName: "pill.fill")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(CapTheme.green)
                }
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 7) {
                        Text(drug.nameAr)
                            .font(.system(size: 14.5, weight: .heavy))
                            .foregroundStyle(CapTheme.ink)
                            .lineLimit(1)
                        if let nameEn = drug.nameEn, !nameEn.isEmpty {
                            Text(nameEn)
                                .font(.system(size: 11.5, weight: .medium))
                                .foregroundStyle(CapTheme.soft)
                                .lineLimit(1)
                        }
                    }
                    HStack(spacing: 7) {
                        if let category = drug.category, !category.isEmpty {
                            Text(category)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(CapTheme.greenBright)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(CapTheme.chip, in: .capsule)
                        }
                        if !drug.uses.isEmpty {
                            Text(drug.uses[0])
                                .font(.system(size: 11.5))
                                .foregroundStyle(CapTheme.soft)
                                .lineLimit(1)
                        }
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.left")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(CapTheme.soft.opacity(0.45))
            }
            .padding(12)
            .background(CapTheme.card.opacity(0.94), in: .rect(cornerRadius: 18))
            .shadow(color: CapTheme.cardShadow, radius: 8, y: 3)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
    }
}

#Preview {
    NavigationStack {
        DrugsView()
    }
    .environment(\.layoutDirection, .rightToLeft)
    .environment(\.locale, Locale(identifier: "ar_SA"))
}
