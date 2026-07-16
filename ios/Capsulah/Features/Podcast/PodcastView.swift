import SwiftUI
import AVFoundation

// ورقة «موجز كبسولة الصوتي» — مشغل الحلقة الأحدث وقائمة الحلقات السابقة

@MainActor
@Observable
final class PodcastPlayerModel {
    private(set) var episodes: [PodcastEpisode] = []
    private(set) var current: PodcastEpisode?
    private(set) var isPlaying = false
    private(set) var isLoading = true
    private(set) var failed = false
    private(set) var progress: Double = 0      // 0...1
    private(set) var elapsed: Double = 0
    private(set) var duration: Double = 0

    private var player: AVPlayer?
    private var timeObserver: Any?

    func load() async {
        guard episodes.isEmpty else { return }
        isLoading = true
        do {
            episodes = try await CapAPI.fetchPodcastEpisodes().filter(\.isPlayable)
            current = episodes.first
            failed = episodes.isEmpty
        } catch {
            failed = true
        }
        isLoading = false
    }

    func toggle(_ episode: PodcastEpisode) {
        if current?.id == episode.id, player != nil {
            isPlaying ? pause() : resume()
            return
        }
        play(episode)
    }

    func togglePlayback() {
        guard let current else { return }
        toggle(current)
    }

    func seek(to fraction: Double) {
        guard let player, duration > 0 else { return }
        let target = CMTime(seconds: fraction * duration, preferredTimescale: 600)
        player.seek(to: target)
        progress = fraction
        elapsed = fraction * duration
    }

    func skip(_ seconds: Double) {
        guard duration > 0 else { return }
        let target = min(max(elapsed + seconds, 0), duration)
        seek(to: target / duration)
    }

    func teardown() {
        if let timeObserver, let player {
            player.removeTimeObserver(timeObserver)
        }
        timeObserver = nil
        player?.pause()
        player = nil
        isPlaying = false
    }

    // MARK: - Internals

    private func play(_ episode: PodcastEpisode) {
        guard let url = episode.audioURL else { return }
        teardown()
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
        try? AVAudioSession.sharedInstance().setActive(true)

        current = episode
        progress = 0
        elapsed = 0
        duration = Double(episode.durationSeconds ?? 0)

        let player = AVPlayer(url: url)
        self.player = player
        timeObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.5, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            Task { @MainActor [weak self] in
                self?.tick(time)
            }
        }
        player.play()
        isPlaying = true
    }

    private func tick(_ time: CMTime) {
        elapsed = time.seconds
        if let itemDuration = player?.currentItem?.duration.seconds,
           itemDuration.isFinite, itemDuration > 0 {
            duration = itemDuration
        }
        progress = duration > 0 ? min(elapsed / duration, 1) : 0
        if duration > 0, elapsed >= duration - 0.5 {
            isPlaying = false
        }
    }

    private func pause() {
        player?.pause()
        isPlaying = false
    }

    private func resume() {
        player?.play()
        isPlaying = true
    }
}

struct PodcastSheet: View {
    @State private var model = PodcastPlayerModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Capsule()
                    .fill(CapTheme.line)
                    .frame(width: 40, height: 5)
                    .padding(.top, 10)

                header

