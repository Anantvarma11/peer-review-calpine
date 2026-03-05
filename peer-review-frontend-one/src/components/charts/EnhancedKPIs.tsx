import { useState, useEffect } from "react";

/* ── CHART 1 · RADIAL ARC GAUGE (Efficiency Rank) ── */
function RadialGauge({ pct, color }: { pct: number, color: string }) {
    const [prog, setProg] = useState(0);
    useEffect(() => { const t = setTimeout(() => setProg(pct), 300); return () => clearTimeout(t); }, [pct]);
    const r = 32, cx = 42, cy = 42, sweep = 270, startDeg = 135;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const pt = (p: number) => {
        const a = startDeg + (sweep * p) / 100;
        return { x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) };
    };
    const arc = (p0: number, p1: number) => {
        const s = pt(p0), e = pt(p1), large = (sweep * (p1 - p0)) / 100 > 180 ? 1 : 0;
        return `M${s.x} ${s.y} A${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
    };
    return (
        <svg width={84} height={84} viewBox="0 0 84 84">
            <path d={arc(0, 100)} fill="none" stroke="#F3F4F6" strokeWidth={7} strokeLinecap="round" />
            <path d={arc(0, prog)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
                style={{ transition: "d 1.1s cubic-bezier(.4,0,.2,1)" }} />
            <text x={cx} y={cy - 3} textAnchor="middle" fontSize={14} fontWeight={800} fill={color} style={{ fontFamily: "Sora,sans-serif" }}>{pct}%</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize={8} fill="#9CA3AF" style={{ fontFamily: "DM Sans,sans-serif" }}>RANK</text>
        </svg>
    );
}

/* ── CHART 2 · DOT MATRIX (Peer Avg Usage) ── */
function DotMatrix({ pct, color }: { pct: number, color: string }) {
    const total = 50, filled = Math.round((pct / 100) * total);
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3 }}>
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: i < filled ? color : "#E5E7EB",
                    transition: `background ${0.3 + i * 0.01}s ease`,
                }} />
            ))}
        </div>
    );
}

/* ── CHART 3 · WAFFLE CHART (Savings vs Peers) ── */
function WaffleChart({ pct, color }: { pct: number, color: string }) {
    const total = 25, filled = Math.round((pct / 100) * total);
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                    width: 13, height: 13, borderRadius: 3,
                    background: i < filled ? color : "#F3F4F6",
                    border: `1px solid ${i < filled ? color + "55" : "#E5E7EB"}`,
                    transition: `background ${0.15 + i * 0.02}s ease`,
                }} />
            ))}
        </div>
    );
}

/* ── CHART 4 · GRADIENT SPARK AREA (Behavior Score) ── */
function SparkArea({ data, color }: { data: number[], color: string }) {
    const W = 116, H = 42;
    const max = Math.max(...data), min = Math.min(...data) - 2;
    const pts = data.map((v: number, i: number) => [
        (i / (data.length - 1)) * W,
        H - ((v - min) / (max - min)) * (H - 6),
    ]);
    const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
    const areaD = `${lineD} L${W} ${H} L0 ${H} Z`;
    const uid = color.replace("#", "sg");
    return (
        <svg width={W} height={H}>
            <defs>
                <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${uid})`} />
            <path d={lineD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x, y], i) => i === pts.length - 1 && <circle key={i} cx={x} cy={y} r={3.5} fill={color} />)}
        </svg>
    );
}

/* ── CHART 5 · BULLET GAUGE (Weather-Driven Usage) ── */
function BulletGauge({ baseline, weatherLoad, color }: { baseline: number, weatherLoad: number, color: string }) {
    return (
        <div>
            <div style={{ height: 16, borderRadius: 8, background: "#F3F4F6", overflow: "hidden", display: "flex" }}>
                <div style={{ flex: baseline, background: "#CBD5E1", transition: "flex 1s ease" }} />
                <div style={{ flex: weatherLoad, background: color, transition: "flex 1s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 9.5, color: "#9CA3AF", fontFamily: "DM Sans,sans-serif" }}>Baseline {baseline} kWh</span>
                <span style={{ fontSize: 9.5, color, fontWeight: 700, fontFamily: "DM Sans,sans-serif" }}>+{weatherLoad} kWh weather</span>
            </div>
        </div>
    );
}

/* ── CHART 6 · HEATMAP STRIP (Heating/Cooling Cost) ── */
function HeatmapStrip({ values, color }: { values: number[], color: string }) {
    const max = Math.max(...values);
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    return (
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {values.map((v, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: color, opacity: 0.12 + (v / max) * 0.88,
                        transition: `opacity ${0.3 + i * 0.05}s ease`,
                    }} />
                    <span style={{ fontSize: 8, color: "#9CA3AF", fontFamily: "DM Sans,sans-serif" }}>{days[i]}</span>
                </div>
            ))}
        </div>
    );
}

