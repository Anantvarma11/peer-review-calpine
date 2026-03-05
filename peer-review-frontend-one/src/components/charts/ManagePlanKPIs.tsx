import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════
   CHART 1 · NEEDLE GAUGE — Plan Fit Score
══════════════════════════════════════════════════════ */
function NeedleGauge({ score, color }: { score: number; color: string }) {
    const [prog, setProg] = useState(0);
    useEffect(() => { const t = setTimeout(() => setProg(score), 350); return () => clearTimeout(t); }, [score]);

    const W = 130, H = 75, cx = 65, cy = 68, r = 52, rNeedle = 44;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const arcPath = (from: number, to: number, radius: number) => {
        const s = { x: cx + radius * Math.cos(toRad(180 - from)), y: cy - radius * Math.sin(toRad(180 - from)) };
        const e = { x: cx + radius * Math.cos(toRad(180 - to)), y: cy - radius * Math.sin(toRad(180 - to)) };
        return `M${s.x} ${s.y} A${radius} ${radius} 0 0 1 ${e.x} ${e.y}`;
    };
    const needleDeg = (prog / 100) * 180;
    const nx = cx + rNeedle * Math.cos(toRad(180 - needleDeg));
    const ny = cy - rNeedle * Math.sin(toRad(180 - needleDeg));

    const zones = [
        { from: 0, to: 60, color: "#FCA5A5" },
        { from: 60, to: 80, color: "#FCD34D" },
        { from: 80, to: 100, color: "#6EE7B7" },
    ];

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {zones.map((z, i) => (
                <path key={i} d={arcPath(z.from * 1.8, z.to * 1.8, r)} fill="none"
                    stroke={z.color} strokeWidth={10} strokeLinecap="butt" />
            ))}
            <line x1={cx} y1={cy} x2={nx} y2={ny}
                stroke={color} strokeWidth={2.5} strokeLinecap="round"
                style={{ transition: "x2 1.2s cubic-bezier(.4,0,.2,1), y2 1.2s cubic-bezier(.4,0,.2,1)" }}
            />
            <circle cx={cx} cy={cy} r={5} fill={color} />
            <text x={cx} y={cy - 14} textAnchor="middle" fontSize={13} fontWeight={800}
                fill={color} fontFamily="Sora,sans-serif">{score}</text>
            <text x={8} y={H - 2} fontSize={7.5} fill="var(--text-tertiary)" fontFamily="DM Sans,sans-serif">Poor</text>
            <text x={54} y={H - 2} fontSize={7.5} fill="var(--text-tertiary)" fontFamily="DM Sans,sans-serif">Fair</text>
            <text x={103} y={H - 2} fontSize={7.5} fill="var(--text-tertiary)" fontFamily="DM Sans,sans-serif">Good</text>
        </svg>
    );
}

