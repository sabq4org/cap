import SwiftUI

// محوّل HTML خفيف → بلوكات SwiftUI أصلية.
// محتوى كبسولة يأتي من محرر تحريري بسيط (p, strong, em, a, ul/ol, h2/h3,
// blockquote, img) — لا حاجة لـ WebView الثقيل ولا NSAttributedString(html:)
// البطيء؛ التحويل هنا فوري وعلى نفس الـ thread بلا وميض.

enum HTMLBlock: Identifiable, Hashable {
    case paragraph(AttributedString)
    case heading(String)
    case bullet([AttributedString])
    case numbered([AttributedString])
    case quote(AttributedString)
    case image(URL, alt: String?)

    var id: Int { hashValue }
}

enum HTMLContent {
    static func parse(_ html: String) -> [HTMLBlock] {
        var blocks: [HTMLBlock] = []
        // التقط البلوكات بترتيبها الفعلي في النص
        let pattern = #"<(p|h[1-4]|ul|ol|blockquote|img|figure)\b[^>]*>[\s\S]*?(?:</\1>|(?<=/>))|<img\b[^>]*/?>"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return [.paragraph(inline(stripTags(html)))]
        }

        let ns = html as NSString
        let matches = regex.matches(in: html, range: NSRange(location: 0, length: ns.length))

        for match in matches {
            let raw = ns.substring(with: match.range)
            let lower = raw.lowercased()

            if lower.hasPrefix("<img") || lower.hasPrefix("<figure") {
                if let url = extractImageURL(from: raw) {
                    blocks.append(.image(url, alt: extractAttribute("alt", from: raw)))
                }
            } else if lower.hasPrefix("<h") {
                let text = stripTags(raw).trimmingCharacters(in: .whitespacesAndNewlines)
                if !text.isEmpty { blocks.append(.heading(text)) }
            } else if lower.hasPrefix("<ul") || lower.hasPrefix("<ol") {
                let items = listItems(from: raw)
                if !items.isEmpty {
                    blocks.append(lower.hasPrefix("<ol") ? .numbered(items) : .bullet(items))
                }
            } else if lower.hasPrefix("<blockquote") {
                let text = inline(innerHTML(of: raw))
                if !text.characters.isEmpty { blocks.append(.quote(text)) }
            } else { // <p>
                let text = inline(innerHTML(of: raw))
                if !text.characters.isEmpty { blocks.append(.paragraph(text)) }
            }
        }

