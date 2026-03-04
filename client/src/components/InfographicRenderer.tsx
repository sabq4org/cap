import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileImage, Download } from "lucide-react";
import {
  Heart, Activity, Brain, Shield, Leaf, Droplet, Thermometer, Zap, Target, Award,
  TrendingUp, Users, Clock, Calendar, CheckCircle, AlertTriangle, Star, Percent,
  Pill, Eye, Apple, Dna, Microscope, Syringe, LucideIcon,
  Circle,
} from "lucide-react";

export interface InfographicData {
  title: string;
  subtitle?: string;
  bulletPoints?: { icon: string; text: string; highlight?: string }[];
  conclusion?: string;
  visualDesign?: {
    primaryColor: string;
    secondaryColor: string;
    style?: string;
    layout?: string;
  };
  dataVisualization?: { hasStatistics?: boolean };
  // legacy compat
  template?: string;
  stats?: { value: string; label: string }[];
  points?: string[];
}

// ── Icon registry ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart, activity: Activity, brain: Brain, shield: Shield,
  leaf: Leaf, droplet: Droplet, thermometer: Thermometer, zap: Zap,
  target: Target, award: Award, "trending-up": TrendingUp, users: Users,
  clock: Clock, calendar: Calendar, "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle, star: Star, percent: Percent,
  pill: Pill, eye: Eye, apple: Apple, dna: Dna, microscope: Microscope,
  syringe: Syringe,
  // aliases
  "chart-line": TrendingUp, check: CheckCircle, warning: AlertTriangle,
  lungs: Activity, bone: Shield, stethoscope: Heart,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name?.toLowerCase()] || Circle;
}

// ── Color helpers ──────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgba(hex: string, a: number) {
  try { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  catch { return `rgba(0,0,0,${a})`; }
}
function darken(hex: string, pct = 0.2) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const f = 1 - pct;
    return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
  } catch { return hex; }
}

const BRAND = "كبسولة · منصة الصحة الذكية";

// ── Fallback colors if AI doesn't provide ─────────────────────────────────
const DEFAULT_PRIMARY = "#059669";
const DEFAULT_SECONDARY = "#10b981";

