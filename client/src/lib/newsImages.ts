import newsImage1 from "@assets/stock_images/medical_health_healt_fdb22ee1.jpg";
import newsImage2 from "@assets/stock_images/medical_health_healt_2bc2bc37.jpg";
import newsImage3 from "@assets/stock_images/medical_health_healt_af440b4a.jpg";
import newsImage4 from "@assets/stock_images/medical_health_healt_981aee81.jpg";
import newsImage5 from "@assets/stock_images/medical_health_healt_8bccc8a3.jpg";
import newsImage6 from "@assets/stock_images/medical_health_healt_46b1b20f.jpg";
import defaultNewsImage from "@assets/stock_images/healthcare_medical_n_906373b9.jpg";

const newsImages = [newsImage1, newsImage2, newsImage3, newsImage4, newsImage5, newsImage6];

export { defaultNewsImage, newsImages };

export type NewsImageSize = "thumb" | "card" | "hero" | "full";

/** Display widths for /objects/?w=&fm=webp — keeps mobile from downloading 2MB PNGs. */
const SIZE_WIDTH: Record<NewsImageSize, number | null> = {
  thumb: 320,
  card: 720,
  hero: 1200,
  full: null,
};

export function getNewsFallbackImage(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return newsImages[Math.abs(hash) % newsImages.length];
}

function withObjectTransform(url: string, size: NewsImageSize): string {
  if (!url.startsWith("/objects/")) return url;
  const width = SIZE_WIDTH[size];
  if (!width) return url;
  // Path-based variant (not ?query) so Cloudflare doesn't reuse the full-size cache entry.
  const rest = url.replace(/^\/objects\//, "");
  return `/objects/t/${width}/webp/${rest}`;
}

export function getNewsImage(
  item: { id: string; imageUrl?: string | null },
  size: NewsImageSize = "card",
): string {
  const raw = item.imageUrl || getNewsFallbackImage(item.id);
  return withObjectTransform(raw, size);
}