/* ══════════════════════════════════════════════════════
   CHART 2 · STACKED DONUT — Budget vs Actual
══════════════════════════════════════════════════════ */
function StackedDonut({ spent, budget, color }: { spent: number; budget: number; color: string }) {
    const [prog, setProg] = useState(0);
    useEffect(() => { const t = setTimeout(() => setProg(spent / budget), 350); return () => clearTimeout(t); }, [spent, budget]);

    const cx = 52, cy = 52;
    const outerR = 40, innerR = 28;
    const circ = (r: number) => 2 * Math.PI * r;

    const outerDash = circ(outerR);
    const innerDash = circ(innerR);
    const spentDash = prog * innerDash;
    const alertColor = prog >= 0.9 ? "#EF4444" : prog >= 0.75 ? "#F59E0B" : color;

    return (
        <svg width={104} height={104} viewBox="0 0 104 104">
            {/* Outer track */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--border-default)" strokeWidth={6} />
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={color + "44"} strokeWidth={6}
                strokeDasharray={`${outerDash} 0`} strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`} />
            {/* Inner track */}
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--bg-surface-3)" strokeWidth={8} />
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={alertColor} strokeWidth={8}
                strokeDasharray={`${spentDash} ${innerDash}`} strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
            />
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize={13} fontWeight={800}
                fill={alertColor} fontFamily="Sora,sans-serif">${spent}</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)" fontFamily="DM Sans,sans-serif">of ${budget}</text>
        </svg>
    );
}

/* ══════════════════════════════════════════════════════
   CHART 3 · SCHEDULE TIMELINE — Peak Schedule Savings
══════════════════════════════════════════════════════ */
function ScheduleTimeline({ slots, color }: { slots: { start: number; end: number; label: string }[]; color: string }) {
    const W = 200, H = 48;
    const hourW = W / 24;
    const peakHours: [number, number][] = [[7, 9], [17, 21]];
    const isPeak = (h: number) => peakHours.some(([s, e]) => h >= s && h < e);

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {Array.from({ length: 24 }).map((_, h) => (
                <rect key={h} x={h * hourW} y={0} width={hourW - 0.5} height={22}
                    rx={2} fill={isPeak(h) ? "#FCA5A5" : color + "22"} />
            ))}
            {slots.map((s, i) => (
                <g key={i}>
                    <rect x={s.start * hourW} y={26} width={(s.end - s.start) * hourW - 1} height={16}
                        rx={4} fill={color} opacity={0.85} />
                    <text x={s.start * hourW + 4} y={38} fontSize={7} fill="#fff" fontFamily="DM Sans,sans-serif" fontWeight={600}>
                        {s.label}
                    </text>
                </g>
            ))}
            {[0, 6, 12, 18, 24].map(h => (
                <text key={h} x={h * hourW} y={H} fontSize={7} fill="var(--text-tertiary)" fontFamily="DM Sans,sans-serif">
                    {h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`}
                </text>
            ))}
        </svg>
    );
}

/* ══════════════════════════════════════════════════════
   CHART 4 · SAVINGS WATERFALL — Potential Plan Saving
══════════════════════════════════════════════════════ */
function SavingsWaterfall({ current, steps, final, color }: {
    current: number;
    steps: { val: number; label: string; color: string }[];
    final: number;
    color: string;
}) {
    const [prog, setProg] = useState(false);
    useEffect(() => { const t = setTimeout(() => setProg(true), 300); return () => clearTimeout(t); }, []);

    const W = 200, H = 72, barH = 28;
    const allVals = [current, ...steps.map(s => s.val), final];
    const maxVal = Math.max(...allVals);
    const toX = (v: number) => (v / maxVal) * (W - 4);

    let runningRight = toX(current);
    const blocks = steps.map(s => {
        const block = { right: runningRight, width: toX(s.val), label: s.label, color: s.color };
        runningRight -= toX(s.val);
        return block;
    });

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <rect x={0} y={0} width={prog ? toX(current) : 0} height={barH} rx={5}
                fill="var(--bg-surface-4)" style={{ transition: "width 0.8s ease" }} />
            <text x={4} y={barH / 2 + 4} fontSize={8} fill="var(--text-secondary)" fontFamily="DM Sans,sans-serif" fontWeight={600}>Current ${current}</text>

            {blocks.map((b, i) => (
                <g key={i}>
                    <rect x={prog ? b.right - b.width : b.right} y={0}
                        width={prog ? b.width : 0} height={barH} rx={0}
                        fill={b.color} opacity={0.82}
                        style={{ transition: `width 0.7s ${0.3 + i * 0.15}s ease, x 0.7s ${0.3 + i * 0.15}s ease` }} />
                    <text x={b.right - b.width / 2} y={barH - 8} textAnchor="middle"
                        fontSize={6.5} fill="#fff" fontFamily="DM Sans,sans-serif" fontWeight={700}>
                        {b.label}
                    </text>
                </g>
            ))}

            <rect x={0} y={barH + 10} width={prog ? toX(final) : 0} height={barH} rx={5}
                fill={color} style={{ transition: "width 1.1s 0.7s ease" }} />
            <text x={4} y={barH + 10 + barH / 2 + 4} fontSize={8} fill="#fff"
                fontFamily="DM Sans,sans-serif" fontWeight={700}>New Plan ${final} ✦ Save ${current - final}</text>

            <line x1={0} y1={barH + 5} x2={W} y2={barH + 5} stroke="var(--border-subtle)" strokeWidth={0.8} strokeDasharray="3,3" />
        </svg>
    );
}

