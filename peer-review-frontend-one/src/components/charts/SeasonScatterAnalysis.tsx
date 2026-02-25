import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { seasonTotals, maxSeasonKwh, topHigh, topLow, allDays, YEAR, MNF } from "@/lib/usageDummyData";

export function SeasonScatterAnalysis() {
    const [hoveredDot, setHoveredDot] = useState<number | null>(null);

    // Scatter Plot math
    const W = 600;
    const H = 200;
    const PAD = { l: 34, r: 8, t: 8, b: 28 };
    const cW = W - PAD.l - PAD.r;
    const cH = H - PAD.t - PAD.b;

    const allTemp = allDays.map(d => d.tempAvg);
    const allKwh = allDays.map(d => d.kwh);
    const minT = Math.min(...allTemp);
    const maxT = Math.max(...allTemp);
    const minK = Math.min(...allKwh);
    const maxK = Math.max(...allKwh);

    const xS = (t: number) => PAD.l + ((t - minT) / (maxT - minT)) * cW;
    const yS = (k: number) => PAD.t + cH - ((k - minK) / (maxK - minK)) * cH;

    // Linear regression
    const n = allDays.length;
    const sumX = allTemp.reduce((a, b) => a + b, 0);
    const sumY = allKwh.reduce((a, b) => a + b, 0);
    const sumXY = allDays.reduce((a, d) => a + d.tempAvg * d.kwh, 0);
    const sumX2 = allTemp.reduce((a, b) => a + b * b, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Pearson r
    const meanX = sumX / n;
    const meanY = sumY / n;
    const cov = allDays.reduce((a, d) => a + (d.tempAvg - meanX) * (d.kwh - meanY), 0) / n;
    const sdX = Math.sqrt(allTemp.reduce((a, t) => a + (t - meanX) ** 2, 0) / n);
    const sdY = Math.sqrt(allKwh.reduce((a, k) => a + (k - meanY) ** 2, 0) / n);
    const r = (cov / (sdX * sdY)).toFixed(2);
    const correlationText = `r = ${r} (${Math.abs(+r) > 0.5 ? 'strong' : 'moderate'} negative)`;

    const rx1 = minT;
    const ry1 = slope * minT + intercept;
    const rx2 = maxT;
    const ry2 = slope * maxT + intercept;

    const MONTH_COLORS = [
        '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
        '#10B981', '#22C55E', '#84CC16', '#F59E0B',
        '#EF4444', '#F97316', '#0EA5E9', '#2563EB'
    ];

    const renderExtremeList = (days: any[], isHigh: boolean) => (
        <div className="flex flex-col">
            {days.map((d, i) => {
                const date = new Date(YEAR, d.m, d.day);
                const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const dow = date.toLocaleDateString('en-GB', { weekday: 'short' });
                const colorsHigh = ['#EF4444', '#F97316', '#FB923C', '#FCA5A5', '#FECACA'];
                const colorsLow = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];
                const col = isHigh ? colorsHigh[i] : colorsLow[i];

                return (
                    <div key={i} className={`flex items-center gap-3 py-2.5 ${i !== days.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: `${col}20`, color: col }}>
                            {i + 1}
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-medium text-slate-900">{dow}, {dateStr}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{MNF[d.m]} · {d.tempAvg}°F avg</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: col }}>
                            {d.kwh} kWh
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-3 mb-3">
            {/* Top Row: Seasons + Extremes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Card className="lg:col-span-2 bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                    <CardContent className="p-4">
                        <div className="mb-4">
                            <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Seasonal Breakdown</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Total kWh per season</p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {seasonTotals.map(s => {
                                const cost = (s.kwh * 0.245).toFixed(0);
                                const pct = Math.round((s.kwh / maxSeasonKwh) * 100);
                                return (
                                    <div key={s.name} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                        <div className="text-xl mb-1.5">{s.icon}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.name}</div>
                                        <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mt-1.5 mb-1">{s.kwh}</div>
                                        <div className="text-[10px] text-slate-500">kWh · ${cost}</div>
                                        <div className="h-1 bg-slate-200 mt-2.5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                        <CardContent className="p-4">
                            <div className="mb-2">
                                <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Peak Usage Days</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Top 3 highest days</p>
                            </div>
                            {renderExtremeList(topHigh.slice(0, 3), true)}
                        </CardContent>
                    </Card>
                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                        <CardContent className="p-4">
                            <div className="mb-2">
                                <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Lowest Usage Days</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Top 3 most efficient days</p>
                            </div>
                            {renderExtremeList(topLow.slice(0, 3), false)}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Row: Scatter Plot */}
            <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Usage vs Temperature</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Each dot = 1 day · colour = month</p>
                        </div>
                        <div className="bg-slate-100 text-[11px] font-medium text-slate-500 px-2 py-1 rounded">
                            Correlation: {correlationText}
                        </div>
                    </div>
                    <div className="w-full aspect-[3/1] relative">
                        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                            {/* X Grid (Temp) */}
                            {[-2, 2, 6, 10, 14, 18, 22, 26].map(t => {
                                if (t < minT - 1 || t > maxT + 1) return null;
                                const x = xS(t).toFixed(1);
                                return (
                                    <g key={`x-grid-${t}`}>
                                        <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + cH} stroke="#E8E6E0" strokeWidth="1" />
                                        <text x={x} y={H - 8} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="middle">{t}°</text>
                                    </g>
                                );
                            })}

                            {/* Y Grid (kWh) */}
                            {[0, 5, 10, 15, 20, 25, 30].map(k => {
                                if (k < minK - 1 || k > maxK + 1) return null;
                                const y = yS(k).toFixed(1);
                                return (
                                    <g key={`y-grid-${k}`}>
                                        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#E8E6E0" strokeWidth="1" />
                                        <text x={PAD.l - 3} y={+y + 3} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="end">{k}</text>
                                    </g>
                                );
                            })}

                            {/* Regression Line */}
                            <line
                                x1={xS(rx1).toFixed(1)} y1={yS(ry1).toFixed(1)}
                                x2={xS(rx2).toFixed(1)} y2={yS(ry2).toFixed(1)}
                                stroke="#E8521A" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.7"
                            />

                            {/* Dots */}
                            {allDays.map((d, i) => {
                                const cx = xS(d.tempAvg).toFixed(1);
                                const cy = yS(d.kwh).toFixed(1);
                                const col = MONTH_COLORS[d.m];
                                const isHovered = hoveredDot === i;

                                return (
                                    <g key={i}
                                        onMouseEnter={() => setHoveredDot(i)}
                                        onMouseLeave={() => setHoveredDot(null)}
                                        style={{ cursor: 'pointer' }}>
                                        <circle
                                            cx={cx} cy={cy}
                                            r={isHovered ? 5 : 3}
                                            fill={col}
                                            opacity={isHovered ? 1 : 0.65}
                                        />

                                        {/* SVG Tooltip */}
                                        {isHovered && (
                                            <g transform={`translate(${Math.max(10, Math.min(W - 140, +cx - 70))}, ${Math.max(10, Math.min(+cy - 26, +cy - 30))})`} style={{ pointerEvents: 'none' }}>
                                                <rect x="0" y="0" width="140" height="24" rx="4" fill="#1A1916" />
                                                <text x="70" y="16" fill="#fff" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
                                                    {new Date(YEAR, d.m, d.day).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · {d.kwh}kWh · {d.tempAvg}°F
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
