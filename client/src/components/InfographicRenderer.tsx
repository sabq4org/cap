import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileImage, Download } from "lucide-react";

export interface InfographicData {
  title: string;
  subtitle?: string;
  stats?: { value: string; label: string }[];
  points?: string[];
  conclusion?: string;
  template: "stats" | "tips" | "health";
}

const BRAND = "كبسولة · منصة الصحة الذكية";

// ─────────────────────────────────────────────
// STATS TEMPLATE  (1200 × 630)
// ─────────────────────────────────────────────
function StatsCard({ data }: { data: InfographicData }) {
  const stats = (data.stats || []).slice(0, 4);
  const points = (data.points || []).slice(0, 5);

  return (
    <div style={{
      width: 1200, height: 630, position: "relative", overflow: "hidden",
      background: "linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)",
      fontFamily: "'Segoe UI', 'Arial', 'Tahoma', sans-serif",
      direction: "rtl",
      display: "flex", flexDirection: "column",
    }}>
      {/* decorative circles */}
      <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "rgba(16,185,129,0.07)", top: -120, left: -80 }} />
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(16,185,129,0.06)", bottom: -80, right: -60 }} />
      <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.03)", top: 180, left: 550 }} />

      {/* top accent bar */}
      <div style={{ height: 6, background: "linear-gradient(90deg, #10b981, #059669, #047857)", flexShrink: 0 }} />

      {/* HEADER */}
      <div style={{ padding: "32px 60px 20px", textAlign: "center", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          {data.title}
        </h1>
        {data.subtitle && (
          <p style={{ margin: "10px 0 0", fontSize: 20, color: "rgba(255,255,255,0.68)", fontWeight: 400 }}>
            {data.subtitle}
          </p>
        )}
        <div style={{ width: 80, height: 3, background: "#10b981", margin: "16px auto 0", borderRadius: 2 }} />
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", gap: 0, padding: "0 40px", overflow: "hidden" }}>

        {/* STATS GRID */}
        {stats.length > 0 && (
          <div style={{
            flex: 1, display: "grid",
            gridTemplateColumns: `repeat(${Math.min(stats.length, 2)}, 1fr)`,
            gap: 16, alignContent: "center", paddingLeft: 20,
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 18, padding: "20px 16px",
                textAlign: "center", backdropFilter: "blur(4px)",
              }}>
                <div style={{ fontSize: 50, fontWeight: 900, color: "#6ee7b7", lineHeight: 1.05 }}>{s.value}</div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* POINTS */}
        {points.length > 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, paddingRight: stats.length > 0 ? 20 : 0 }}>
            {points.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  minWidth: 30, height: 30, borderRadius: "50%",
                  background: "#059669", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 2,
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, fontSize: 18, color: "rgba(255,255,255,0.88)", lineHeight: 1.5, fontWeight: 400 }}>{p}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin: "0 40px 16px",
          padding: "12px 20px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(16,185,129,0.35)",
          borderRadius: 12,
          fontSize: 17, color: "rgba(255,255,255,0.8)", textAlign: "center", fontStyle: "italic", flexShrink: 0,
        }}>
          {data.conclusion}
        </div>
      )}

      {/* BRAND FOOTER */}
      <div style={{ padding: "8px 0 12px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.32)", flexShrink: 0 }}>
        {BRAND}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TIPS TEMPLATE  (800 × 1000)
