import SwiftUI

// تبويب «حسابي» — الدخول، الكبسولة المخصصة، والإعدادات

struct ProfileView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                switch session.state {
                case .unknown:
                    ProgressView()
                        .padding(.vertical, 80)
                case .signedOut:
                    AuthCard()
                    aboutSection
                case .signedIn(let profile):
                    SignedInHeader(profile: profile)
                    InterestsCard()
                    CapsuleFeedSection()
                    aboutSection
                    logoutButton
                }
            }
            .padding(.bottom, 84)
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .task { await session.bootstrap() }
    }

    private var aboutSection: some View {
        VStack(spacing: 0) {
            ShareLink(item: URL(string: "https://capsulah.com")!) {
                rowLabel(icon: "square.and.arrow.up", title: "شارك تطبيق كبسولة")
            }
            .buttonStyle(.plain)
            divider
            Link(destination: URL(string: "https://capsulah.com")!) {
                rowLabel(icon: "safari", title: "موقع كبسولة")
            }
            .buttonStyle(.plain)
            divider
            HStack(spacing: 11) {
                Image(systemName: "capsule.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(CapTheme.green)
                    .frame(width: 34, height: 34)
                    .background(CapTheme.mint, in: .rect(cornerRadius: 11))
                VStack(alignment: .leading, spacing: 2) {
                    Text("كبسولة — بوابتك الصحية الموثوقة")
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(CapTheme.ink)
                    Text("الإصدار \(appVersion)")
                        .font(.system(size: 11.5))
                        .foregroundStyle(CapTheme.soft)
                }
                Spacer()
            }
            .padding(14)
        }
        .background(CapTheme.card, in: .rect(cornerRadius: 22))
        .shadow(color: CapTheme.cardShadow, radius: 10, y: 4)
        .padding(.horizontal, 16)
    }

    private func rowLabel(icon: String, title: String) -> some View {
        HStack(spacing: 11) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(CapTheme.green)
                .frame(width: 34, height: 34)
                .background(CapTheme.mint, in: .rect(cornerRadius: 11))
            Text(title)
                .font(.system(size: 13.5, weight: .bold))
                .foregroundStyle(CapTheme.ink)
            Spacer()
            Image(systemName: "chevron.left")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(CapTheme.soft.opacity(0.45))
        }
        .padding(14)
        .contentShape(.rect)
    }

    private var divider: some View {
        Rectangle()
            .fill(CapTheme.line)
            .frame(height: 0.5)
            .padding(.horizontal, 14)
    }

    private var logoutButton: some View {
        Button {
            Task { await session.logout() }
        } label: {
            HStack(spacing: 8) {
                if session.isBusy {
                    ProgressView().controlSize(.small)
                } else {
                    Image(systemName: "rectangle.portrait.and.arrow.forward")
                        .font(.system(size: 13, weight: .semibold))
                }
                Text("تسجيل الخروج")
                    .font(.system(size: 14, weight: .heavy))
            }
            .foregroundStyle(CapTheme.breaking)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(CapTheme.breaking.opacity(0.08), in: .rect(cornerRadius: 16))
        }
        .disabled(session.isBusy)
        .padding(.horizontal, 16)
    }

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
}

// MARK: - ترويسة المستخدم المسجل

private struct SignedInHeader: View {
    let profile: UserProfile

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [CapTheme.greenBright, CapTheme.greenDeep],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 76, height: 76)
                Text(profile.initial)
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(.white)
            }
            .overlay(Circle().stroke(.white.opacity(0.7), lineWidth: 3))
            .shadow(color: CapTheme.green.opacity(0.22), radius: 12, y: 5)

            VStack(spacing: 3) {
                Text(profile.displayName)
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                if let email = profile.email {
                    Text(email)
                        .font(.system(size: 12.5))
                        .foregroundStyle(CapTheme.soft)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 26)
    }
}

// MARK: - بطاقة الدخول / التسجيل

private struct AuthCard: View {
    @Environment(SessionStore.self) private var session

    enum Mode: Hashable {
        case login, register
    }

    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var firstName = ""
    @State private var lastName = ""

