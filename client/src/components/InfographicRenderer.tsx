import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileImage } from "lucide-react";

export interface InfographicData {
  title: string;
  subtitle?: string;
  stats?: { value: string; label: string }[];
  points?: string[];
  conclusion?: string;
  template: "stats" | "tips" | "health";
}

interface Props {
  data: InfographicData;
  scale?: number;
}

const BRAND = "كبسولة · منصة الصحة الذكية";
const PRIMARY = "#059669";
const DARK = "#064e3b";
const LIGHT_BG = "#f0fdf4";
const WHITE = "#ffffff";

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxLen) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function StatsTemplate({ data }: { data: InfographicData }) {
  const W = 1200;
  const H = 630;
  const stats = data.stats?.slice(0, 4) || [];
  const points = data.points?.slice(0, 5) || [];
  const hasStats = stats.length > 0;
  const titleLines = wrapText(data.title, 35);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Arial', 'Tahoma', sans-serif" }}
    >
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="statGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={WHITE} stopOpacity="0.15" />
          <stop offset="100%" stopColor={WHITE} stopOpacity="0.07" />
        </linearGradient>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#bgGrad)" rx="0" />

      <circle cx={W - 80} cy={80} r={160} fill={WHITE} fillOpacity="0.04" />
      <circle cx={80} cy={H - 60} r={130} fill={WHITE} fillOpacity="0.04" />
      <circle cx={W / 2} cy={H + 80} r={200} fill={PRIMARY} fillOpacity="0.08" />

      <rect x={0} y={0} width={8} height={H} fill={PRIMARY} opacity="0.6" />
      <rect x={W - 8} y={0} width={8} height={H} fill={PRIMARY} opacity="0.3" />

      <text
        x={W / 2}
        y={titleLines.length === 1 ? 85 : 70}
        textAnchor="middle"
        fontSize={titleLines.length === 1 ? "42" : "36"}
        fontWeight="700"
        fill={WHITE}
        direction="rtl"
      >
        {titleLines.map((line, i) => (
          <tspan key={i} x={W / 2} dy={i === 0 ? 0 : 48}>
            {line}
          </tspan>
        ))}
      </text>

      {data.subtitle && (
        <text x={W / 2} y={titleLines.length === 1 ? 130 : 145} textAnchor="middle" fontSize="22" fill={WHITE} fillOpacity="0.75" direction="rtl">
          {data.subtitle}
        </text>
      )}

      <line x1={W / 2 - 120} y1={data.subtitle ? 165 : 140} x2={W / 2 + 120} y2={data.subtitle ? 165 : 140} stroke={PRIMARY} strokeWidth="2" strokeOpacity="0.6" />

      {hasStats && (
        <>
          {stats.map((stat, i) => {
            const colW = W / stats.length;
            const cx = colW * i + colW / 2;
            const boxW = Math.min(colW - 40, 240);
            const boxH = 130;
            const by = 195;
            return (
              <g key={i}>
                <rect x={cx - boxW / 2} y={by} width={boxW} height={boxH} rx="16" fill="url(#statGrad)" stroke={WHITE} strokeOpacity="0.15" strokeWidth="1" />
                <text x={cx} y={by + 68} textAnchor="middle" fontSize="46" fontWeight="800" fill={WHITE} direction="rtl">
                  {stat.value}
                </text>
                <text x={cx} y={by + 104} textAnchor="middle" fontSize="18" fill={WHITE} fillOpacity="0.75" direction="rtl">
                  {stat.label}
                </text>
              </g>
            );
          })}
        </>
      )}

      {points.length > 0 && (
        <g>
          {points.map((point, i) => {
            const py = (hasStats ? 360 : 200) + i * 44;
            const lines = wrapText(point, 65);
            return (
              <g key={i}>
                <circle cx={W - 55} cy={py + 5} r={14} fill={PRIMARY} fillOpacity="0.9" />
                <text x={W - 55} y={py + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill={WHITE}>
                  {i + 1}
                </text>
                <text x={W - 80} y={py + 8} textAnchor="end" fontSize="19" fill={WHITE} fillOpacity="0.9" direction="rtl">
                  {lines[0]}
                </text>
                {lines[1] && (
                  <text x={W - 80} y={py + 30} textAnchor="end" fontSize="18" fill={WHITE} fillOpacity="0.75" direction="rtl">
                    {lines[1]}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {data.conclusion && (
        <>
          <rect x={40} y={H - 115} width={W - 80} height={68} rx="12" fill={WHITE} fillOpacity="0.09" stroke={PRIMARY} strokeOpacity="0.4" strokeWidth="1" />
          <text x={W / 2} y={H - 76} textAnchor="middle" fontSize="19" fill={WHITE} fillOpacity="0.9" direction="rtl">
            {wrapText(data.conclusion, 80)[0]}
          </text>
          {wrapText(data.conclusion, 80)[1] && (
            <text x={W / 2} y={H - 55} textAnchor="middle" fontSize="18" fill={WHITE} fillOpacity="0.75" direction="rtl">
              {wrapText(data.conclusion, 80)[1]}
            </text>
          )}
        </>
      )}

      <text x={W / 2} y={H - 14} textAnchor="middle" fontSize="15" fill={WHITE} fillOpacity="0.45" direction="rtl">
        {BRAND}
      </text>
    </svg>
  );
}

function TipsTemplate({ data }: { data: InfographicData }) {
  const W = 800;
  const H = 1000;
  const points = data.points?.slice(0, 7) || [];
  const titleLines = wrapText(data.title, 28);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Arial', 'Tahoma', sans-serif" }}
    >
      <defs>
        <linearGradient id="tipBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
        <linearGradient id="tipHeader" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="url(#tipBg)" />

      <rect x={0} y={0} width={W} height={220} fill="url(#tipHeader)" />
      <circle cx={W - 60} cy={60} r={110} fill={WHITE} fillOpacity="0.06" />
      <circle cx={40} cy={200} r={80} fill={WHITE} fillOpacity="0.05" />

      <text
        x={W / 2}
        y={titleLines.length === 1 ? 105 : 88}
        textAnchor="middle"
        fontSize={titleLines.length === 1 ? "44" : "38"}
        fontWeight="800"
        fill={WHITE}
        direction="rtl"
      >
        {titleLines.map((line, i) => (
          <tspan key={i} x={W / 2} dy={i === 0 ? 0 : 50}>
            {line}
          </tspan>
        ))}
      </text>

      {data.subtitle && (
        <text x={W / 2} y={titleLines.length === 1 ? 148 : 165} textAnchor="middle" fontSize="22" fill={WHITE} fillOpacity="0.8" direction="rtl">
          {data.subtitle}
        </text>
      )}

      {data.stats && data.stats.length > 0 && (
        <g>
          {data.stats.slice(0, 3).map((stat, i) => {
            const statW = W / Math.min(data.stats!.length, 3);
            const cx = statW * i + statW / 2;
            return (
              <g key={i}>
                <rect x={cx - 90} y={240} width={180} height={90} rx="12" fill={WHITE} stroke="#d1fae5" strokeWidth="1" />
                <text x={cx} y={295} textAnchor="middle" fontSize="36" fontWeight="800" fill={DARK} direction="rtl">
                  {stat.value}
                </text>
                <text x={cx} y={318} textAnchor="middle" fontSize="15" fill="#6b7280" direction="rtl">
                  {stat.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {points.map((point, i) => {
        const baseY = data.stats && data.stats.length > 0 ? 380 : 260;
        const py = baseY + i * 80;
        const lines = wrapText(point, 42);
        const isEven = i % 2 === 0;
        return (
          <g key={i}>
            <rect x={30} y={py} width={W - 60} height={lines.length > 1 ? 68 : 58} rx="14"
              fill={isEven ? WHITE : "#f0fdf4"}
              stroke="#d1fae5"
              strokeWidth="1.5"
            />
            <circle cx={W - 52} cy={py + (lines.length > 1 ? 34 : 29)} r={20} fill={PRIMARY} />
            <text x={W - 52} y={py + (lines.length > 1 ? 40 : 35)} textAnchor="middle" fontSize="15" fontWeight="700" fill={WHITE}>
              {i + 1}
            </text>
            <text x={W - 82} y={py + (lines.length > 1 ? 27 : 35)} textAnchor="end" fontSize="20" fill={DARK} direction="rtl">
              {lines[0]}
            </text>
            {lines[1] && (
              <text x={W - 82} y={py + 50} textAnchor="end" fontSize="18" fill="#374151" direction="rtl">
                {lines[1]}
              </text>
            )}
          </g>
        );
      })}

      {data.conclusion && (
        <>
          <rect x={30} y={H - 130} width={W - 60} height={80} rx="14" fill={DARK} />
          <text x={W / 2} y={H - 88} textAnchor="middle" fontSize="20" fontWeight="600" fill={WHITE} direction="rtl">
            {wrapText(data.conclusion, 48)[0]}
          </text>
          {wrapText(data.conclusion, 48)[1] && (
            <text x={W / 2} y={H - 65} textAnchor="middle" fontSize="18" fill={WHITE} fillOpacity="0.85" direction="rtl">
              {wrapText(data.conclusion, 48)[1]}
            </text>
          )}
        </>
      )}

      <text x={W / 2} y={H - 12} textAnchor="middle" fontSize="14" fill="#9ca3af" direction="rtl">
        {BRAND}
      </text>
    </svg>
  );
}

function HealthTemplate({ data }: { data: InfographicData }) {
  const W = 1080;
  const H = 1080;
  const points = data.points?.slice(0, 6) || [];
  const stats = data.stats?.slice(0, 3) || [];
  const titleLines = wrapText(data.title, 26);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Arial', 'Tahoma', sans-serif" }}
    >
      <defs>
        <linearGradient id="hBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#052e16" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="hCard" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={WHITE} stopOpacity="0.12" />
          <stop offset="100%" stopColor={WHITE} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="url(#hBg)" />
      <circle cx={W * 0.85} cy={H * 0.15} r={200} fill={PRIMARY} fillOpacity="0.08" />
      <circle cx={W * 0.1} cy={H * 0.8} r={180} fill={PRIMARY} fillOpacity="0.06" />
      <circle cx={W * 0.5} cy={H * 1.05} r={300} fill={PRIMARY} fillOpacity="0.05" />

      <rect x={0} y={0} width={W} height={10} fill={PRIMARY} opacity="0.7" />
      <rect x={0} y={H - 10} width={W} height={10} fill={PRIMARY} opacity="0.4" />

      <text
        x={W / 2}
        y={titleLines.length === 1 ? 110 : 90}
        textAnchor="middle"
        fontSize={titleLines.length === 1 ? "54" : "46"}
        fontWeight="800"
        fill={WHITE}
        direction="rtl"
      >
        {titleLines.map((line, i) => (
          <tspan key={i} x={W / 2} dy={i === 0 ? 0 : 60}>
            {line}
          </tspan>
        ))}
      </text>

      {data.subtitle && (
        <text x={W / 2} y={titleLines.length === 1 ? 160 : 175} textAnchor="middle" fontSize="24" fill={WHITE} fillOpacity="0.7" direction="rtl">
          {data.subtitle}
        </text>
      )}

      <line x1={W / 2 - 100} y1={200} x2={W / 2 + 100} y2={200} stroke={PRIMARY} strokeWidth="3" />

      {stats.length > 0 && (
        <g>
          {stats.map((stat, i) => {
            const colW = W / stats.length;
            const cx = colW * i + colW / 2;
            return (
              <g key={i}>
                <rect x={cx - 130} y={225} width={260} height={145} rx="20" fill="url(#hCard)" stroke={WHITE} strokeOpacity="0.12" strokeWidth="1.5" />
                <text x={cx} y={305} textAnchor="middle" fontSize="58" fontWeight="900" fill={WHITE} direction="rtl">
                  {stat.value}
                </text>
                <text x={cx} y={348} textAnchor="middle" fontSize="20" fill={WHITE} fillOpacity="0.7" direction="rtl">
                  {stat.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {points.map((point, i) => {
        const baseY = stats.length > 0 ? 420 : 250;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const px = col === 0 ? W / 2 + 30 : 30;
        const pw = W / 2 - 50;
        const py = baseY + row * 105;
        const lines = wrapText(point, 28);
        return (
          <g key={i}>
            <rect x={px} y={py} width={pw} height={90} rx="14" fill="url(#hCard)" stroke={WHITE} strokeOpacity="0.1" strokeWidth="1" />
            <circle cx={px + pw - 28} cy={py + 28} r={18} fill={PRIMARY} fillOpacity="0.8" />
            <text x={px + pw - 28} y={py + 34} textAnchor="middle" fontSize="14" fontWeight="700" fill={WHITE}>
              {i + 1}
            </text>
            <text x={px + pw - 56} y={py + 34} textAnchor="end" fontSize="20" fill={WHITE} direction="rtl">
              {lines[0]}
            </text>
            {lines[1] && (
              <text x={px + pw - 56} y={py + 58} textAnchor="end" fontSize="18" fill={WHITE} fillOpacity="0.75" direction="rtl">
                {lines[1]}
              </text>
            )}
          </g>
        );
      })}

      {data.conclusion && (
        <>
          <rect x={40} y={H - 145} width={W - 80} height={90} rx="16" fill={WHITE} fillOpacity="0.08" stroke={PRIMARY} strokeOpacity="0.5" strokeWidth="1.5" />
          <text x={W / 2} y={H - 100} textAnchor="middle" fontSize="22" fontWeight="600" fill={WHITE} direction="rtl">
            {wrapText(data.conclusion, 55)[0]}
          </text>
          {wrapText(data.conclusion, 55)[1] && (
            <text x={W / 2} y={H - 72} textAnchor="middle" fontSize="20" fill={WHITE} fillOpacity="0.8" direction="rtl">
              {wrapText(data.conclusion, 55)[1]}
            </text>
          )}
        </>
      )}

      <text x={W / 2} y={H - 18} textAnchor="middle" fontSize="16" fill={WHITE} fillOpacity="0.4" direction="rtl">
        {BRAND}
      </text>
    </svg>
  );
}

export default function InfographicRenderer({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const dimensions = {
    stats: { w: 1200, h: 630 },
    tips: { w: 800, h: 1000 },
    health: { w: 1080, h: 1080 },
  };

  const dim = dimensions[data.template];

  const getSvgElement = (): SVGSVGElement | null => {
    return containerRef.current?.querySelector("svg") ?? null;
  };

  const downloadSvg = () => {
    const svg = getSvgElement();
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infographic-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = getSvgElement();
    if (!svg) return;
    const scale2x = 2;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dim.w * scale2x;
      canvas.height = dim.h * scale2x;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale2x, scale2x);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `infographic-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  };

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="rounded-xl overflow-hidden border border-border shadow-lg bg-muted/30" style={{ width: "100%", aspectRatio: `${dim.w}/${dim.h}` }}>
        {data.template === "tips" ? (
          <TipsTemplate data={data} />
        ) : data.template === "health" ? (
          <HealthTemplate data={data} />
        ) : (
          <StatsTemplate data={data} />
        )}
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
