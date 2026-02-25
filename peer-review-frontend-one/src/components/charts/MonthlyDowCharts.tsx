import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { monthTotals, peerMonthly, MN, MNF, dowAvgs, DOW_NAMES, maxDow } from "@/lib/usageDummyData";

export function MonthlyDowCharts() {
    const W = 600;
    const H = 180;
    const PAD = { l: 32, r: 8, t: 12, b: 28 };
    const cW = W - PAD.l - PAD.r;
    const cH = H - PAD.t - PAD.b;

    const allVals = [...monthTotals, ...peerMonthly];
    const maxVal = Math.max(...allVals);
    const yS = (v: number) => PAD.t + cH - (v / maxVal) * cH;

    const grp = cW / 12;
    const bW = grp * 0.32;
    const gap = grp * 0.08;

    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

    const DOW_COLORS = ['#6366F1', '#6366F1', '#6366F1', '#6366F1', '#F59E0B', '#EF4444', '#EF4444'];
    const peakIdx = dowAvgs.indexOf(maxDow);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            {/* Monthly Bar Chart */}
            <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)] overflow-visible">
                <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Monthly Consumption</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Your usage vs peer group average</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#1A1916]"></div>
                                You
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                <div className="w-2.5 h-2.5 rounded-[1px] bg-[#D1D0CB]"></div>
                                Peer avg
                            </div>
                        </div>
                    </div>

                    <div className="w-full aspect-[2/1] relative">
                        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                            {/* Y Grid */}
                            {[0, 100, 200, 300, 400, 500].map(t => {
                                if (t > maxVal + 30) return null;
                                const y = yS(t).toFixed(1);
                                return (
                                    <g key={`grid-${t}`}>
                                        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#E8E6E0" strokeWidth="1" strokeDasharray={t === 0 ? "none" : "3,4"} />
                                        <text x={PAD.l - 4} y={+y + 3} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="end">{t}</text>
                                    </g>
                                );
                            })}

                            {/* Peer Trend Line */}
                            <path
                                d={"M " + peerMonthly.map((v, m) => `${(PAD.l + m * grp + grp * 0.5 + bW / 2 + gap / 2).toFixed(1)},${yS(v).toFixed(1)}`).join(' L ')}
                                fill="none"
                                stroke="#D1D0CB"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                                opacity="0.5"
                            />

                            {/* Bars */}
                            {MN.map((mName, m) => {
                                const cx = PAD.l + m * grp + grp * 0.5;
                                const youX = cx - bW - gap / 2;
                                const avgX = cx + gap / 2;
                                const youH = ((monthTotals[m] / maxVal) * cH).toFixed(1);
                                const avgH = ((peerMonthly[m] / maxVal) * cH).toFixed(1);
                                const youY = yS(monthTotals[m]).toFixed(1);
                                const avgY = yS(peerMonthly[m]).toFixed(1);

                                const isLow = monthTotals[m] < peerMonthly[m];
                                const barColor = isLow ? '#1A1916' : '#E8521A'; // Greenish if below, Orange if above (per original mock design)

                                const isHovered = hoveredMonth === m;
                                const shouldDim = hoveredMonth !== null && !isHovered;

                                return (
                                    <g key={`bars-${m}`}
                                        onMouseEnter={() => setHoveredMonth(m)}
                                        onMouseLeave={() => setHoveredMonth(null)}
                                        style={{ cursor: 'pointer', opacity: shouldDim ? 0.3 : 1, transition: 'opacity 0.15s ease' }}>
                                        <rect x={youX} y={youY} width={bW} height={youH} rx="2" fill={barColor} />
                                        <rect x={avgX} y={avgY} width={bW} height={avgH} rx="2" fill="#D1D0CB" />
                                        <text x={cx} y={H - 8} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="middle">{mName}</text>

                                        {/* Pure SVG Tooltip */}
                                        {isHovered && (
                                            <g transform={`translate(${Math.max(30, Math.min(W - 130, cx - 65))}, ${Math.max(10, Math.min(+youY - 50, +avgY - 50))})`}>
                                                <rect x="0" y="0" width="130" height="66" rx="4" fill="#1A1916" />
                                                <text x="10" y="16" fill="#fff" fontSize="11" fontWeight="600" fontFamily="sans-serif">{MNF[m]} 2024</text>

                                                <text x="10" y="32" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="sans-serif">Your usage</text>
                                                <text x="120" y="32" fill="#fff" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">{monthTotals[m]} kWh</text>

                                                <text x="10" y="46" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="sans-serif">Peer avg</text>
                                                <text x="120" y="46" fill="#fff" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">{peerMonthly[m]} kWh</text>

                                                <text x="10" y="60" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="sans-serif">Difference</text>
                                                <text x="120" y="60" fill={monthTotals[m] - peerMonthly[m] < 0 ? '#6EE7A0' : '#FCA5A5'} fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">
                                                    {(monthTotals[m] - peerMonthly[m] >= 0 ? '+' : '') + Math.round(monthTotals[m] - peerMonthly[m])} kWh
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

            {/* Day of Week Pattern */}
            <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Day-of-Week Pattern</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Avg daily usage by weekday</p>
                        </div>
                        <div className="bg-slate-100 text-[11px] font-medium text-slate-500 px-2 py-1 rounded">
                            Peak: {DOW_NAMES[peakIdx]}
                        </div>
                    </div>

                    <div className="flex items-end gap-2.5 h-[120px] mt-auto">
                        {dowAvgs.map((avg, i) => {
                            const pct = Math.max((avg / maxDow) * 100, 5); // Minimum 5% height
                            const isPeak = i === peakIdx;
                            return (
                                <div key={DOW_NAMES[i]} className="flex-1 flex flex-col items-center">
                                    <span className="text-[10px] font-semibold text-slate-600 mb-1.5">{avg}</span>
                                    <div className="w-full h-[80px] bg-slate-50 rounded-t flex items-end overflow-hidden group">
                                        <div
                                            className="w-full rounded-t transition-all duration-500 group-hover:brightness-110"
                                            style={{
                                                height: `${pct}%`,
                                                backgroundColor: DOW_COLORS[i],
                                                opacity: isPeak ? 1 : 0.55
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400 mt-2">{DOW_NAMES[i]}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