// ─────────────────────────────────────────────
function TipsCard({ data }: { data: InfographicData }) {
  const points = (data.points || []).slice(0, 7);
  const stats = (data.stats || []).slice(0, 3);

  return (
    <div style={{
      width: 800, height: 1000, position: "relative", overflow: "hidden",
      background: "#f0fdf4",
      fontFamily: "'Segoe UI', 'Arial', 'Tahoma', sans-serif",
      direction: "rtl", display: "flex", flexDirection: "column",
    }}>
      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b, #059669)",
        padding: "44px 50px 36px", textAlign: "center", position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: -80, left: -60 }} />
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: -60, right: -40 }} />
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.25, position: "relative" }}>
          {data.title}
        </h1>
        {data.subtitle && (
          <p style={{ margin: "10px 0 0", fontSize: 18, color: "rgba(255,255,255,0.72)", position: "relative" }}>
            {data.subtitle}
          </p>
        )}
      </div>

      {/* STATS ROW */}
      {stats.length > 0 && (
        <div style={{ display: "flex", gap: 12, padding: "20px 30px 0", flexShrink: 0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              flex: 1, background: "#fff", borderRadius: 14,
              border: "1.5px solid #d1fae5", padding: "14px 10px", textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#059669", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* DIVIDER */}
      <div style={{ padding: "16px 30px 8px", flexShrink: 0 }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #10b981, transparent)", borderRadius: 1 }} />
      </div>

      {/* POINTS */}
      <div style={{ flex: 1, padding: "0 30px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        {points.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: i % 2 === 0 ? "#fff" : "#f0fdf4",
            border: "1.5px solid #d1fae5",
            borderRadius: 14, padding: "14px 18px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              minWidth: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <p style={{ margin: 0, fontSize: 19, color: "#1f2937", lineHeight: 1.5, fontWeight: 500 }}>{p}</p>
          </div>
        ))}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin: "12px 30px 0", padding: "14px 20px",
          background: "#064e3b", borderRadius: 14,
          fontSize: 17, color: "#fff", textAlign: "center", fontWeight: 500, lineHeight: 1.5, flexShrink: 0,
        }}>
          {data.conclusion}
        </div>
      )}

      {/* BRAND */}
      <div style={{ padding: "12px 0 14px", textAlign: "center", fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
        {BRAND}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HEALTH TEMPLATE  (1080 × 1080)
// ─────────────────────────────────────────────
function HealthCard({ data }: { data: InfographicData }) {
  const stats = (data.stats || []).slice(0, 3);
  const points = (data.points || []).slice(0, 6);
  const cols = points.length > 3 ? 2 : 1;

  return (
    <div style={{
      width: 1080, height: 1080, position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #052e16 0%, #064e3b 60%, #065f46 100%)",
      fontFamily: "'Segoe UI', 'Arial', 'Tahoma', sans-serif",
      direction: "rtl", display: "flex", flexDirection: "column",
    }}>
      {/* decorative */}
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(16,185,129,0.07)", top: -130, right: -100 }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(16,185,129,0.05)", bottom: -60, left: -60 }} />

      {/* TOP BAR */}
      <div style={{ height: 8, background: "linear-gradient(90deg, #10b981, #059669, #047857)", flexShrink: 0 }} />

      {/* HEADER */}
      <div style={{ padding: "44px 60px 24px", textAlign: "center", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-1px" }}>
          {data.title}
        </h1>
        {data.subtitle && (
          <p style={{ margin: "12px 0 0", fontSize: 22, color: "rgba(255,255,255,0.65)", fontWeight: 400 }}>
            {data.subtitle}
          </p>
        )}
        <div style={{ width: 100, height: 4, background: "#10b981", margin: "20px auto 0", borderRadius: 2 }} />
      </div>

      {/* STATS */}
      {stats.length > 0 && (
        <div style={{ display: "flex", gap: 16, padding: "0 50px 28px", flexShrink: 0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              flex: 1, background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20, padding: "24px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 60, fontWeight: 900, color: "#6ee7b7", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* POINTS */}
      <div style={{
        flex: 1, padding: "0 50px",
        display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 12, alignContent: "start", overflow: "hidden",
      }}>
        {points.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.11)",
            borderRadius: 16, padding: "16px 18px",
          }}>
            <div style={{
              minWidth: 34, height: 34, borderRadius: "50%",
              background: "#059669", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <p style={{ margin: 0, fontSize: 19, color: "rgba(255,255,255,0.88)", lineHeight: 1.45 }}>{p}</p>
          </div>
        ))}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin: "16px 50px 0", padding: "16px 24px",
          background: "rgba(255,255,255,0.07)",
          border: "1.5px solid rgba(16,185,129,0.4)",
          borderRadius: 16, fontSize: 19, color: "rgba(255,255,255,0.85)",
          textAlign: "center", fontStyle: "italic", flexShrink: 0,
        }}>
          {data.conclusion}
        </div>
      )}

      {/* BOTTOM BAR */}
      <div style={{ height: 8, background: "linear-gradient(90deg, #047857, #059669, #10b981)", marginTop: 16, flexShrink: 0 }} />

      {/* BRAND */}
      <div style={{ padding: "10px 0 14px", textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
        {BRAND}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
const DIMS = {
  stats:  { w: 1200, h: 630 },
  tips:   { w: 800,  h: 1000 },
  health: { w: 1080, h: 1080 },
};

export default function InfographicRenderer({ data }: { data: InfographicData }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const dim = DIMS[data.template];

  // ---- export helpers ----
  const getInnerHTML = useCallback((): string => {
    if (!innerRef.current) return "";
    return innerRef.current.outerHTML;
  }, []);

  const downloadPng = useCallback(() => {
    const html = getInnerHTML();
    if (!html) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w * 2}" height="${dim.h * 2}">
      <foreignObject width="${dim.w * 2}" height="${dim.h * 2}">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="transform:scale(2);transform-origin:top right;width:${dim.w}px;height:${dim.h}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dim.w * 2;
      canvas.height = dim.h * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `infographic-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [dim, getInnerHTML]);

  const downloadSvg = useCallback(() => {
    const html = getInnerHTML();
    if (!html) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}">
      <foreignObject width="${dim.w}" height="${dim.h}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${dim.w}px;height:${dim.h}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infographic-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dim, getInnerHTML]);

  // Scale preview to fit available width (~700px max)
  const previewMaxW = 700;
  const scale = previewMaxW / dim.w;
  const previewH = dim.h * scale;

  return (
    <div className="space-y-4">
      {/* Preview wrapper */}
      <div
        style={{ width: "100%", height: previewH, position: "relative", overflow: "hidden", borderRadius: 12 }}
        className="border border-border shadow-lg"
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top right", position: "absolute", top: 0, right: 0 }}>
          <div ref={innerRef}>
            {data.template === "tips" ? (
              <TipsCard data={data} />
            ) : data.template === "health" ? (
              <HealthCard data={data} />
            ) : (
              <StatsCard data={data} />
            )}
          </div>
        </div>
      </div>

      {/* Download buttons */}
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
