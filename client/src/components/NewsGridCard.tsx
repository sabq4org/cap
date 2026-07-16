import { Link } from "wouter";
import { AlertTriangle, CheckCircle, Clock, ExternalLink, XCircle } from "lucide-react";
import { AIImageBadge } from "@/components/AIImageBadge";
import { Badge } from "@/components/ui/badge";
import { getNewsImage } from "@/lib/newsImages";
import { newsCanonicalPath } from "@shared/seoSignals";
import type { News } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  health: "صحة عامة",
  "health-news": "أخبار صحية",
  "saudi-health": "صحة السعودية",
  "health-community": "المجتمع الصحي",
  "health-reports": "تقارير صحية",
  "health-events": "فعاليات صحية",
  "quality-life": "جودة حياة",
  nutrition: "تغذية",
  debunk: "تفنيد الشائعات",
  misc: "منوعات",
  medical: "أخبار طبية",
  pharmaceutical: "أخبار الأدوية",
  conference: "مؤتمرات طبية",
  awareness: "توعية صحية",
  saudi: "أخبار السعودية",
};

const categoryColors: Record<string, string> = {
  health: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "health-news": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  "saudi-health": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  "health-community": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  "health-reports": "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  "health-events": "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  "quality-life": "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200",
  nutrition: "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200",
  debunk: "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200",
  misc: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
  medical: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  pharmaceutical: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  conference: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  awareness: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
  saudi: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
};

function getVerdict(title: string) {
  if (title.includes("❌")) return { label: "خرافة", icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
  if (title.includes("✅")) return { label: "صحيح", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
  if (title.includes("⚠️")) return { label: "صحيح جزئيًا", icon: AlertTriangle, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
  return null;
}

function cleanDebunkTitle(title: string): string {
  return title.replace(/^تفنيد\s*\|\s*[❌✅⚠️]\s*/, "").trim();
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("ar-EG-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
  });
}

export default function NewsGridCard({ item }: { item: News }) {
  const isDebunk = item.category === "debunk";
  const verdict = isDebunk ? getVerdict(item.title) : null;
  const VerdictIcon = verdict?.icon;
  const displayTitle = isDebunk ? cleanDebunkTitle(item.title) : item.title;
  const href = newsCanonicalPath(item);
  const categoryLabel = categoryLabels[item.category] || item.category || "أخبار";
  const categoryColor = categoryColors[item.category] || "bg-muted text-muted-foreground";

  return (
    <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      <article
        className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md ${
          item.isBreaking ? "border-red-400/60 shadow-red-100 dark:shadow-red-950/20" : "border-border/60"
        }`}
        data-testid={`news-card-${item.id}`}
      >
        <div className="relative overflow-hidden">
          <img
            src={getNewsImage(item, "card")}
            alt={displayTitle}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <AIImageBadge imageUrl={item.imageUrl} size="sm" />
          {item.isBreaking && (
            <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg">
              <AlertTriangle className="h-3 w-3" />
              عاجل
            </span>
          )}
          {isDebunk && verdict && !item.isBreaking && (
            <span
              className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-lg ${verdict.color}`}
              data-testid={`badge-verdict-${item.id}`}
            >
              {VerdictIcon && <VerdictIcon className="h-3 w-3" />}
              {verdict.label}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3" dir="rtl">
          <Badge
            className={`${item.isBreaking ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" : categoryColor} w-fit text-[11px]`}
            data-testid={`badge-category-${item.category}`}
          >
            {item.isBreaking ? "عاجل" : categoryLabel}
          </Badge>
          <h2 className={`line-clamp-2 flex-1 text-sm font-semibold leading-snug ${item.isBreaking ? "text-red-700 dark:text-red-400" : "transition-colors group-hover:text-primary"}`}>
            {displayTitle}
          </h2>
          <div className="mt-auto flex items-center justify-between gap-1 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              {formatDate(item.publishedAt)}
            </span>
            {item.sourceUrl && (
              <ExternalLink
                className="h-3 w-3 shrink-0 text-primary/60"
                aria-label="للخبر مصدر خارجي"
                data-testid={`link-source-${item.id}`}
              />
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
