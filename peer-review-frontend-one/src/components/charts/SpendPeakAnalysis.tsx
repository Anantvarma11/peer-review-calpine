import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import {
    monthTotals, monthCosts, annualCostFull, savedVsPeer, dailyCostAvg,
    MN, MNF, peakByMonth, offpkByMonth, totalPeakKwh, totalOffpkKwh,
    PEAK_RATIO, OFFPK_RATIO, hourAvgs, PEAK_HOURS
} from "@/lib/usageDummyData";
import { MoneyRegular, FireRegular } from '@fluentui/react-icons';

export function SpendPeakAnalysis() {
    const [hoveredSpend, setHoveredSpend] = useState<number | null>(null);
    const [hoveredPeak, setHoveredPeak] = useState<number | null>(null);
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);

    // Spend Chart math
    const sW = 600;
    const sH = 220;
    const sP = { l: 44, r: 60, t: 18, b: 32 };
    const scW = sW - sP.l - sP.r;
    const scH = sH - sP.t - sP.b;

    const maxMo = Math.max(...monthCosts) * 1.18;
    const maxCum = annualCostFull * 1.1;
    const yL = (v: number) => sP.t + scH - (v / maxMo) * scH;
    const yR = (v: number) => sP.t + scH - (v / maxCum) * scH;

    const sStep = scW / 12;
    const sbW = sStep * 0.52;

    let cum = 0;
    const cumPts = monthCosts.map((c, m) => {
        cum += c;
        return { x: sP.l + m * sStep + sStep / 2, y: yR(cum), cum: +cum.toFixed(2), m };
    });
    const aTop = cumPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const cumulArr = (() => { let r = 0; return monthCosts.map(c => +(r += c).toFixed(2)); })();

    // Peak Donut math
    const dCx = 70;
    const dCy = 70;
    const dR = 50;
    const dCirc = 2 * Math.PI * dR;
    const pkDash = (dCirc * PEAK_RATIO).toFixed(1);
    const opDash = (dCirc * OFFPK_RATIO).toFixed(1);
    const dOffset = (dCirc * 0.25).toFixed(1);

    // Peak Monthly math
    const pmW = 400; // flexible container assumes viewBox scales
    const pmH = 200;
    const pmP = { l: 8, r: 8, t: 14, b: 28 };
    const pmcW = pmW - pmP.l - pmP.r;
    const pmcH = pmH - pmP.t - pmP.b;
    const maxV = Math.max(...monthTotals) * 1.12;
    const pmyS = (v: number) => pmP.t + pmcH - (v / maxV) * pmcH;
    const pmStep = pmcW / 12;
    const pmbW = pmStep * 0.6;

    // Peak Hourly math
    const phW = 400;
    const phH = 200;
    const phP = { l: 10, r: 10, t: 22, b: 36 };
    const phcW = phW - phP.l - phP.r;
    const phcH = phH - phP.t - phP.b;
    const maxHr = Math.max(...hourAvgs) * 1.15;
    const phyS = (v: number) => phP.t + phcH - (v / maxHr) * phcH;
    const phStep = phcW / 24;
    const phbW = phStep * 0.68;

    return (
        <div className="space-y-6 mb-3">
            {/* ── SPEND SECTION ── */}
            <div>
                <div className="flex items-center gap-3 mb-4 mt-6">
                    <h2 className="text-xl font-normal tracking-tight font-serif text-slate-900 flex items-center gap-2">
                        <MoneyRegular fontSize={24} className="text-slate-700" /> Spending
                    </h2>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)] border-l-4 border-l-orange-600">
                        <CardContent className="p-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Annual Bill</div>
                            <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight leading-none mb-1">${annualCostFull.toFixed(0)}</div>
                            <div className="text-xs text-slate-500">@ 24.5p / kWh · 2024</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)] border-l-4 border-l-emerald-600">
                        <CardContent className="p-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Saved vs Peers</div>
                            <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight leading-none mb-1">
                                {savedVsPeer >= 0 ? '$' : '-$'}{Math.abs(savedVsPeer).toFixed(0)}
                            </div>
                            <div className="text-xs text-slate-500">Cheaper than avg neighbour</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)] border-l-4 border-l-blue-600">
                        <CardContent className="p-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Daily Cost</div>
                            <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight leading-none mb-1">${dailyCostAvg}</div>
                            <div className="text-xs text-slate-500">Average per day</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                    <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Monthly Spend + Cumulative Total</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Bars = monthly $ cost · Line = running annual total</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-orange-600"></div>Monthly cost
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-700"></div>Cumulative
                                </div>
                            </div>
                        </div>

                        <div className="w-full aspect-[2.5/1] relative mt-2">
                            <svg viewBox={`0 0 ${sW} ${sH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                                {/* Left Y Grid */}
                                {[0, 20, 40, 60, 80, 100, 120].map(t => {
                                    if (t > maxMo + 5) return null;
                                    const y = yL(t).toFixed(1);
                                    return (
                                        <g key={`s-grid-${t}`}>
                                            <line x1={sP.l} y1={y} x2={sW - sP.r} y2={y} stroke="#E4E2DC" strokeWidth="1" strokeDasharray={t === 0 ? "none" : "3,4"} />
                                            <text x={sP.l - 5} y={+y + 3} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="end">${t}</text>
                                        </g>
                                    );
                                })}

                                {/* Cumulative Area Fill */}
                                <path
                                    d={`${aTop} L${cumPts[11].x.toFixed(1)},${(sP.t + scH).toFixed(1)} L${cumPts[0].x.toFixed(1)},${(sP.t + scH).toFixed(1)} Z`}
                                    fill="#1D4ED8" opacity="0.07"
                                />
                                {/* Cumulative Line */}
                                <path d={aTop} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Right Axis Labels */}
                                {[0, 100, 200, 300, 400, 500].map(t => {
                                    if (t > maxCum + 20) return null;
                                    const y = yR(t).toFixed(1);
                                    return <text key={`r-ax-${t}`} x={sW - sP.r + 6} y={+y + 3} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#1D4ED8" opacity="0.7" textAnchor="start">${t}</text>;
                                })}

                                <text x={(cumPts[11].x + 10).toFixed(1)} y={(cumPts[11].y + 4).toFixed(1)} fontFamily="DM Sans, sans-serif" fontSize="11" fill="#1D4ED8" fontWeight="700">
                                    ${cumPts[11].cum.toFixed(0)}
                                </text>
                                <text x={sW - 4} y={sP.t + scH / 2} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#1D4ED8" textAnchor="middle" transform={`rotate(90,${sW - 4},${sP.t + scH / 2})`} opacity="0.5">
                                    Cumulative $
                                </text>

                                {/* Bars and Dots */}
                                {monthCosts.map((c, m) => {
                                    const bx = sP.l + m * sStep + (sStep - sbW) / 2;
                                    const bh = ((c / maxMo) * scH).toFixed(1);
                                    const by = yL(c).toFixed(1);
                                    const avg = annualCostFull / 12;
                                    const col = c > avg * 1.15 ? '#DC2626' : (c < avg * 0.85 ? '#16A34A' : '#ea580c'); // orange-600 match

                                    const isHovered = hoveredSpend === m;
                                    const dim = hoveredSpend !== null && !isHovered;

                                    return (
                                        <g key={`s-m-${m}`}
                                            onMouseEnter={() => setHoveredSpend(m)}
                                            onMouseLeave={() => setHoveredSpend(null)}
                                            style={{ cursor: 'pointer', opacity: dim ? 0.3 : 1, transition: 'opacity 0.15s ease' }}>
                                            <rect x={bx} y={by} width={sbW} height={bh} rx="3" fill={col} opacity="0.82" />
                                            <circle cx={cumPts[m].x} cy={cumPts[m].y} r={m === 11 ? 5.5 : 3} fill="#1D4ED8" stroke="#fff" strokeWidth="2" />
                                            <text x={bx + sbW / 2} y={sH - 10} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="middle">{MN[m]}</text>

                                            {/* Spend SVG Tooltip */}
                                            {isHovered && (
                                                <g transform={`translate(${Math.max(20, Math.min(sW - 140, +bx - 55))}, ${Math.max(10, Math.min(+by - 80, +by - 80))})`} style={{ pointerEvents: 'none' }}>
                                                    <rect x="0" y="0" width="140" height="74" rx="4" fill="#1A1916" />
                                                    <text x="10" y="18" fill="#fff" fontSize="11" fontWeight="700" fontFamily="sans-serif">{MNF[m]} 2024</text>
                                                    <text x="10" y="34" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="sans-serif">Cost</text>
                                                    <text x="130" y="34" fill="#fff" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">${c.toFixed(2)}</text>
                                                    <text x="10" y="48" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="sans-serif">Usage</text>
                                                    <text x="130" y="48" fill="#fff" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">{monthTotals[m]} kWh</text>
                                                    <text x="10" y="62" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="sans-serif">Running</text>
                                                    <text x="130" y="62" fill="#fff" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">${cumulArr[m].toFixed(2)}</text>
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

            {/* ── PEAK vs OFF-PEAK SECTION ── */}
            <div>
                <div className="flex items-center gap-3 mb-4 mt-8">
                    <h2 className="text-xl font-normal tracking-tight font-serif text-slate-900 flex items-center gap-2">
                        <FireRegular fontSize={24} className="text-orange-600" /> Peak vs Off-Peak
                    </h2>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                        <CardContent className="p-4 h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Annual Split · 2024</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Peak = 7–9am & 4–8pm · Off-peak = all other hours</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 items-center flex-1">
                                <div className="flex flex-col items-center gap-3 w-[140px] shrink-0">
                                    <svg width="140" height="140" viewBox="0 0 140 140">
                                        <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#E4E2DC" strokeWidth="18" />
                                        <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#16A34A" strokeWidth="18"
                                            strokeDasharray={`${opDash} ${dCirc.toFixed(1)}`} strokeDashoffset={dOffset}
                                            strokeLinecap="butt" transform={`rotate(${PEAK_RATIO * 360} ${dCx} ${dCy})`} />
                                        <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#ea580c" strokeWidth="18"
                                            strokeDasharray={`${pkDash} ${dCirc.toFixed(1)}`} strokeDashoffset={dOffset} strokeLinecap="butt" />
                                        <text x={dCx} y={dCy - 4} textAnchor="middle" fontFamily="Instrument Serif, serif" fontSize="24" fill="#1A1916">{Math.round(PEAK_RATIO * 100)}%</text>
                                        <text x={dCx} y={dCy + 12} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10" fill="#9B9890" fontWeight="500">peak</text>
                                    </svg>
                                    <div className="flex flex-col gap-2 w-full text-xs">
                                        <div className="flex justify-between items-center text-slate-600">
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-orange-600"></div>Peak</div>
                                            <span className="font-bold text-slate-900">{totalPeakKwh} kWh</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-600">
                                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600"></div>Off-peak</div>
                                            <span className="font-bold text-slate-900">{totalOffpkKwh} kWh</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full relative h-[140px]">
                                    <svg viewBox={`0 0 ${pmW} ${pmH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                                        {/* Y Grid */}
                                        {[0, 100, 200, 300, 400, 500].map(t => {
                                            if (t > maxV + 10) return null;
                                            const y = pmyS(t).toFixed(1);
                                            return <line key={`pmg-${t}`} x1={pmP.l} y1={y} x2={pmW - pmP.r} y2={y} stroke="#E4E2DC" strokeWidth="1" strokeDasharray={t === 0 ? "none" : "3,4"} />;
                                        })}

                                        {/* Stacked Bars */}
                                        {monthTotals.map((tot, m) => {
                                            const bx = pmP.l + m * pmStep + (pmStep - pmbW) / 2;
                                            const opH = ((offpkByMonth[m] / maxV) * pmcH).toFixed(1);
                                            const pkH = ((peakByMonth[m] / maxV) * pmcH).toFixed(1);
                                            const opY = pmyS(offpkByMonth[m]).toFixed(1);
                                            const pkY = pmyS(tot).toFixed(1);

                                            return (
                                                <g key={`pm-${m}`}
                                                    onMouseEnter={() => setHoveredPeak(m)}
                                                    onMouseLeave={() => setHoveredPeak(null)}
                                                    style={{ cursor: 'pointer' }}>
                                                    <rect x={bx} y={opY} width={pmbW} height={opH} rx="0" fill="#16A34A" opacity="0.75" />
                                                    <rect x={bx} y={pkY} width={pmbW} height={pkH} rx="3 3 0 0" fill="#ea580c" opacity="0.82" />
                                                    <text x={bx + pmbW / 2} y={pmH - 10} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="middle">{MN[m]}</text>

                                                    {hoveredPeak === m && (
                                                        <g transform={`translate(${Math.max(0, Math.min(pmW - 130, +bx - 55))}, ${Math.max(0, +pkY - 45)})`} style={{ pointerEvents: 'none' }}>
                                                            <rect x="0" y="0" width="130" height="42" rx="4" fill="#1A1916" />
                                                            <text x="65" y="16" fill="#fff" fontSize="10" fontFamily="sans-serif" textAnchor="middle">{MNF[m]} 2024</text>
                                                            <text x="65" y="32" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
                                                                Pk: {peakByMonth[m]} · Off: {offpkByMonth[m]}
                                                            </text>
                                                        </g>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--bg-surface-1)] shadow-none border border-[var(--border-subtle)]">
                        <CardContent className="p-4 flex flex-col h-full">
                            <div className="mb-4">
                                <h3 className="text-[13px] font-semibold text-slate-900 tracking-tight">Daily Peak Hours Pattern</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Avg kWh per hour slot across the year</p>
                            </div>

                            <div className="w-full aspect-[2/1] relative mt-auto">
                                <svg viewBox={`0 0 ${phW} ${phH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full overflow-visible">
                                    {/* Peak Zones Background */}
                                    {Array.from(PEAK_HOURS).map(h => (
                                        <rect key={`zone-${h}`} x={(phP.l + h * phStep).toFixed(1)} y={phP.t} width={phStep.toFixed(1)} height={phcH} fill="#FFF3EE" rx="0" />
                                    ))}

                                    <line x1={phP.l} y1={(phP.t + phcH).toFixed(1)} x2={phW - phP.r} y2={(phP.t + phcH).toFixed(1)} stroke="#E4E2DC" strokeWidth="1" />

                                    {/* Header annotations */}
                                    <text x={(phP.l + 7.5 * phStep).toFixed(1)} y={phP.t - 5} fontFamily="DM Sans, sans-serif" fontSize="8" fill="#ea580c" textAnchor="middle" fontWeight="700" letterSpacing="0.5">MORNING PEAK</text>
                                    <text x={(phP.l + 17.5 * phStep).toFixed(1)} y={phP.t - 5} fontFamily="DM Sans, sans-serif" fontSize="8" fill="#ea580c" textAnchor="middle" fontWeight="700" letterSpacing="0.5">EVENING PEAK</text>
                                    <line x1={phP.l + 7 * phStep} y1={phP.t - 2} x2={phP.l + 9 * phStep} y2={phP.t - 2} stroke="#ea580c" strokeWidth="1.5" opacity="0.4" />
                                    <line x1={phP.l + 16 * phStep} y1={phP.t - 2} x2={phP.l + 20 * phStep} y2={phP.t - 2} stroke="#ea580c" strokeWidth="1.5" opacity="0.4" />

                                    {/* Hourly Bars */}
                                    {hourAvgs.map((val, h) => {
                                        const bx = phP.l + h * phStep + (phStep - phbW) / 2;
                                        const bh = ((val / maxHr) * phcH).toFixed(1);
                                        const by = phyS(val).toFixed(1);
                                        const isPk = PEAK_HOURS.has(h);

                                        return (
                                            <g key={`hr-${h}`}
                                                onMouseEnter={() => setHoveredHour(h)}
                                                onMouseLeave={() => setHoveredHour(null)}
                                                style={{ cursor: 'pointer' }}>
                                                <rect x={bx} y={by} width={phbW} height={bh} rx="2" fill={isPk ? '#ea580c' : 'var(--bg-root)'} stroke={isPk ? 'none' : 'var(--border-subtle)'} strokeWidth="1" opacity={isPk ? 0.88 : 1} />
                                                {h % 3 === 0 && (
                                                    <text x={phP.l + h * phStep + phStep / 2} y={phH - 18} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#9B9890" textAnchor="middle">{h}:00</text>
                                                )}

                                                {hoveredHour === h && (
                                                    <g transform={`translate(${Math.max(0, Math.min(phW - 140, +bx - 60))}, ${Math.max(0, +by - 40)})`} style={{ pointerEvents: 'none' }}>
                                                        <rect x="0" y="0" width="140" height="34" rx="4" fill="#1A1916" />
                                                        <text x="70" y="16" fill="#fff" fontSize="10" fontFamily="sans-serif" textAnchor="middle">{h}:00–{h + 1}:00</text>
                                                        <text x="70" y="28" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="sans-serif" textAnchor="middle">
                                                            {val.toFixed(3)} kWh avg · {isPk ? 'Peak' : 'Off-peak'}
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
            </div>
        </div>
    );
}