/* ══════════════════════════════════════════════════════
   KPI DATA
══════════════════════════════════════════════════════ */
const manageKPIs = [
    {
        icon: "📋",
        label: "Plan Fit Score",
        value: "61 / 100",
        sub: "Your current Flat Rate plan underperforms your usage pattern",
        delta: "Time-of-Use plan scores 89 for your profile",
        deltaUp: false,
        cta: "See better plans →",
        color: "#F59E0B",
        bg: "rgba(245,158,11,0.07)",
        border: "rgba(245,158,11,0.15)",
        chartType: "needle" as const,
        chartNote: "Needle Gauge — speedometer across Poor / Fair / Good zones. Your needle sits in Fair, upgrade pushes it to Good.",
        chartData: { score: 61 },
        urgency: "Your plan fit is below average",
        urgencyColor: "#D97706",
    },
    {
        icon: "💳",
        label: "Budget vs Actual",
        value: "$107 / $120",
        sub: "89% of monthly budget used — 8 days remaining",
        delta: "Risk of overspend at current pace",
        deltaUp: false,
        cta: "Adjust budget →",
        color: "#6366F1",
        bg: "rgba(99,102,241,0.07)",
        border: "rgba(99,102,241,0.15)",
        chartType: "donut" as const,
        chartNote: "Stacked Donut — outer ring = budget cap, inner ring = actual spent. Ring turns amber then red as you approach limit.",
        chartData: { spent: 107, budget: 120 },
        urgency: "You may exceed budget this month",
        urgencyColor: "#EF4444",
    },
    {
        icon: "⏱️",
        label: "Peak Schedule Savings",
        value: "$14 / mo",
        sub: "3 appliances shifted to off-peak slots this month",
        delta: "+$9 more available if dishwasher is rescheduled",
        deltaUp: true,
        cta: "Add schedule →",
        color: "#0EA5E9",
        bg: "rgba(14,165,233,0.07)",
        border: "rgba(14,165,233,0.15)",
        chartType: "schedule" as const,
        chartNote: "Schedule Timeline — 24h strip. Red blocks = peak rate hours. Blue pills = your scheduled appliances. Gaps = missed savings.",
        chartData: {
            slots: [
                { start: 22, end: 24, label: "Washer" },
                { start: 1, end: 3, label: "EV" },
                { start: 13, end: 14, label: "Dish" },
            ],
        },
        urgency: "Dishwasher still running at peak rate",
        urgencyColor: "#0284C7",
    },
    {
        icon: "✦",
        label: "Potential Plan Saving",
        value: "$32 / mo",
        sub: "Switching to Time-of-Use plan saves $384 per year",
        delta: "Best match: TOU Flex Rate — available now",
        deltaUp: true,
        cta: "Upgrade plan →",
        color: "#10B981",
        bg: "rgba(16,185,129,0.07)",
        border: "rgba(16,185,129,0.15)",
        chartType: "waterfall" as const,
        chartNote: "Savings Waterfall — current bill bar shrinks via labelled saving blocks (off-peak, tier, fee) into your new lower bill.",
        chartData: {
            current: 128,
            steps: [
                { val: 18, label: "Off-peak", color: "#34D399" },
                { val: 9, label: "Tier", color: "#6EE7B7" },
                { val: 5, label: "Fees", color: "#A7F3D0" },
            ],
            final: 96,
        },
        urgency: "Highest-impact action on this page",
        urgencyColor: "#059669",
    },
];