/* ── CHART 7 · RANGE BAND (Optimal Temp Window) ── */
function RangeBand({ min, optLow, optHigh, max, color }: { min: number, optLow: number, optHigh: number, max: number, color: string }) {
    const span = max - min;
    const toP = (v: number) => ((v - min) / span) * 100;
    return (
        <div>
            <div style={{ position: "relative", height: 16, borderRadius: 8, background: "#F3F4F6" }}>
                <div style={{
                    position: "absolute", left: `${toP(optLow)}%`,
                    width: `${toP(optHigh) - toP(optLow)}%`, height: "100%",
                    borderRadius: 8, background: `linear-gradient(90deg, ${color}88, ${color})`,
                    transition: "all 1s ease",
                }} />
                {[optLow, optHigh].map(v => (
                    <div key={v} style={{
                        position: "absolute", left: `${toP(v)}%`,
                        top: -5, width: 2, height: 26,
                        background: color, borderRadius: 2,
                    }} />
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 9, color: "#9CA3AF", fontFamily: "DM Sans,sans-serif" }}>{min}°F</span>
                <span style={{ fontSize: 9, color, fontWeight: 700, fontFamily: "DM Sans,sans-serif" }}>Sweet Spot {optLow}–{optHigh}°F</span>
                <span style={{ fontSize: 9, color: "#9CA3AF", fontFamily: "DM Sans,sans-serif" }}>{max}°F</span>
            </div>
        </div>
    );
}

/* ── CHART 8 · FORECAST STEP CHART (7-Day Forecast) ── */
function ForecastSteps({ data, color }: { data: number[], color: string }) {
    const W = 116, H = 44, max = Math.max(...data);
    const bW = W / data.length - 2;
    const days = ["T", "F", "S", "S", "M", "T", "W"];
    return (
        <div>
            <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
                <defs>
                    <linearGradient id="fcg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                    </linearGradient>
                </defs>
                {data.map((v, i) => {
                    const bh = (v / max) * (H - 4);
                    return <rect key={i} x={i * (bW + 2)} y={H - bh} width={bW} height={bh} rx={3} fill="url(#fcg)" />;
                })}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 3 }}>
                {days.map((d, i) => <span key={i} style={{ fontSize: 8, color: "#9CA3AF", fontFamily: "DM Sans,sans-serif" }}>{d}</span>)}
            </div>
        </div>
    );
}