                if model.isLoading {
                    ProgressView()
                        .padding(.vertical, 60)
                } else if model.failed {
                    EmptyStateCard(
                        icon: "waveform.slash",
                        title: "لا توجد حلقات بعد",
                        subtitle: "يصدر موجز كبسولة الصوتي يومياً — عد قريباً"
                    )
                } else {
                    if let current = model.current {
                        playerCard(current)
                    }
                    if model.episodes.count > 1 {
                        episodesList
                    }
                }
            }
            .padding(.bottom, 28)
        }
        .background(CapTheme.paper)
        .scrollIndicators(.hidden)
        .environment(\.layoutDirection, .rightToLeft)
        .task { await model.load() }
        .onDisappear { model.teardown() }
    }

    private var header: some View {
        VStack(spacing: 5) {
            HStack(spacing: 8) {
                CapsulePillGlyph(color: CapTheme.green)
                    .frame(width: 18, height: 9)
                Text("موجز كبسولة الصوتي")
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
            }
            Text("أهم أخبار الصحة في دقائق معدودة")
                .font(.system(size: 12))
                .foregroundStyle(CapTheme.soft)
        }
    }

    private func playerCard(_ episode: PodcastEpisode) -> some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(CapTheme.askGradient)
                    .frame(width: 96, height: 96)
                    .shadow(color: CapTheme.green.opacity(0.3), radius: 16, y: 7)
                Image(systemName: model.isPlaying ? "waveform" : "mic.fill")
                    .font(.system(size: 34, weight: .medium))
                    .foregroundStyle(.white)
                    .contentTransition(.symbolEffect(.replace))
            }
            .padding(.top, 8)

            VStack(spacing: 4) {
                Text(episode.title)
                    .font(.system(size: 16.5, weight: .heavy))
                    .foregroundStyle(CapTheme.ink)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                HStack(spacing: 7) {
                    Text(episode.dateLine)
                    if let duration = episode.durationLine {
                        MetaDot()
                        Text(duration)
                    }
                    if episode.newsCount > 0 {
                        MetaDot()
                        Text("\(ArabicText.digits(episode.newsCount)) أخبار")
                    }
                }
                .font(.system(size: 12))
                .foregroundStyle(CapTheme.soft)
            }
            .padding(.horizontal, 20)

            VStack(spacing: 6) {
                Slider(
                    value: Binding(
                        get: { model.progress },
                        set: { model.seek(to: $0) }
                    )
                )
                .tint(CapTheme.greenBright)

                HStack {
                    Text(timeLabel(model.elapsed))
                    Spacer()
                    Text(timeLabel(model.duration))
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(CapTheme.soft)
                .monospacedDigit()
            }
            .padding(.horizontal, 22)

            HStack(spacing: 34) {
                Button {
                    model.skip(-15)
                } label: {
                    Image(systemName: "gobackward.15")
                        .font(.system(size: 21, weight: .medium))
                        .foregroundStyle(CapTheme.ink)
                }
                .accessibilityLabel("رجوع ١٥ ثانية")

                Button {
                    model.togglePlayback()
                } label: {
                    ZStack {
                        Circle()
                            .fill(CapTheme.askGradient)
                            .frame(width: 64, height: 64)
                            .shadow(color: CapTheme.green.opacity(0.3), radius: 10, y: 5)
                        Image(systemName: model.isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 23, weight: .bold))
                            .foregroundStyle(.white)
                            .contentTransition(.symbolEffect(.replace))
                    }
                }
                .accessibilityLabel(model.isPlaying ? "إيقاف مؤقت" : "تشغيل")

                Button {
                    model.skip(30)
                } label: {
                    Image(systemName: "goforward.30")
                        .font(.system(size: 21, weight: .medium))
                        .foregroundStyle(CapTheme.ink)
                }
                .accessibilityLabel("تقديم ٣٠ ثانية")
            }
            .padding(.bottom, 6)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .background(CapTheme.card, in: .rect(cornerRadius: 26))
        .shadow(color: CapTheme.cardShadow, radius: 14, y: 6)
        .padding(.horizontal, 16)
    }

    private var episodesList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("حلقات سابقة")
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(CapTheme.ink)
                .padding(.horizontal, 20)

            ForEach(model.episodes.dropFirst()) { episode in
                Button {
                    model.toggle(episode)
                } label: {
                    HStack(spacing: 11) {
                        ZStack {
                            Circle()
                                .fill(model.current?.id == episode.id ? AnyShapeStyle(CapTheme.askGradient) : AnyShapeStyle(CapTheme.mint))
                                .frame(width: 40, height: 40)
                            Image(systemName: model.current?.id == episode.id && model.isPlaying ? "pause.fill" : "play.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(model.current?.id == episode.id ? .white : CapTheme.green)
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(episode.title)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(CapTheme.ink)
                                .lineLimit(1)
                            HStack(spacing: 6) {
                                Text(episode.dateLine)
                                if let duration = episode.durationLine {
                                    MetaDot()
                                    Text(duration)
                                }
                            }
                            .font(.system(size: 11))
                            .foregroundStyle(CapTheme.soft)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(11)
                    .background(CapTheme.card.opacity(0.94), in: .rect(cornerRadius: 17))
                    .shadow(color: CapTheme.cardShadow, radius: 6, y: 3)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
            }
        }
        .padding(.top, 6)
    }

    private func timeLabel(_ seconds: Double) -> String {
        guard seconds.isFinite, seconds >= 0 else { return "٠:٠٠" }
        let total = Int(seconds)
        let minutes = total / 60
        let secs = total % 60
        return "\(ArabicText.digits(minutes)):\(secs < 10 ? "٠" : "")\(ArabicText.digits(secs))"
    }
}

#Preview {
    PodcastSheet()
        .environment(\.locale, Locale(identifier: "ar_SA"))
}