    private var canSubmit: Bool {
        let emailOk = email.contains("@") && email.contains(".")
        let passwordOk = password.count >= 6
        let nameOk = mode == .login || firstName.trimmingCharacters(in: .whitespaces).count >= 2
        return emailOk && passwordOk && nameOk && !session.isBusy
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 5) {
                Text("كبسولتك المخصصة")
                    .font(.system(size: 21, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                Text("سجل دخولك لتصلك خلاصة مخصصة حسب اهتماماتك الصحية")
                    .font(.system(size: 12.5))
                    .foregroundStyle(CapTheme.soft)
                    .lineSpacing(3)
            }

            HStack(spacing: 6) {
                modeButton(.login, title: "تسجيل الدخول")
                modeButton(.register, title: "حساب جديد")
            }
            .padding(4)
            .background(CapTheme.chip, in: .capsule)

            if mode == .register {
                HStack(spacing: 9) {
                    field("الاسم الأول", text: $firstName)
                    field("العائلة (اختياري)", text: $lastName)
                }
            }

            field("البريد الإلكتروني", text: $email)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textContentType(.emailAddress)

            SecureField("كلمة المرور (٦ أحرف فأكثر)", text: $password)
                .font(.system(size: 14))
                .textContentType(mode == .login ? .password : .newPassword)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(CapTheme.paper, in: .rect(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(CapTheme.line, lineWidth: 1))

            if let error = session.authError {
                HStack(spacing: 7) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(CapTheme.breaking)
                    Text(error)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(CapTheme.ink)
                }
            }

            Button {
                Task {
                    if mode == .login {
                        await session.login(email: email, password: password)
                    } else {
                        await session.register(
                            email: email,
                            password: password,
                            firstName: firstName.trimmingCharacters(in: .whitespaces),
                            lastName: lastName.trimmingCharacters(in: .whitespaces)
                        )
                    }
                }
            } label: {
                Group {
                    if session.isBusy {
                        ProgressView().tint(.white)
                    } else {
                        Text(mode == .login ? "دخول" : "إنشاء الحساب")
                            .font(.system(size: 15, weight: .heavy))
                    }
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(
                    canSubmit ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(CapTheme.soft.opacity(0.35)),
                    in: .rect(cornerRadius: 16)
                )
            }
            .disabled(!canSubmit)
        }
        .padding(18)
        .background(CapTheme.card, in: .rect(cornerRadius: 24))
        .shadow(color: CapTheme.cardShadow, radius: 12, y: 5)
        .padding(.horizontal, 16)
        .padding(.top, 14)
    }

    private func modeButton(_ target: Mode, title: String) -> some View {
        let isOn = mode == target
        return Button {
            withAnimation(.smooth(duration: 0.22)) { mode = target }
        } label: {
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(isOn ? .white : CapTheme.soft)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(isOn ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(.clear), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }

    private func field(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .font(.system(size: 14))
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(CapTheme.paper, in: .rect(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(CapTheme.line, lineWidth: 1))
    }
}

// MARK: - اهتمامات الكبسولة

private struct InterestsCard: View {
    @Environment(SessionStore.self) private var session
    @State private var categories: [NewsCategory] = []

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(CapTheme.green)
                    .frame(width: 32, height: 32)
                    .background(CapTheme.mint, in: .rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 1) {
                    Text("اهتماماتي")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(CapTheme.ink)
                    Text("اختر الأقسام التي تهمك لتُبنى عليها كبسولتك")
                        .font(.system(size: 11.5))
                        .foregroundStyle(CapTheme.soft)
                }
            }

            if categories.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            } else {
                FlowLayout(spacing: 8) {
                    ForEach(categories) { category in
                        interestChip(category)
                    }
                }
            }
        }
        .padding(16)
        .background(CapTheme.card, in: .rect(cornerRadius: 22))
        .shadow(color: CapTheme.cardShadow, radius: 10, y: 4)
        .padding(.horizontal, 16)
        .task {
            guard categories.isEmpty else { return }
            let cats = (try? await CapAPI.fetchCategories()) ?? NewsCategory.samples
            categories = cats
                .filter { $0.isActive ?? true }
                .sorted { ($0.sortOrder ?? 99) < ($1.sortOrder ?? 99) }
        }
    }

    private func interestChip(_ category: NewsCategory) -> some View {
        let isOn = session.interests.contains(category.slug)
        return Button {
            var updated = session.interests
            if isOn {
                updated.removeAll { $0 == category.slug }
            } else {
                updated.append(category.slug)
            }
            Task { await session.updateInterests(updated) }
        } label: {
            HStack(spacing: 5) {
                if isOn {
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .heavy))
                }
                Text(category.nameAr)
                    .font(.system(size: 12.5, weight: .bold))
            }
            .foregroundStyle(isOn ? .white : CapTheme.soft)
            .padding(.horizontal, 13)
            .padding(.vertical, 8)
            .background(isOn ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(CapTheme.chip), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

// MARK: - الخلاصة المخصصة

private struct CapsuleFeedSection: View {
    @Environment(SessionStore.self) private var session
    @State private var items: [CapsuleFeedItem] = []
    @State private var isLoading = false
    @State private var loadedForInterests: [String] = []

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(
                title: "كبسولتك",
                subtitle: session.interests.isEmpty ? "اختر اهتماماً واحداً على الأقل لتبدأ" : "خلاصة مبنية على اهتماماتك"
            )

            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 22)
            } else if session.interests.isEmpty {
                EmptyStateCard(
                    icon: "wand.and.stars",
                    title: "كبسولتك بانتظارك",
                    subtitle: "حدد اهتماماتك في الأعلى وستمتلئ هذه المساحة بما يهمك"
                )
            } else if items.isEmpty {
                EmptyStateCard(
                    icon: "tray",
                    title: "لا جديد حالياً",
                    subtitle: "سيظهر هنا كل جديد يطابق اهتماماتك"
                )
            } else {
                ForEach(items) { entry in
                    switch entry {
                    case .news(let item):
                        NewsRowCard(item: item)
                    case .article(let article):
                        ArticleRowCard(article: article)
                    }
                }
            }
        }
        .padding(.top, 6)
        .task(id: session.interests) { await loadIfNeeded() }
    }

    private func loadIfNeeded() async {
        guard !session.interests.isEmpty else {
            items = []
            return
        }
        guard session.interests != loadedForInterests else { return }
        isLoading = true
        defer { isLoading = false }
        if let feed = try? await CapAPI.fetchCapsuleFeed(perPage: 10) {
            items = feed.items
            loadedForInterests = session.interests
        }
    }
}