/* ── CHART RENDERER ── */
function ChartBlock({ kpi }: { kpi: any }) {
    const { chartType: t, chartData: d, color } = kpi;
    return (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${color}30` }}>
            {t === "radial" && <div style={{ display: "flex", justifyContent: "center" }}><RadialGauge pct={d.pct} color={color} /></div>}
            {t === "dots" && <DotMatrix pct={d.pct} color={color} />}
            {t === "waffle" && <div style={{ display: "flex", justifyContent: "center" }}><WaffleChart pct={d.pct} color={color} /></div>}
            {t === "spark" && <div style={{ display: "flex", justifyContent: "center" }}><SparkArea data={d.data} color={color} /></div>}
            {t === "bullet" && <BulletGauge baseline={d.baseline} weatherLoad={d.weatherLoad} color={color} />}
            {t === "heatmap" && <HeatmapStrip values={d.values} color={color} />}
            {t === "range" && <RangeBand {...d} color={color} />}
            {t === "forecast" && <ForecastSteps data={d.data} color={color} />}
            <p className="kpi-card-note" style={{ marginTop: 8, fontSize: 9, fontFamily: "DM Sans,sans-serif", fontStyle: "italic", lineHeight: 1.4 }}>
                {kpi.chartNote}
            </p>
        </div>
    );
}

/* ── KPI DATA ── */
export const peerKPIs = [
    {
        icon: "🏆", label: "Efficiency Rank", value: "Top 18%",
        sub: "Among 4,320 similar homes nearby",
        delta: "+3 positions vs last month", deltaUp: true,
        color: "#7C3AED", bg: "rgba(124,58,237,0.07)", border: "rgba(124,58,237,0.15)",
        chartType: "radial",
        chartNote: "Radial Arc Gauge — SVG arc sweeps to your percentile. 82% of peers use more than you.",
        chartData: { pct: 82 },
    },
    {
        icon: "⚡", label: "Peer Avg Usage", value: "1,043 kWh",
        sub: "You use 193 kWh less this month",
        delta: "−18.5% below average", deltaUp: true,
        color: "#0EA5E9", bg: "rgba(14,165,233,0.07)", border: "rgba(14,165,233,0.15)",
        chartType: "dots",
        chartNote: "Dot Matrix — 50 dots, each = 2% of peers. Blue dots = households using more than you.",
        chartData: { pct: 82 },
    },
    {
        icon: "💰", label: "Savings vs Peers", value: "+$22 saved",
        sub: "Compared to avg peer spend this month",
        delta: "$264 saved annually at this rate", deltaUp: true,
        color: "#10B981", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.15)",
        chartType: "waffle",
        chartNote: "Waffle Chart — 5×5 grid, each cell = 4% of monthly budget. Green = your savings share.",
        chartData: { pct: 68 },
    },
    {
        icon: "📊", label: "Behavior Score", value: "82 / 100",
        sub: "Off-peak shifting & HVAC efficiency",
        delta: "+6 pts vs last billing cycle", deltaUp: true,
        color: "#F59E0B", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.15)",
        chartType: "spark",
        chartNote: "Gradient Spark Area — filled area trend over your last 8 billing cycles.",
        chartData: { data: [61, 65, 59, 68, 72, 74, 76, 82] },
    },
];

export const weatherKPIs = [
    {
        icon: "🌡️", label: "Weather-Driven Usage", value: "+134 kWh",
        sub: "Attributed to temperature swings",
        delta: "15.7% of total bill is weather-caused", deltaUp: false,
        color: "#EF4444", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.15)",
        chartType: "bullet",
        chartNote: "Bullet Gauge — stacked bar splits baseline (grey) vs weather-attributable load (red).",
        chartData: { baseline: 716, weatherLoad: 134 },
    },
    {
        icon: "🔥", label: "Heating / Cooling Cost", value: "$38",
        sub: "HVAC weather load this billing cycle",
        delta: "−$9 vs same period last year", deltaUp: true,
        color: "#F97316", bg: "rgba(249,115,22,0.07)", border: "rgba(249,115,22,0.15)",
        chartType: "heatmap",
        chartNote: "Heatmap Strip — 7-day daily HVAC cost intensity. Darker cell = higher that-day spend.",
        chartData: { values: [4, 6, 7, 5, 8, 4, 4] },
    },
    {
        icon: "🎯", label: "Optimal Temp Window", value: "68°F – 72°F",
        sub: "Your most efficient comfort range",
        delta: "Saves ~$14/mo when maintained", deltaUp: true,
        color: "#10B981", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.15)",
        chartType: "range",
        chartNote: "Range Band — horizontal scale from 55–90°F. Green band marks your optimal savings zone.",
        chartData: { min: 55, optLow: 68, optHigh: 72, max: 90 },
    },
    {
        icon: "🌩️", label: "7-Day Forecast Impact", value: "+62 kWh est.",
        sub: "Cold front expected Mar 6–9",
        delta: "Pre-heat at off-peak to save $8", deltaUp: false,
        color: "#6366F1", bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.15)",
        chartType: "forecast",
        chartNote: "Forecast Step Chart — projected daily kWh for next 7 days from weather model.",
        chartData: { data: [6, 8, 12, 13, 11, 7, 5] },
    },
];

/* ── KPI CARD ── */
export function EnhancedKPICard({ kpi, index }: { kpi: any, index: number }) {
    return (
        <div
            className="kpi-card"
            style={{
                borderRadius: 8, padding: "20px 22px 18px",
                flex: "1 1 0", minWidth: 0,
                transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                position: "relative", overflow: "hidden",
                animation: "kpiIn 0.5s ease both",
                animationDelay: `${index * 0.09}s`,
            }}
        >
            <div style={{
                position: "absolute", top: 0, right: 0, width: 90, height: 90,
                background: `radial-gradient(circle at top right, ${kpi.color}18 0%, transparent 70%)`,
                borderRadius: "0 8px 0 0", pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                    fontSize: 18, background: kpi.bg, border: `1px solid ${kpi.border}`,
                    borderRadius: 10, width: 38, height: 38,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{kpi.icon}</span>
                <span className="kpi-card-label" style={{
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif",
                }}>{kpi.label}</span>
            </div>

            <div className="kpi-card-value" style={{
                fontSize: 25, fontWeight: 800,
                fontFamily: "Sora,sans-serif", letterSpacing: "-0.5px", lineHeight: 1.1,
                transition: "color 0.2s", marginBottom: 5,
            }}>{kpi.value}</div>

            <div className="kpi-card-sub" style={{ fontSize: 11.5, fontFamily: "DM Sans,sans-serif", marginBottom: 10, lineHeight: 1.4 }}>
                {kpi.sub}
            </div>

            <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: kpi.deltaUp ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                color: kpi.deltaUp ? "#059669" : "#DC2626",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10.5, fontWeight: 600, fontFamily: "DM Sans,sans-serif",
            }}>
                {kpi.deltaUp ? "▲" : "▼"} {kpi.delta}
            </div>

            <ChartBlock kpi={kpi} />
        </div>
    );
}

export default function EnhancedKPISection({ kpis }: { kpis: any[] }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32, width: "100%" }}>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
            @keyframes kpiIn { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
            {kpis.map((kpi, i) => <EnhancedKPICard key={i} kpi={kpi} index={i} />)}
        </div>
    );
}
