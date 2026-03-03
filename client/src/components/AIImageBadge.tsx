import { Sparkles } from "lucide-react";

export function isAiGeneratedImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return false;
  return imageUrl.includes("/objects/uploads/ai-");
}

interface AIImageBadgeProps {
  imageUrl?: string | null;
  size?: "sm" | "md";
}

export function AIImageBadge({ imageUrl, size = "sm" }: AIImageBadgeProps) {
  if (!isAiGeneratedImage(imageUrl)) return null;

  if (size === "md") {
    return (
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white rounded-full px-3 py-1.5 text-sm font-medium shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-sky-300" />
        <span>مولدة بالذكاء الاصطناعي</span>
        <span className="text-white/60 text-xs">(nano-banana)</span>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/15 backdrop-blur-md border border-white/25 text-white rounded-full px-2 py-1 text-xs font-medium shadow-md">
      <Sparkles className="w-3 h-3 text-sky-300" />
      <span>مولدة بالذكاء الاصطناعي</span>
    </div>
  );
}
