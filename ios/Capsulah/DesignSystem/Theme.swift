import SwiftUI

// نظام كبسولة البصري — مشتق من هوية capsulah.com (المعتمد في معاينة التصميم)

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }

    /// لون متكيف: قيمة للوضع الفاتح وأخرى للداكن
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Color(hex: dark))
                : UIColor(Color(hex: light))
        })
    }
}

enum CapTheme {
    static let green = Color(light: 0x137C4B, dark: 0x2FAE73)
    static let greenBright = Color(light: 0x1E9960, dark: 0x4CC98A)
    static let greenDeep = Color(hex: 0x0B3B27)
    static let greenDeepTop = Color(hex: 0x0F5A38)

    static let ink = Color(light: 0x12241B, dark: 0xEAF3EE)
    static let soft = Color(light: 0x5B7065, dark: 0x8FA79A)
    static let paper = Color(light: 0xF8FBF9, dark: 0x0C120F)
    static let card = Color(light: 0xFFFFFF, dark: 0x151E19)
    static let line = Color(light: 0xE2ECE6, dark: 0x223028)
    static let mint = Color(light: 0xE9F4EE, dark: 0x17251E)
    static let chip = Color(light: 0xEFF6F1, dark: 0x1A2620)

    static let amber = Color(light: 0xB97F24, dark: 0xD9A54A)
    static let amberSoft = Color(light: 0xFBF3E3, dark: 0x2A2214)
    static let breaking = Color(light: 0xC94F4F, dark: 0xE06B6B)

    /// تدرج بطاقة «كبسولة الصباح»
    static var heroGradient: LinearGradient {
        LinearGradient(
            colors: [greenDeepTop, greenDeep],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// تدرج زر «اسأل» المركزي
    static var askGradient: LinearGradient {
        LinearGradient(
            colors: [Color(hex: 0x1E9960), Color(hex: 0x137C4B)],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

// MARK: - توقيت السعودية

enum SaudiTime {
    static let timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current

    static var calendar: Calendar {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        cal.locale = Locale(identifier: "ar_SA")
        return cal
    }

    static var hourNow: Int {
        calendar.component(.hour, from: Date())
    }

    /// صباحاً من ٤ فجراً حتى ٣ عصراً، وما بعدها مساء
    static var isMorning: Bool { (4..<15).contains(hourNow) }

    static var greeting: String { isMorning ? "صباح النور" : "مساء النور" }
    static var capsuleTitle: String { isMorning ? "كبسولة الصباح" : "كبسولة المساء" }

    static var todayLine: String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.timeZone = timeZone
        formatter.locale = Locale(identifier: "ar_SA")
        formatter.dateFormat = "EEEE d MMMM"
        return formatter.string(from: Date())
    }
}

// MARK: - نصوص عربية

enum ArabicText {
    private static let easternDigits: [Character] = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

    static func digits(_ value: Int) -> String {
        String(String(value).map { ch in
            if let d = ch.wholeNumberValue, ch.isASCII, ch.isNumber {
                return easternDigits[d]
            }
            return ch
        })
    }

    /// "منذ ٢٠ دقيقة" بصيغة عربية سليمة
    static func timeAgo(from date: Date, now: Date = Date()) -> String {
        let seconds = max(0, Int(now.timeIntervalSince(date)))
        let minutes = seconds / 60
        let hours = minutes / 60
        let days = hours / 24

        if minutes < 1 { return "الآن" }
        if minutes < 60 { return "منذ \(unit(minutes, one: "دقيقة", two: "دقيقتين", few: "دقائق", many: "دقيقة"))" }
        if hours < 24 { return "منذ \(unit(hours, one: "ساعة", two: "ساعتين", few: "ساعات", many: "ساعة"))" }
        if days < 30 { return "منذ \(unit(days, one: "يوم", two: "يومين", few: "أيام", many: "يومًا"))" }
        return "منذ \(unit(days / 30, one: "شهر", two: "شهرين", few: "أشهر", many: "شهرًا"))"
    }

    private static func unit(_ n: Int, one: String, two: String, few: String, many: String) -> String {
        switch n {
        case 1: return one
        case 2: return two
        case 3...10: return "\(digits(n)) \(few)"
        default: return "\(digits(n)) \(many)"
        }
    }
}
