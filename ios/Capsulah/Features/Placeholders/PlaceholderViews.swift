import SwiftUI

// شاشات مبدئية للتبويبات القادمة — تُستبدل تباعاً بعد اعتماد كل شاشة

struct PlaceholderScreen: View {
    let title: String
    let subtitle: String
    let icon: String

    var body: some View {
        VStack(spacing: 14) {
            Spacer()
            Image(systemName: icon)
                .font(.system(size: 34, weight: .light))
                .foregroundStyle(CapTheme.green)
                .frame(width: 84, height: 84)
                .background(CapTheme.mint, in: .circle)
            Text(title)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
            Text(subtitle)
                .font(.system(size: 14))
                .foregroundStyle(CapTheme.soft)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Text("قيد البناء — المرحلة التالية")
                .font(.system(size: 11.5, weight: .bold))
                .foregroundStyle(CapTheme.greenBright)
                .padding(.horizontal, 13)
                .padding(.vertical, 6)
                .background(CapTheme.chip, in: .capsule)
            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CapTheme.paper)
    }
}

struct AskCapsulePlaceholder: View {
    var body: some View {
        VStack(spacing: 14) {
            Spacer()
            Image(systemName: "checkmark.shield")
                .font(.system(size: 34, weight: .light))
                .foregroundStyle(CapTheme.amber)
                .frame(width: 84, height: 84)
                .background(CapTheme.amberSoft, in: .circle)
            Text("اسأل كبسولة")
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
            Text("وصلتك شائعة صحية؟ أرسلها هنا وسيصدر فريق كبسولة حكماً موثقاً: خرافة، صحيح جزئياً، أو صحيح")
                .font(.system(size: 14))
                .foregroundStyle(CapTheme.soft)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 40)

            Link(destination: URL(string: "https://capsulah.com/ask-capsule")!) {
                Text("جرّبها الآن على الموقع")
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 22)
                    .padding(.vertical, 11)
                    .background(CapTheme.amber, in: .capsule)
            }
            .padding(.top, 6)

            Text("النسخة الأصيلة داخل التطبيق — المرحلة التالية")
                .font(.system(size: 11.5, weight: .bold))
                .foregroundStyle(CapTheme.greenBright)
                .padding(.horizontal, 13)
                .padding(.vertical, 6)
                .background(CapTheme.chip, in: .capsule)
            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CapTheme.paper)
    }
}
