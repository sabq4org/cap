import { useQuery } from "@tanstack/react-query";
import type { Ad } from "@shared/schema";

interface Props {
  position: "above_featured" | "below_featured" | "news_sidebar";
  className?: string;
}

export default function AdBanner({ position, className = "" }: Props) {
  const { data: ad } = useQuery<Ad | null>({
    queryKey: ["/api/ads", position],
    queryFn: async () => {
      const res = await fetch(`/api/ads?position=${position}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  if (!ad) return null;

  return (
    <div className={`relative ${className}`} data-testid={`ad-banner-${position}`}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        data-testid={`ad-link-${position}`}
      >
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </a>
      <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
        إعلان
      </span>
    </div>
  );
}
