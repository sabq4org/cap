import SwiftUI

// شاشة تفاصيل الدواء — أقسام طبية مرتبة مع تنبيه استرشادي

struct DrugDetailView: View {
    let drug: Drug
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                header

                if let description = drug.description, !description.isEmpty {
                    Text(description)
                        .font(.system(size: 15))
                        .foregroundStyle(CapTheme.ink.opacity(0.9))
                        .lineSpacing(7)
                        .padding(.horizontal, 20)
                }

                if let dosage = drug.dosage, !dosage.isEmpty {
                    textSection(title: "الجرعة الاعتيادية", icon: "scalemass.fill", tint: CapTheme.green, text: dosage)
                }

                listSection(title: "دواعي الاستخدام", icon: "checkmark.circle.fill", tint: CapTheme.green, items: drug.uses)
                listSection(title: "الآثار الجانبية", icon: "exclamationmark.circle.fill", tint: CapTheme.amber, items: drug.sideEffects)
                listSection(title: "موانع الاستخدام", icon: "hand.raised.fill", tint: CapTheme.breaking, items: drug.contraindications)
                listSection(title: "تحذيرات مهمة", icon: "exclamationmark.triangle.fill", tint: CapTheme.breaking, items: drug.warnings)
                listSection(title: "التداخلات الدوائية", icon: "arrow.triangle.swap", tint: CapTheme.amber, items: drug.interactions)

                if let pregnancy = drug.pregnancy, !pregnancy.isEmpty {
                    textSection(title: "الحمل والرضاعة", icon: "figure.and.child.holdinghands", tint: CapTheme.green, text: pregnancy)
                }
                if let storage = drug.storage, !storage.isEmpty {
                    textSection(title: "التخزين", icon: "thermometer.snowflake", tint: CapTheme.soft, text: storage)
                }

                disclaimer
            }
            .padding(.top, 8)
            .padding(.bottom, 48)
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .topLeading) {
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
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 13) {
                ZStack {
                    RoundedRectangle(cornerRadius: 18)
                        .fill(CapTheme.askGradient)
                        .frame(width: 62, height: 62)
                    Image(systemName: "pill.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(drug.nameAr)
                        .font(.system(size: 23, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                    if let nameEn = drug.nameEn, !nameEn.isEmpty {
                        Text(nameEn)
                            .font(.system(size: 13.5, weight: .medium))
                            .foregroundStyle(CapTheme.soft)
                    }
                }
                Spacer()
            }

            HStack(spacing: 7) {
                if let category = drug.category, !category.isEmpty {
                    chip(category, tint: CapTheme.green)
                }
                if let generic = drug.genericName, !generic.isEmpty, generic != drug.nameEn {
                    chip("المادة الفعالة: \(generic)", tint: CapTheme.soft)
                }
                if drug.aiGenerated {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 9.5))
                        Text("أعدّه الذكاء الاصطناعي")
                    }
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(CapTheme.amber)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(CapTheme.amberSoft, in: .capsule)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 44)
    }

    private func chip(_ text: String, tint: Color) -> some View {
        Text(text)
            .font(.system(size: 10.5, weight: .bold))
            .foregroundStyle(tint)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(tint.opacity(0.1), in: .capsule)
            .lineLimit(1)
    }

    @ViewBuilder
    private func listSection(title: String, icon: String, tint: Color, items: [String]) -> some View {
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionTitle(title, icon: icon, tint: tint)
                VStack(alignment: .leading, spacing: 9) {
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .firstTextBaseline, spacing: 9) {
                            Capsule()
                                .fill(tint.opacity(0.75))
                                .frame(width: 11, height: 5)
                                .offset(y: -2)
                            Text(item)
                                .font(.system(size: 14))
                                .foregroundStyle(CapTheme.ink.opacity(0.9))
                                .lineSpacing(5)
                        }
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(CapTheme.card, in: .rect(cornerRadius: 20))
            .shadow(color: CapTheme.cardShadow, radius: 8, y: 3)
            .padding(.horizontal, 16)
        }
    }

    private func textSection(title: String, icon: String, tint: Color, text: String) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            sectionTitle(title, icon: icon, tint: tint)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(CapTheme.ink.opacity(0.9))
                .lineSpacing(6)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CapTheme.card, in: .rect(cornerRadius: 20))
        .shadow(color: CapTheme.cardShadow, radius: 8, y: 3)
        .padding(.horizontal, 16)
    }

    private func sectionTitle(_ title: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 30, height: 30)
                .background(tint.opacity(0.1), in: .rect(cornerRadius: 10))
            Text(title)
                .font(.system(size: 15.5, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
        }
    }

    private var disclaimer: some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "stethoscope")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(CapTheme.amber)
            Text("هذه المعلومات للتثقيف الصحي ولا تغني عن استشارة الطبيب أو الصيدلي. لا توقف دواءً موصوفاً ولا تعدّل جرعته من تلقاء نفسك.")
                .font(.system(size: 11.5))
                .foregroundStyle(CapTheme.soft)
                .lineSpacing(4)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CapTheme.amberSoft.opacity(0.6), in: .rect(cornerRadius: 16))
        .padding(.horizontal, 16)
        .padding(.top, 4)
    }
}
