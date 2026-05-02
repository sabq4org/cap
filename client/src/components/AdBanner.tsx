import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Advertisement } from "@shared/schema";

interface AdBannerProps {
  position: string;
  className?: string;
}

export function AdBanner({ position, className = "" }: AdBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: ads = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/ads/active", position],
    queryFn: () => fetch(`/api/ads/active/${position}`).then(r => r.json()),
    staleTime: 60_000,
  });

  const currentAd = ads[currentIndex] ?? null;

  useEffect(() => {
    if (ads.length <= 1) return;

    const scheduleNext = () => {
      const interval = (currentAd?.rotationInterval ?? 15) * 1000;
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % ads.length);
          setVisible(true);
          scheduleNext();
        }, 400);
      }, interval);
    };

    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ads, currentIndex, currentAd]);

  useEffect(() => {
    if (ads.length > 0 && currentIndex >= ads.length) {
      setCurrentIndex(0);
    }
  }, [ads, currentIndex]);

  const handleClick = () => {
    if (!currentAd?.linkUrl) return;
    window.open(currentAd.linkUrl, "_blank", "noopener,noreferrer");
  };

  if (!currentAd) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      data-testid={`ad-banner-${position}`}
    >
      <div
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-in-out" }}
      >
        {currentAd.imageUrl ? (
          <a
            href={currentAd.linkUrl || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            data-testid={`ad-link-${currentAd.id}`}
            aria-label={currentAd.title}
            className="block w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title}
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
              data-testid={`ad-image-${currentAd.id}`}
            />
          </a>
        ) : (
          <a
            href={currentAd.linkUrl || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            data-testid={`ad-link-${currentAd.id}`}
            className="block p-4 bg-muted rounded-lg text-center text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            {currentAd.title}
          </a>
        )}
        <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
          إعلان
        </span>
      </div>

      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" data-testid="ad-dots">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setVisible(false);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setVisible(true);
                }, 400);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? "bg-white scale-125" : "bg-white/50"
              }`}
              data-testid={`ad-dot-${i}`}
              aria-label={`إعلان ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdBanner;
