import { useQuery } from "@tanstack/react-query";
import type { Ad } from "@shared/schema";

interface AdBannerProps {
  position: "above_featured" | "below_featured" | "news_sidebar";
  className?: string;
}

export function AdBanner({ position, className = "" }: AdBannerProps) {
  const { data: ad, isLoading } = useQuery<Ad | null>({
    queryKey: ["/api/ads", position],
    queryFn: async () => {
      const res = await fetch(`/api/ads?position=${position}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !ad) return null;

  return (
    <div className={`relative w-full ${className}`} data-testid={`ad-banner-${position}`}>
      <a
        href={`/api/ads/${ad.id}/click`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={ad.title}
        className="block w-full overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
        data-testid={`ad-link-${position}`}
      >
        <img
          src={ad.imageUrl}
          alt={ad.title}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-cover"
          data-testid={`ad-image-${position}`}
        />
      </a>
      <span
        className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded"
        aria-hidden="true"
      >
        إعلان
      </span>
    </div>
  );
}
