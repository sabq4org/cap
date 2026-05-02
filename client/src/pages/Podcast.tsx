import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Play, Pause, SkipBack, SkipForward, Volume2, Calendar, Newspaper, Clock, Headphones, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { SEO } from "@/components/SEO";
import type { PodcastEpisode } from "@shared/schema";

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  });
}

function statusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">جاهزة</Badge>;
    case "generating":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse">جارٍ التوليد...</Badge>;
    case "pending":
      return <Badge variant="outline">في الانتظار</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">فشل</Badge>;
    default:
      return null;
  }
}

function AudioPlayer({ episode }: { episode: PodcastEpisode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [episode.audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const handleVolume = (value: number[]) => {
    const v = value[0];
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4" data-testid="audio-player">
      <audio ref={audioRef} src={episode.audioUrl || undefined} preload="metadata" />

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-10 text-center" data-testid="text-current-time">
          {formatTime(currentTime)}
        </span>
        <Slider
          min={0}
          max={duration || 100}
          step={1}
          value={[currentTime]}
          onValueChange={seek}
          className="flex-1"
          data-testid="slider-progress"
        />
        <span className="text-xs text-muted-foreground w-10 text-center" data-testid="text-duration">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(-15)}
          data-testid="button-skip-back"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
          onClick={togglePlay}
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(15)}
          data-testid="button-skip-forward"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[volume]}
          onValueChange={handleVolume}
          className="w-24"
          data-testid="slider-volume"
        />
      </div>
    </div>
  );
}

export default function PodcastPage() {
  const [selectedEpisode, setSelectedEpisode] = useState<PodcastEpisode | null>(null);

  const { data: episodes = [], isLoading } = useQuery<PodcastEpisode[]>({
    queryKey: ["/api/podcast/episodes"],
  });

  const readyEpisodes = episodes.filter((e) => e.status === "ready");
  const latestEpisode = selectedEpisode || readyEpisodes[0] || null;

  return (
    <>
      <SEO
        title="الكبسولة الصوتية - البودكاست الصحي اليومي"
        description="استمع إلى أبرز الأخبار الصحية اليومية بصوت طبيعي من الذكاء الاصطناعي في بودكاست كبسولة"
      />
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20" dir="rtl">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg">
              <Headphones className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">الكبسولة الصوتية</h1>
              <p className="text-muted-foreground mt-1">البودكاست الصحي اليومي بصوت الذكاء الاصطناعي</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Latest Episode Player */}
              {latestEpisode ? (
                <Card className="mb-8 border-2 border-emerald-200 dark:border-emerald-800 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="h-5 w-5" />
                      <span className="text-sm font-medium opacity-90">
                        {selectedEpisode ? "الحلقة المختارة" : "أحدث حلقة"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold mb-1" data-testid="text-episode-title">
                      {latestEpisode.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm opacity-80">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(latestEpisode.episodeDate)}
                      </span>
                      {latestEpisode.newsCount && latestEpisode.newsCount > 0 ? (
                        <span className="flex items-center gap-1">
                          <Newspaper className="h-3.5 w-3.5" />
                          {latestEpisode.newsCount} خبر
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {latestEpisode.audioUrl ? (
                      <AudioPlayer key={latestEpisode.id} episode={latestEpisode} />
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
                        <Mic className="h-12 w-12 opacity-30" />
                        <p>
                          {latestEpisode.status === "generating"
                            ? "جارٍ توليد الصوت، يرجى الانتظار..."
                            : "لا يوجد ملف صوتي متاح لهذه الحلقة"}
                        </p>
                        {latestEpisode.status === "generating" && (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-8 p-12 text-center border-dashed">
                  <Mic className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h2 className="text-xl font-semibold text-muted-foreground mb-2">لا توجد حلقات بعد</h2>
                  <p className="text-muted-foreground text-sm">
                    سيُضاف أول بودكاست صحي قريباً. تابعونا!
                  </p>
                </Card>
              )}

              {/* Episodes Archive */}
              {episodes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    أرشيف الحلقات
                  </h3>
                  <div className="space-y-3">
                    {episodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => {
                          if (episode.status === "ready") setSelectedEpisode(episode);
                        }}
                        className={`w-full text-right p-4 rounded-xl border transition-all hover-elevate flex items-center gap-4 ${
                          latestEpisode?.id === episode.id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700"
                        } ${episode.status !== "ready" ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                        data-testid={`card-episode-${episode.id}`}
                        disabled={episode.status !== "ready"}
                      >
                        <div className={`p-2.5 rounded-full shrink-0 ${
                          latestEpisode?.id === episode.id
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {episode.status === "ready" ? (
                            latestEpisode?.id === episode.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )
                          ) : episode.status === "generating" ? (
                            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" data-testid={`text-episode-title-${episode.id}`}>
                            {episode.title}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(episode.episodeDate)}
                            </span>
                            {episode.newsCount && episode.newsCount > 0 ? (
                              <span className="flex items-center gap-1">
                                <Newspaper className="h-3 w-3" />
                                {episode.newsCount} خبر
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div>{statusBadge(episode.status)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