        // نص بلا وسوم بلوكية إطلاقاً
        if blocks.isEmpty {
            let plain = stripTags(html).trimmingCharacters(in: .whitespacesAndNewlines)
            if !plain.isEmpty { blocks = [.paragraph(inline(plain))] }
        }
        return blocks
    }

    // MARK: - Inline formatting (strong/em/a) عبر تمرير Markdown

    private static func inline(_ html: String) -> AttributedString {
        var text = html
            .replacingOccurrences(of: #"<br\s*/?>"#, with: "\n", options: [.regularExpression, .caseInsensitive])
            // نحيّد رموز ماركداون الموجودة أصلاً في النص قبل أن نولّد رموزنا
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "*", with: "\\*")
            .replacingOccurrences(of: "_", with: "\\_")
            .replacingOccurrences(of: "[", with: "\\[")
        text = text
            .replacingOccurrences(of: #"<(strong|b)\b[^>]*>"#, with: "**", options: [.regularExpression, .caseInsensitive])
            .replacingOccurrences(of: #"</(strong|b)>"#, with: "**", options: [.regularExpression, .caseInsensitive])
            .replacingOccurrences(of: #"<(em|i)\b[^>]*>"#, with: "*", options: [.regularExpression, .caseInsensitive])
            .replacingOccurrences(of: #"</(em|i)>"#, with: "*", options: [.regularExpression, .caseInsensitive])
        // الروابط: <a href="X">Y</a> → [Y](X)
        text = text.replacingOccurrences(
            of: #"<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)</a>"#,
            with: "[$2]($1)",
            options: [.regularExpression, .caseInsensitive]
        )
        text = stripTags(text)
        text = decodeEntities(text).trimmingCharacters(in: .whitespacesAndNewlines)

        if var attributed = try? AttributedString(
            markdown: text,
            options: .init(allowsExtendedAttributes: false, interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            for run in attributed.runs where run.link != nil {
                attributed[run.range].foregroundColor = CapTheme.greenBright
                attributed[run.range].underlineStyle = .single
            }
            return attributed
        }
        return AttributedString(text)
    }

    private static func listItems(from html: String) -> [AttributedString] {
        guard let regex = try? NSRegularExpression(pattern: #"<li\b[^>]*>([\s\S]*?)</li>"#, options: [.caseInsensitive]) else { return [] }
        let ns = html as NSString
        return regex.matches(in: html, range: NSRange(location: 0, length: ns.length)).compactMap { m in
            let item = inline(ns.substring(with: m.range(at: 1)))
            return item.characters.isEmpty ? nil : item
        }
    }

    private static func innerHTML(of block: String) -> String {
        block
            .replacingOccurrences(of: #"^<[^>]+>"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"</[^>]+>$"#, with: "", options: .regularExpression)
    }

    private static func stripTags(_ html: String) -> String {
        html.replacingOccurrences(of: #"<[^>]+>"#, with: "", options: .regularExpression)
    }

    private static func extractImageURL(from tag: String) -> URL? {
        guard let src = extractAttribute("src", from: tag) else { return nil }
        return CapAPI.imageURL(src)
    }

    private static func extractAttribute(_ name: String, from tag: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: "\(name)=\"([^\"]*)\"", options: [.caseInsensitive]),
              let match = regex.firstMatch(in: tag, range: NSRange(location: 0, length: (tag as NSString).length))
        else { return nil }
        let value = (tag as NSString).substring(with: match.range(at: 1))
        return value.isEmpty ? nil : value
    }

    private static func decodeEntities(_ text: String) -> String {
        var t = text
        let map: [String: String] = [
            "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
            "&quot;": "\"", "&#8220;": "\u{201C}", "&#8221;": "\u{201D}",
            "&#8216;": "'", "&#8217;": "'", "&#8230;": "…", "&hellip;": "…",
            "&#8211;": "–", "&#8212;": "—", "&laquo;": "«", "&raquo;": "»",
        ]
        for (entity, char) in map { t = t.replacingOccurrences(of: entity, with: char) }
        t = t.replacingOccurrences(of: #"&#(\d+);"#, with: "", options: .regularExpression)
        return t
    }
}

// MARK: - العرض

struct HTMLBlockView: View {
    let block: HTMLBlock

    var body: some View {
        switch block {
        case .paragraph(let text):
            Text(text)
                .font(.system(size: 17.5))
                .lineSpacing(9)
                .foregroundStyle(CapTheme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                .multilineTextAlignment(.leading)

        case .heading(let text):
            Text(text)
                .font(.system(size: 20, weight: .heavy))
                .lineSpacing(5)
                .foregroundStyle(CapTheme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 6)

        case .bullet(let items), .numbered(let items):
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        if case .numbered = block {
                            Text("\(ArabicText.digits(index + 1)).")
                                .font(.system(size: 16, weight: .heavy))
                                .foregroundStyle(CapTheme.greenBright)
                        } else {
                            Capsule()
                                .fill(CapTheme.greenBright)
                                .frame(width: 12, height: 5)
                                .offset(y: -3)
                        }
                        Text(item)
                            .font(.system(size: 17))
                            .lineSpacing(7)
                            .foregroundStyle(CapTheme.ink)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

        case .quote(let text):
            HStack(alignment: .top, spacing: 12) {
                Capsule()
                    .fill(CapTheme.green)
                    .frame(width: 4)
                Text(text)
                    .font(.system(size: 17, weight: .medium))
                    .lineSpacing(8)
                    .foregroundStyle(CapTheme.ink)
                    .padding(.vertical, 2)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(CapTheme.mint, in: .rect(cornerRadius: 16))

        case .image(let url, let alt):
            VStack(alignment: .leading, spacing: 6) {
                AsyncImage(url: url) { phase in
                    if case .success(let image) = phase {
                        image.resizable().scaledToFit()
                    } else {
                        RoundedRectangle(cornerRadius: 18).fill(CapTheme.mint).frame(height: 180)
                    }
                }
                .clipShape(.rect(cornerRadius: 18))
                if let alt, !alt.isEmpty {
                    Text(alt)
                        .font(.system(size: 12))
                        .foregroundStyle(CapTheme.soft)
                }
            }
        }
    }
}