/* ══════════════════════════════════════════════════════
   CHART RENDERER
══════════════════════════════════════════════════════ */
function ChartBlock({ kpi }: { kpi: typeof manageKPIs[number] }) {
    const { chartType: t, chartData: d, color } = kpi;
    return (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${color}30` }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
                {t === "needle" && <NeedleGauge score={(d as any).score} color={color} />}
                {t === "donut" && <StackedDonut spent={(d as any).spent} budget={(d as any).budget} color={color} />}
                {t === "schedule" && <ScheduleTimeline slots={(d as any).slots} color={color} />}
                {t === "waterfall" && <SavingsWaterfall current={(d as any).current} steps={(d as any).steps} final={(d as any).final} color={color} />}
            </div>
            {/* Note uses CSS class so it inherits --text-tertiary in dark mode */}
            <p className="kpi-card-note" style={{ marginTop: 8, fontSize: 9, fontFamily: "DM Sans,sans-serif", fontStyle: "italic", lineHeight: 1.5 }}>
                📐 {kpi.chartNote}
            </p>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   KPI CARD — themed via CSS classes + CSS variables
   Card bg, text, and dividers all respect dark/light mode.
══════════════════════════════════════════════════════ */
function ManagePlanKPICard({ kpi, index }: { kpi: typeof manageKPIs[number]; index: number }) {
    return (
        <div
            className="kpi-card"
            style={{
                borderRadius: 8,
                padding: "20px 22px 18px",
                flex: "1 1 0",
                minWidth: 0,
                transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                position: "relative",
                overflow: "hidden",
                animation: "kpiIn 0.5s ease both",
                animationDelay: `${index * 0.09}s`,
                display: "flex",
                flexDirection: "column" as const,
            }}
        >
            {/* Radial accent glow */}
            <div style={{
                position: "absolute", top: 0, right: 0, width: 90, height: 90,
                background: `radial-gradient(circle at top right, ${kpi.color}18 0%, transparent 70%)`,
                borderRadius: "0 8px 0 0", pointerEvents: "none",
            }} />

            {/* Header: icon + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                    fontSize: 18,
                    background: kpi.bg,
                    border: `1px solid ${kpi.border}`,
                    borderRadius: 10, width: 38, height: 38,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                }}>{kpi.icon}</span>
                <span className="kpi-card-label" style={{
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif",
                }}>{kpi.label}</span>
            </div>

            {/* Value */}
            <div className="kpi-card-value" style={{
                fontSize: 25, fontWeight: 800,
                fontFamily: "Sora,sans-serif", letterSpacing: "-0.5px",
                lineHeight: 1.1, marginBottom: 5,
            }}>{kpi.value}</div>

            {/* Sub-text */}
            <div className="kpi-card-sub" style={{
                fontSize: 11.5, fontFamily: "DM Sans,sans-serif", lineHeight: 1.4, marginBottom: 10,
            }}>{kpi.sub}</div>

            {/* Delta badge */}
            <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: kpi.deltaUp ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                color: kpi.deltaUp ? "#059669" : "#DC2626",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10.5, fontWeight: 600, fontFamily: "DM Sans,sans-serif",
            }}>
                {kpi.deltaUp ? "▲" : "▼"} {kpi.delta}
            </div>

            {/* Chart */}
            <ChartBlock kpi={kpi} />

            {/* Urgency strip */}
            <div style={{
                marginTop: 12,
                background: kpi.urgencyColor + "15",
                border: `1px solid ${kpi.urgencyColor}35`,
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 10.5,
                color: kpi.urgencyColor,
                fontFamily: "DM Sans,sans-serif",
                fontWeight: 600,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
            }}>
                <span>⚠ {kpi.urgency}</span>
                <span style={{
                    background: kpi.color, color: "#fff",
                    borderRadius: 12, padding: "2px 9px",
                    fontSize: 10, fontWeight: 700, cursor: "pointer",
                    fontFamily: "DM Sans,sans-serif",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                }}>{kpi.cta}</span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   EXPORT — Section wrapper
══════════════════════════════════════════════════════ */
export default function ManagePlanKPIs() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32, width: "100%" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes kpiIn { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
            {manageKPIs.map((kpi, i) => <ManagePlanKPICard key={i} kpi={kpi} index={i} />)}
        </div>
    );
}
