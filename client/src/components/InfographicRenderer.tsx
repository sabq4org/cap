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
const LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#10b981"/><path d="M8 14h12M14 8v12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`;

// ─── STATS TEMPLATE (1200 × 630) ──────────────────────────────────────────
function StatsCard({ data }: { data: InfographicData }) {
  const stats = (data.stats || []).slice(0, 4);
  const points = (data.points || []).slice(0, 5);
  const ACCENT = "#10b981";
  const DARK = "#052e16";
  const MID = "#065f46";

  return (
    <div style={{
      width: 1200, height: 630,
      background: `linear-gradient(135deg, ${DARK} 0%, ${MID} 100%)`,
      fontFamily: "'Segoe UI', 'Arial', 'Tahoma', sans-serif",
      direction: "rtl", display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* BG decoration */}
      <div style={{ position:"absolute", top:-180, left:-80, width:500, height:500, borderRadius:"50%", background:"rgba(16,185,129,0.06)" }} />
      <div style={{ position:"absolute", bottom:-120, right:-60, width:360, height:360, borderRadius:"50%", background:"rgba(16,185,129,0.05)" }} />
      {/* big watermark number */}
      <div style={{ position:"absolute", left:40, bottom:-20, fontSize:280, fontWeight:900, color:"rgba(255,255,255,0.03)", lineHeight:1, userSelect:"none" }}>
        {stats.length > 0 ? stats[0].value : "∞"}
      </div>

      {/* TOP BAR */}
      <div style={{ height:7, background:`linear-gradient(90deg, ${ACCENT}, #059669, #047857)`, flexShrink:0 }} />

      {/* HEADER */}
      <div style={{ padding:"28px 60px 20px", flexShrink:0, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
          <div style={{ width:46, height:46, borderRadius:12, background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center" }}
            dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", letterSpacing:2, textTransform:"uppercase" }}>إنفوجرافيك صحي</div>
        </div>
        <h1 style={{ margin:0, fontSize:46, fontWeight:900, color:"#fff", lineHeight:1.15, letterSpacing:"-0.5px" }}>{data.title}</h1>
        {data.subtitle && <p style={{ margin:"8px 0 0", fontSize:19, color:"rgba(255,255,255,0.62)" }}>{data.subtitle}</p>}
      </div>

      {/* DIVIDER */}
      <div style={{ margin:"0 60px 0", height:1, background:"linear-gradient(90deg, rgba(16,185,129,0.6), transparent)", flexShrink:0 }} />

      {/* BODY */}
      <div style={{ flex:1, display:"flex", gap:20, padding:"20px 40px 0", overflow:"hidden" }}>

        {/* STATS */}
        {stats.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, width:stats.length > 2 ? 420 : 320, flexShrink:0 }}>
            <div style={{ display:"grid", gridTemplateColumns: stats.length > 2 ? "1fr 1fr" : "1fr", gap:12, height:"100%" }}>
              {stats.map((s, i) => {
                const colors = ["#10b981","#34d399","#6ee7b7","#a7f3d0"];
                return (
                  <div key={i} style={{
                    background:"rgba(255,255,255,0.07)", border:`1px solid ${colors[i]}40`,
                    borderRadius:20, padding:"18px 20px", position:"relative", overflow:"hidden",
                    display:"flex", flexDirection:"column", justifyContent:"center",
                  }}>
                    <div style={{ position:"absolute", top:-10, left:-10, fontSize:90, fontWeight:900, color:"rgba(255,255,255,0.04)", lineHeight:1 }}>{i+1}</div>
                    <div style={{ fontSize:i < 2 ? 52 : 40, fontWeight:900, color:colors[i], lineHeight:1, position:"relative" }}>{s.value}</div>
                    <div style={{ fontSize:15, color:"rgba(255,255,255,0.65)", marginTop:6, fontWeight:500 }}>{s.label}</div>
                    <div style={{ position:"absolute", bottom:0, right:0, width:"40%", height:3, background:`linear-gradient(90deg, transparent, ${colors[i]})`, borderRadius:2 }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* POINTS */}
        {points.length > 0 && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10, justifyContent:"center" }}>
            {points.map((p, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{
                  minWidth:36, height:36, borderRadius:10,
                  background:`linear-gradient(135deg, ${ACCENT}, #047857)`,
                  color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16, fontWeight:800, flexShrink:0,
                }}>
                  {String(i+1).padStart(2,"0")}
                </div>
                <div style={{ flex:1, position:"relative" }}>
                  <p style={{ margin:0, fontSize:19, color:"rgba(255,255,255,0.9)", lineHeight:1.4, fontWeight:400 }}>{p}</p>
                  <div style={{ position:"absolute", bottom:-5, right:0, left:0, height:1, background:"rgba(255,255,255,0.06)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONCLUSION + FOOTER */}
      <div style={{ flexShrink:0, padding:"12px 40px 0" }}>
        {data.conclusion && (
          <div style={{
            background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)",
            borderRadius:12, padding:"10px 18px", marginBottom:10,
            fontSize:16, color:"rgba(255,255,255,0.8)", textAlign:"center",
          }}>
            ✦ {data.conclusion} ✦
          </div>
        )}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, paddingBottom:14 }}>
          <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>{BRAND}</span>
          <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.1)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── TIPS TEMPLATE (800 × 1000) ───────────────────────────────────────────
function TipsCard({ data }: { data: InfographicData }) {
  const points = (data.points || []).slice(0, 7);
  const stats = (data.stats || []).slice(0, 3);
  const DARK = "#052e16";
  const ACCENT = "#10b981";
  const COLORS = ["#059669","#10b981","#34d399","#6ee7b7","#a7f3d0","#d1fae5","#ecfdf5"];

  return (
    <div style={{
      width:800, height:1000,
      background:"#f8fffe",
      fontFamily:"'Segoe UI', 'Arial', 'Tahoma', sans-serif",
      direction:"rtl", display:"flex", flexDirection:"column",
      position:"relative", overflow:"hidden",
    }}>
      {/* HEADER */}
      <div style={{
        background:`linear-gradient(135deg, ${DARK} 0%, #064e3b 60%, #059669 100%)`,
        padding:"40px 48px 32px", flexShrink:0, position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-60, left:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"absolute", bottom:-80, right:-30, width:240, height:240, borderRadius:"50%", background:"rgba(16,185,129,0.1)" }} />

        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, position:"relative" }}>
          <div style={{ width:4, height:28, background:ACCENT, borderRadius:2 }} />
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:2 }}>إنفوجرافيك</span>
        </div>
        <h1 style={{ margin:0, fontSize:42, fontWeight:900, color:"#fff", lineHeight:1.2, position:"relative" }}>{data.title}</h1>
        {data.subtitle && <p style={{ margin:"10px 0 0", fontSize:17, color:"rgba(255,255,255,0.65)", position:"relative" }}>{data.subtitle}</p>}

        {/* header bottom shape */}
        <div style={{ position:"absolute", bottom:-1, left:0, right:0, height:24,
          background:"#f8fffe", borderRadius:"50% 50% 0 0 / 100% 100% 0 0" }} />
      </div>

      {/* STATS */}
      {stats.length > 0 && (
        <div style={{ display:"flex", gap:10, padding:"28px 30px 0", flexShrink:0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              flex:1, background:"#fff", borderRadius:16,
              border:`2px solid ${COLORS[i]}60`,
              padding:"16px 12px", textAlign:"center",
              boxShadow:`0 4px 20px ${COLORS[i]}20`,
            }}>
              <div style={{ fontSize:36, fontWeight:900, color:COLORS[i], lineHeight:1 }}>{s.value}</div>
              <div style={{ width:30, height:3, background:COLORS[i], margin:"6px auto", borderRadius:2 }} />
              <div style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION TITLE */}
      <div style={{ padding:`${stats.length > 0 ? "20px" : "28px"} 30px 10px`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, height:1, background:"#d1fae5" }} />
          <span style={{ fontSize:13, color:"#6b7280", fontWeight:600 }}>النقاط الرئيسية</span>
          <div style={{ flex:1, height:1, background:"#d1fae5" }} />
        </div>
      </div>

      {/* POINTS */}
      <div style={{ flex:1, padding:"0 30px", display:"flex", flexDirection:"column", gap:10, overflow:"hidden" }}>
        {points.map((p, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:0,
            background:"#fff", borderRadius:16,
            border:"1.5px solid #d1fae5",
            overflow:"hidden",
            boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
          }}>
            {/* number tab */}
            <div style={{
              minWidth:54, alignSelf:"stretch",
              background:`linear-gradient(180deg, ${COLORS[i]}, ${COLORS[Math.min(i+1, 6)]})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexDirection:"column",
            }}>
              <span style={{ fontSize:22, fontWeight:900, color:"#fff", lineHeight:1 }}>{String(i+1).padStart(2,"0")}</span>
            </div>
            <p style={{ margin:0, fontSize:18, color:"#1f2937", lineHeight:1.5, fontWeight:500, padding:"14px 18px", flex:1 }}>{p}</p>
          </div>
        ))}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin:"12px 30px 0", padding:"14px 20px",
          background:DARK, borderRadius:14,
          fontSize:16, color:"#fff", textAlign:"center", lineHeight:1.5, flexShrink:0,
        }}>
          <span style={{ color:ACCENT, marginLeft:6 }}>✦</span>
          {data.conclusion}
          <span style={{ color:ACCENT, marginRight:6 }}>✦</span>
        </div>
      )}

      {/* BRAND */}
      <div style={{ padding:"10px 0 14px", textAlign:"center", fontSize:12, color:"#9ca3af", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <div style={{ height:1, width:60, background:"#e5e7eb" }} />
        {BRAND}
        <div style={{ height:1, width:60, background:"#e5e7eb" }} />
      </div>
    </div>
  );
}

// ─── HEALTH TEMPLATE (1080 × 1080) ────────────────────────────────────────
function HealthCard({ data }: { data: InfographicData }) {
  const stats = (data.stats || []).slice(0, 3);
  const points = (data.points || []).slice(0, 6);
  const DARK = "#052e16";
  const ACCENT = "#10b981";
  const LIGHT = "#6ee7b7";
  const COLS = points.length > 3 ? 2 : 1;

  return (
    <div style={{
      width:1080, height:1080,
      background:`linear-gradient(160deg, ${DARK} 0%, #064e3b 50%, #065f46 100%)`,
      fontFamily:"'Segoe UI', 'Arial', 'Tahoma', sans-serif",
      direction:"rtl", display:"flex", flexDirection:"column",
      position:"relative", overflow:"hidden",
    }}>
      {/* BG rings */}
      <div style={{ position:"absolute", top:-200, right:-200, width:600, height:600, borderRadius:"50%", border:`1px solid ${ACCENT}20` }} />
      <div style={{ position:"absolute", top:-150, right:-150, width:450, height:450, borderRadius:"50%", border:`1px solid ${ACCENT}15` }} />
      <div style={{ position:"absolute", bottom:-180, left:-100, width:500, height:500, borderRadius:"50%", border:`1px solid ${ACCENT}12` }} />

      {/* TOP ACCENT */}
      <div style={{ height:8, background:`linear-gradient(90deg, ${ACCENT}, #059669, #047857)`, flexShrink:0 }} />

      {/* HEADER */}
      <div style={{ padding:"38px 60px 22px", textAlign:"center", flexShrink:0, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:14 }}>
          <div style={{ height:1, width:60, background:`${ACCENT}50` }} />
          <span style={{ fontSize:13, color:`${ACCENT}90`, letterSpacing:3, fontWeight:600 }}>إنفوجرافيك صحي</span>
          <div style={{ height:1, width:60, background:`${ACCENT}50` }} />
        </div>
        <h1 style={{ margin:0, fontSize:54, fontWeight:900, color:"#fff", lineHeight:1.15, letterSpacing:"-1px" }}>{data.title}</h1>
        {data.subtitle && <p style={{ margin:"12px 0 0", fontSize:22, color:"rgba(255,255,255,0.6)" }}>{data.subtitle}</p>}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:18 }}>
          <div style={{ width:40, height:4, background:ACCENT, borderRadius:2 }} />
          <div style={{ width:12, height:4, background:`${ACCENT}60`, borderRadius:2 }} />
          <div style={{ width:6, height:4, background:`${ACCENT}30`, borderRadius:2 }} />
        </div>
      </div>

      {/* STATS */}
      {stats.length > 0 && (
        <div style={{ display:"flex", gap:14, padding:"0 50px 24px", flexShrink:0 }}>
          {stats.map((s, i) => {
            const accents = [ACCENT, LIGHT, "#34d399"];
            return (
              <div key={i} style={{
                flex:1, borderRadius:22, padding:"22px 18px",
                background:"rgba(255,255,255,0.08)",
                border:`1px solid ${accents[i]}30`,
                textAlign:"center", position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", bottom:-10, left:-10, fontSize:100, fontWeight:900, color:"rgba(255,255,255,0.03)", lineHeight:1 }}>{i+1}</div>
                <div style={{ fontSize:62, fontWeight:900, color:accents[i], lineHeight:1, position:"relative" }}>{s.value}</div>
                <div style={{ width:40, height:3, background:accents[i], margin:"8px auto", borderRadius:2 }} />
                <div style={{ fontSize:17, color:"rgba(255,255,255,0.65)", fontWeight:500 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIVIDER */}
      <div style={{ margin:"0 50px 20px", height:1, background:`linear-gradient(90deg, transparent, ${ACCENT}50, transparent)`, flexShrink:0 }} />

      {/* POINTS */}
      <div style={{
        flex:1, padding:"0 50px",
        display:"grid", gridTemplateColumns:`repeat(${COLS}, 1fr)`,
        gap:12, alignContent:"start", overflow:"hidden",
      }}>
        {points.map((p, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:14,
            background:"rgba(255,255,255,0.07)",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:18, padding:"16px 20px",
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:-8, right:-8, fontSize:72, fontWeight:900, color:"rgba(255,255,255,0.04)", lineHeight:1 }}>{i+1}</div>
            <div style={{
              minWidth:38, height:38, borderRadius:12,
              background:`linear-gradient(135deg, ${ACCENT}, #047857)`,
              color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, fontWeight:800, flexShrink:0, position:"relative",
            }}>
              {String(i+1).padStart(2,"0")}
            </div>
            <p style={{ margin:0, fontSize:19, color:"rgba(255,255,255,0.88)", lineHeight:1.45, position:"relative" }}>{p}</p>
          </div>
        ))}
      </div>

      {/* CONCLUSION */}
      {data.conclusion && (
        <div style={{
          margin:"14px 50px 0", padding:"14px 24px",
          background:"rgba(16,185,129,0.13)", border:`1.5px solid ${ACCENT}40`,
          borderRadius:16, fontSize:19, color:"rgba(255,255,255,0.85)",
          textAlign:"center", flexShrink:0, lineHeight:1.5,
        }}>
          <span style={{ color:ACCENT }}>◈ </span>{data.conclusion}<span style={{ color:ACCENT }}> ◈</span>
        </div>
      )}

      {/* BOTTOM */}
      <div style={{ height:8, background:`linear-gradient(90deg, #047857, #059669, ${ACCENT})`, marginTop:16, flexShrink:0 }} />
      <div style={{ padding:"10px 0 14px", textAlign:"center", fontSize:14, color:"rgba(255,255,255,0.3)", flexShrink:0 }}>{BRAND}</div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────
const DIMS = {
  stats:  { w:1200, h:630 },
  tips:   { w:800,  h:1000 },
  health: { w:1080, h:1080 },
};

export default function InfographicRenderer({ data }: { data: InfographicData }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const dim = DIMS[data.template];

  const getHTML = useCallback(() => innerRef.current?.outerHTML ?? "", []);

  const downloadPng = useCallback(() => {
    const html = getHTML();
    if (!html) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w * 2}" height="${dim.h * 2}">
      <foreignObject width="${dim.w * 2}" height="${dim.h * 2}">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="transform:scale(2);transform-origin:top right;width:${dim.w}px;height:${dim.h}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgStr], { type:"image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dim.w * 2;
      canvas.height = dim.h * 2;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `infographic-capsulah-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [dim, getHTML]);

  const downloadSvg = useCallback(() => {
    const html = getHTML();
    if (!html) return;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}">
      <foreignObject width="${dim.w}" height="${dim.h}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${dim.w}px;height:${dim.h}px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svgStr], { type:"image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `infographic-capsulah-${Date.now()}.svg`;
    a.click();
  }, [dim, getHTML]);

  const previewMaxW = 680;
  const scale = previewMaxW / dim.w;
  const previewH = dim.h * scale;

  return (
    <div className="space-y-4">
      <div
        style={{ width:"100%", height:previewH, position:"relative", overflow:"hidden", borderRadius:16 }}
        className="shadow-xl border border-border"
      >
        <div style={{ transform:`scale(${scale})`, transformOrigin:"top right", position:"absolute", top:0, right:0 }}>
          <div ref={innerRef}>
            {data.template === "tips" ? <TipsCard data={data} />
              : data.template === "health" ? <HealthCard data={data} />
              : <StatsCard data={data} />}
          </div>
        </div>
      </div>

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