// ── VERTICAL TEMPLATE (800 × 1050) ────────────────────────────────────────
// Best for: 5-7 bullet points, tips-style content
function VerticalCard({ data, primary, secondary }: { data: InfographicData; primary: string; secondary: string }) {
  const points = (data.bulletPoints || []).slice(0, 7);
  const darkBg = darken(primary, 0.45);
  const midBg  = darken(primary, 0.25);

  return (
    <div style={{
      width: 800, height: 1050,
      background: "#f8fafc",
      fontFamily: "'Segoe UI','Arial','Tahoma',sans-serif",
      direction: "rtl", display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
    }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${darkBg} 0%, ${midBg} 60%, ${primary} 100%)`,
        padding: "38px 44px 28px", flexShrink: 0, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, left: -40, width: 200, height: 200, borderRadius: "50%", background: rgba(secondary, 0.12) }} />
        <div style={{ position: "absolute", bottom: -70, right: -30, width: 220, height: 220, borderRadius: "50%", background: rgba("#fff", 0.04) }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, position: "relative" }}>
          <div style={{ width: 4, height: 24, background: secondary, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: rgba(secondary, 0.9), letterSpacing: 2.5, fontWeight: 600 }}>إنفوجرافيك</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1.25, position: "relative" }}>
          {data.title}
        </h1>
        {data.subtitle && (
          <p style={{ margin: "10px 0 0", fontSize: 17, color: rgba("#fff", 0.68), lineHeight: 1.5, position: "relative" }}>
            {data.subtitle}
          </p>
        )}
        {/* wave bottom */}
        <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 28,
          background: "#f8fafc", borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />
      </div>

      {/* POINTS LIST */}
      <div style={{ flex: 1, padding: "20px 28px 0", display: "flex", flexDirection: "column", gap: 11, overflow: "hidden" }}>
        {points.map((pt, i) => {
          const Icon = getIcon(pt.icon);
          const isEven = i % 2 === 0;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 0,
              background: isEven ? "#fff" : rgba(primary, 0.04),
              border: `1.5px solid ${rgba(primary, 0.12)}`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              {/* color tab + icon */}
              <div style={{
                minWidth: 58, alignSelf: "stretch",
                background: `linear-gradient(180deg, ${primary}, ${secondary})`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <Icon size={22} color="#fff" />
                <span style={{ fontSize: 11, fontWeight: 700, color: rgba("#fff", 0.7) }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* text */}
              <p style={{ margin: 0, fontSize: 18, color: "#1f2937", lineHeight: 1.5, padding: "13px 16px", flex: 1, fontWeight: 500 }}>
                {pt.text}
              </p>

              {/* highlight badge */}
              {pt.highlight && (
                <div style={{
                  marginLeft: 10, marginRight: 12, minWidth: 62, padding: "6px 10px",
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  borderRadius: 10, textAlign: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{pt.highlight}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin: "12px 28px 0", padding: "13px 18px",
          background: `linear-gradient(90deg, ${darkBg}, ${midBg})`,
          borderRadius: 14, fontSize: 16, color: "#fff",
          textAlign: "center", lineHeight: 1.5, flexShrink: 0,
        }}>
          <span style={{ color: secondary, marginLeft: 6 }}>◈</span>
          {data.conclusion}
          <span style={{ color: secondary, marginRight: 6 }}>◈</span>
        </div>
      )}

      {/* BRAND */}
      <div style={{ padding: "10px 0 14px", textAlign: "center", fontSize: 12, color: "#9ca3af", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ height: 1, width: 60, background: "#e5e7eb" }} />
        {BRAND}
        <div style={{ height: 1, width: 60, background: "#e5e7eb" }} />
      </div>
    </div>
  );
}

// ── GRID TEMPLATE (1080 × 1080) ────────────────────────────────────────────
// Best for: 4-6 points with highlights/stats, square social media format
function GridCard({ data, primary, secondary }: { data: InfographicData; primary: string; secondary: string }) {
  const points = (data.bulletPoints || []).slice(0, 6);
  const darkBg = darken(primary, 0.5);
  const midBg  = darken(primary, 0.3);
  const COLS   = points.length <= 4 ? 2 : 2;
  const hasHighlights = points.some(p => p.highlight);

  return (
    <div style={{
      width: 1080, height: 1080,
      background: `linear-gradient(155deg, ${darkBg} 0%, ${midBg} 55%, ${darken(primary, 0.15)} 100%)`,
      fontFamily: "'Segoe UI','Arial','Tahoma',sans-serif",
      direction: "rtl", display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
    }}>
      {/* Decorative rings */}
      <div style={{ position: "absolute", top: -180, right: -180, width: 520, height: 520, borderRadius: "50%", border: `1px solid ${rgba(secondary, 0.18)}` }} />
      <div style={{ position: "absolute", top: -130, right: -130, width: 380, height: 380, borderRadius: "50%", border: `1px solid ${rgba(secondary, 0.12)}` }} />
      <div style={{ position: "absolute", bottom: -150, left: -80, width: 400, height: 400, borderRadius: "50%", border: `1px solid ${rgba(secondary, 0.1)}` }} />

      {/* TOP BAR */}
      <div style={{ height: 7, background: `linear-gradient(90deg, ${secondary}, ${primary})`, flexShrink: 0 }} />

      {/* HEADER */}
      <div style={{ padding: "36px 56px 20px", textAlign: "center", flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 50, background: rgba(secondary, 0.5) }} />
          <span style={{ fontSize: 13, color: rgba(secondary, 0.85), letterSpacing: 3, fontWeight: 600 }}>إنفوجرافيك</span>
          <div style={{ height: 1, width: 50, background: rgba(secondary, 0.5) }} />
        </div>
        <h1 style={{ margin: 0, fontSize: 50, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          {data.title}
        </h1>
        {data.subtitle && <p style={{ margin: "12px 0 0", fontSize: 21, color: rgba("#fff", 0.62), lineHeight: 1.4 }}>{data.subtitle}</p>}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 16 }}>
          <div style={{ width: 40, height: 4, background: secondary, borderRadius: 2 }} />
          <div style={{ width: 14, height: 4, background: rgba(secondary, 0.5), borderRadius: 2 }} />
          <div style={{ width: 6,  height: 4, background: rgba(secondary, 0.25), borderRadius: 2 }} />
        </div>
      </div>

      {/* GRID */}
      <div style={{
        flex: 1, padding: "10px 44px",
        display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: 14, alignContent: "center", overflow: "hidden",
      }}>
        {points.map((pt, i) => {
          const Icon = getIcon(pt.icon);
          return (
            <div key={i} style={{
              background: rgba("#fff", 0.09),
              border: `1px solid ${rgba("#fff", 0.12)}`,
              borderRadius: 20, padding: "20px 22px",
              display: "flex", flexDirection: "column", gap: 10,
              position: "relative", overflow: "hidden",
            }}>
              {/* watermark num */}
              <div style={{ position: "absolute", bottom: -10, left: 6, fontSize: 80, fontWeight: 900, color: rgba("#fff", 0.04), lineHeight: 1, userSelect: "none" }}>
                {i + 1}
              </div>
              {/* icon + number */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={22} color="#fff" />
                </div>
                {pt.highlight && (
                  <div style={{
                    background: `linear-gradient(135deg, ${secondary}, ${primary})`,
                    borderRadius: 10, padding: "5px 12px",
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{pt.highlight}</span>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, fontSize: hasHighlights ? 17 : 19, color: rgba("#fff", 0.9), lineHeight: 1.5, position: "relative" }}>
                {pt.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin: "10px 44px 0", padding: "13px 22px",
          background: rgba(secondary, 0.15), border: `1.5px solid ${rgba(secondary, 0.35)}`,
          borderRadius: 16, fontSize: 18, color: rgba("#fff", 0.88),
          textAlign: "center", flexShrink: 0, lineHeight: 1.5,
        }}>
          <span style={{ color: secondary }}>◈ </span>{data.conclusion}<span style={{ color: secondary }}> ◈</span>
        </div>
      )}

      {/* BOTTOM BAR + BRAND */}
      <div style={{ height: 7, background: `linear-gradient(90deg, ${primary}, ${secondary})`, marginTop: 14, flexShrink: 0 }} />
      <div style={{ padding: "9px 0 13px", textAlign: "center", fontSize: 14, color: rgba("#fff", 0.3), flexShrink: 0 }}>{BRAND}</div>
    </div>
  );
}

// ── HORIZONTAL TEMPLATE (1200 × 630) ──────────────────────────────────────
// Best for: 4-5 points, landscape social sharing
function HorizontalCard({ data, primary, secondary }: { data: InfographicData; primary: string; secondary: string }) {
  const points = (data.bulletPoints || []).slice(0, 5);
  const darkBg = darken(primary, 0.5);
  const midBg  = darken(primary, 0.28);

  return (
    <div style={{
      width: 1200, height: 630,
      background: `linear-gradient(135deg, ${darkBg} 0%, ${midBg} 100%)`,
      fontFamily: "'Segoe UI','Arial','Tahoma',sans-serif",
      direction: "rtl", display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
    }}>
      {/* bg decoration */}
      <div style={{ position: "absolute", top: -150, left: -80, width: 450, height: 450, borderRadius: "50%", background: rgba(secondary, 0.06) }} />
      <div style={{ position: "absolute", bottom: -100, right: -50, width: 350, height: 350, borderRadius: "50%", background: rgba(primary, 0.08) }} />

      {/* TOP BAR */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${secondary}, ${primary})`, flexShrink: 0 }} />

      {/* HEADER */}
      <div style={{ padding: "26px 52px 18px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, height: 22, background: secondary, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: rgba(secondary, 0.85), letterSpacing: 2.5 }}>إنفوجرافيك</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{data.title}</h1>
        {data.subtitle && <p style={{ margin: "7px 0 0", fontSize: 18, color: rgba("#fff", 0.62) }}>{data.subtitle}</p>}
      </div>

      {/* divider */}
      <div style={{ margin: "0 52px", height: 1, background: `linear-gradient(90deg, ${rgba(secondary, 0.5)}, transparent)`, flexShrink: 0 }} />

      {/* POINTS ROW */}
      <div style={{ flex: 1, padding: "16px 40px 0", display: "flex", gap: 14, overflow: "hidden" }}>
        {points.map((pt, i) => {
          const Icon = getIcon(pt.icon);
          return (
            <div key={i} style={{
              flex: 1, background: rgba("#fff", 0.08),
              border: `1px solid ${rgba("#fff", 0.12)}`,
              borderRadius: 18, padding: "16px 16px 14px",
              display: "flex", flexDirection: "column", gap: 10,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", bottom: -8, left: 6, fontSize: 72, fontWeight: 900, color: rgba("#fff", 0.04), lineHeight: 1 }}>{i + 1}</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={19} color="#fff" />
                </div>
                {pt.highlight && (
                  <span style={{
                    fontSize: 22, fontWeight: 900,
                    background: `linear-gradient(135deg, ${secondary}, ${primary})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {pt.highlight}
                  </span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: 16, color: rgba("#fff", 0.88), lineHeight: 1.5, position: "relative", flex: 1 }}>
                {pt.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* CONCLUSION + FOOTER */}
      <div style={{ padding: "12px 40px 0", flexShrink: 0 }}>
        {data.conclusion && (
          <div style={{
            background: rgba(secondary, 0.12), border: `1px solid ${rgba(secondary, 0.3)}`,
            borderRadius: 10, padding: "9px 16px", marginBottom: 10,
            fontSize: 15, color: rgba("#fff", 0.82), textAlign: "center",
          }}>
            {data.conclusion}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, paddingBottom: 12 }}>
          <div style={{ height: 1, flex: 1, background: rgba("#fff", 0.1) }} />
          <span style={{ fontSize: 12, color: rgba("#fff", 0.3) }}>{BRAND}</span>
          <div style={{ height: 1, flex: 1, background: rgba("#fff", 0.1) }} />
        </div>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
function pickTemplate(data: InfographicData): { comp: "vertical" | "grid" | "horizontal"; w: number; h: number } {
  const layout = data.visualDesign?.layout;
  const pts    = (data.bulletPoints || []).length;

  if (layout === "horizontal") return { comp: "horizontal", w: 1200, h: 630 };
  if (layout === "grid")       return { comp: "grid",       w: 1080, h: 1080 };
  if (layout === "vertical")   return { comp: "vertical",   w: 800,  h: 1050 };

  // auto: ≤5 and has many highlights → grid; tall list → vertical; else horizontal
  if (pts <= 5 && data.bulletPoints?.some(p => p.highlight)) return { comp: "grid", w: 1080, h: 1080 };
  if (pts > 4) return { comp: "vertical", w: 800, h: 1050 };
  return { comp: "horizontal", w: 1200, h: 630 };
}

export default function InfographicRenderer({ data }: { data: InfographicData }) {
  const innerRef = useRef<HTMLDivElement>(null);

  const primary   = data.visualDesign?.primaryColor   || DEFAULT_PRIMARY;
  const secondary = data.visualDesign?.secondaryColor || DEFAULT_SECONDARY;
  const { comp, w, h } = pickTemplate(data);

  const getHTML = useCallback(() => innerRef.current?.outerHTML ?? "", []);

  const downloadPng = useCallback(() => {
    const html = getHTML();
    if (!html) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}">
      <foreignObject width="${w * 2}" height="${h * 2}">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="transform:scale(2);transform-origin:top right;width:${w}px;height:${h}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = w * 2;
      canvas.height = h * 2;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `infographic-capsulah-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [w, h, getHTML]);

  const downloadSvg = useCallback(() => {
    const html = getHTML();
    if (!html) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject width="${w}" height="${h}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `infographic-capsulah-${Date.now()}.svg`;
    a.click();
  }, [w, h, getHTML]);

  const previewMaxW = 680;
  const scale = previewMaxW / w;
  const previewH = h * scale;

  return (
    <div className="space-y-4">
      {/* preview */}
      <div
        style={{ width: "100%", height: previewH, position: "relative", overflow: "hidden", borderRadius: 16 }}
        className="shadow-xl border border-border"
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top right", position: "absolute", top: 0, right: 0 }}>
          <div ref={innerRef}>
            {comp === "vertical"   && <VerticalCard   data={data} primary={primary} secondary={secondary} />}
            {comp === "grid"       && <GridCard        data={data} primary={primary} secondary={secondary} />}
            {comp === "horizontal" && <HorizontalCard  data={data} primary={primary} secondary={secondary} />}
          </div>
        </div>
      </div>

      {/* download buttons */}
      <div className="flex gap-3">
        <Button onClick={downloadPng} className="flex-1 gap-2" data-testid="button-download-png">
          <FileImage className="h-4 w-4" />
          تحميل PNG
        </Button>
        <Button onClick={downloadSvg} variant="outline" className="flex-1 gap-2" data-testid="button-download-svg">
          <Download className="h-4 w-4" />
          تحميل SVG
        </Button>
      </div>
    </div>
  );
}
