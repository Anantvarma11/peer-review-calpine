import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Sun, Moon } from 'lucide-react';
import { mergeClasses } from '@fluentui/react-components';
import { SparkleRegular } from '@fluentui/react-icons';
import { AskAIBar } from '@/components/ai/AskAIBar';
import { HIST_YEARS, HIST_MONTHLY, peerMonthly, monthTotals, RATE, PEAK_HOURS, hourAvgs, dowAvgs, DOW_NAMES } from '@/lib/usageDummyData';

// ── CONSTANTS ────────────────────────────────────────────
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MNF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const GUTTER_W = 64; // Width for y-axis and legends on the left
const WEEKEND_DAYS = new Set([5, 6]);


function getDaysInMonth(year: number) {
    return [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}

// US realistic monthly temp profiles (min°F, max°F)
const TEMP_PROFILES = [
    { min: 1, max: 7 },   // Jan
    { min: 1, max: 8 },   // Feb
    { min: 3, max: 11 },  // Mar
    { min: 5, max: 15 },  // Apr
    { min: 8, max: 19 },  // May
    { min: 11, max: 22 },  // Jun
    { min: 13, max: 25 },  // Jul
    { min: 13, max: 24 },  // Aug
    { min: 10, max: 20 },  // Sep
    { min: 7, max: 15 },  // Oct
    { min: 4, max: 10 },  // Nov
    { min: 2, max: 7 },   // Dec
];

// Monthly energy profiles
const PROFILES = [
    { kwh: 12.3, avg: 16.8, pct: 12 }, { kwh: 12.1, avg: 17.5, pct: 9 },
    { kwh: 9.4, avg: 13.2, pct: 15 }, { kwh: 7.0, avg: 9.3, pct: 22 },
    { kwh: 5.6, avg: 6.8, pct: 38 }, { kwh: 5.0, avg: 5.2, pct: 52 },
    { kwh: 5.5, avg: 4.8, pct: 64 }, { kwh: 6.3, avg: 5.0, pct: 78 },
    { kwh: 7.7, avg: 6.7, pct: 60 }, { kwh: 10.0, avg: 11.0, pct: 41 },
    { kwh: 13.7, avg: 15.3, pct: 26 }, { kwh: 16.8, avg: 17.7, pct: 44 },
];

const COLOR_MAP: Record<string, string> = {
    g4: '#00A32A', g3: '#1A9E3A', g2: '#7EE89A', g1: '#C8F5D0',
    a1: '#FFF0B3', a2: '#FFC107', a3: '#E08000',
    r1: '#FFAB9F', r2: '#E53935', r3: '#B71C1C'
};

const FIRST_NAMES = ['Oliver', 'Amelia', 'Harry', 'Isla', 'George', 'Sophia', 'Jack', 'Emily', 'Charlie', 'Grace', 'James', 'Lily', 'William', 'Ava', 'Thomas', 'Mia', 'Joshua', 'Ella', 'Henry', 'Scarlett', 'Ethan', 'Daisy', 'Daniel', 'Poppy', 'Noah', 'Hannah', 'Samuel', 'Freya', 'Oscar', 'Ruby', 'Alfie', 'Chloe', 'Leo', 'Lucy', 'Max', 'Alice', 'Lucas', 'Evie', 'Isaac', 'Millie', 'Dylan', 'Rosie', 'Benjamin', 'Ellie', 'Mason', 'Zoe', 'Archie'];
const LAST_NAMES = ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts', 'Johnson', 'Walker', 'Wright', 'Robinson', 'Thompson', 'White', 'Hughes', 'Edwards', 'Green', 'Hall', 'Lewis', 'Harris', 'Clarke', 'Patel', 'Jackson', 'Wood', 'Turner', 'Martin', 'Cooper', 'Hill', 'Ward', 'Morris', 'Moore', 'Clark', 'Lee', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Young', 'Scott', 'King', 'Phillips', 'Watson', 'Cox'];
const SIZES = ['85 m²', '90 m²', '88 m²', '92 m²', '87 m²', '91 m²', '86 m²', '89 m²', '93 m²', '84 m²'];
const BUILDS = ['1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995'];
const OCCS = ['2 adults', '2 adults, 1 child', '3 adults', '2 adults, 2 children', '1 adult', '4 adults', '2 adults, 3 children'];

// ── UTILS ────────────────────────────────────────────────
function seededRand(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

function getCC(p: number) {
    if (p <= 10) return 'g4'; if (p <= 25) return 'g3'; if (p <= 40) return 'g4'; if (p <= 50) return 'g1';
    if (p <= 58) return 'a1'; if (p <= 70) return 'a2'; if (p <= 80) return 'a3';
    if (p <= 90) return 'r1'; if (p <= 95) return 'r2'; return 'r3';
}

function getRankLabel(p: number) {
    if (p <= 10) return 'Top 10%'; if (p <= 25) return 'Top 25%'; if (p <= 40) return 'Top 40%'; if (p <= 50) return 'Top half';
    if (p <= 58) return 'Near Avg'; if (p <= 70) return 'Above Avg'; if (p <= 80) return 'High Usage';
    if (p <= 90) return 'Very High'; return 'Bottom 5%';
}

function getDow(year: number, m: number, d: number) {
    return (new Date(year, m, d).getDay() + 6) % 7;
}

// ── COMPONENT ────────────────────────────────────────────
interface EnergyPeerHeatmapProps {
    hideTabs?: boolean;
    hideHeatmap?: boolean;
    hideTrendLine?: boolean;
    isMyUsagePage?: boolean;
}

export const EnergyPeerHeatmap: React.FC<EnergyPeerHeatmapProps> = ({ hideTabs, hideHeatmap, hideTrendLine, isMyUsagePage }) => {
    const [activeYear, setActiveYear] = useState(new Date().getFullYear());
    const [viewMode] = useState<'annual' | 'monthly' | 'daily'>('annual');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [activeMonth, setActiveMonth] = useState(-1);
    const [hoverData, setHoverData] = useState<any>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const axisColor = "var(--text-secondary)";
    const gridColor = "var(--border-default)";
    const tooltipBg = "var(--bg-surface-1)";
    const tooltipBorder = "var(--border-subtle)";
    const tooltipText = "var(--text-primary)";
    const [monthRects, setMonthRects] = useState<any[]>([]);
    const [sidebarTab, setSidebarTab] = useState<'insights' | 'chat'>('insights');

    const insightsData = [
        {
            time: "1 hr ago",
            text: "Energy usage remains elevated after midnight, indicating inactive devices drawing continuous background power."
        },
        {
            time: "3 hrs ago",
            text: "Base load consumption shows minimal fluctuation across days, suggesting always-on appliances contributing steady energy drain."
        },
        {
            time: "4 hrs ago",
            text: "Short high-intensity spikes observed during morning hours align with simultaneous appliance usage patterns."
        },
        {
            time: "1 day ago",
            text: "Monthly consumption trend is stabilizing, with variance reduced by approximately 6% compared to previous cycles."
        },
        {
            time: "2 days ago",
            text: "Efficiency performance improves on low-temperature days, indicating reduced HVAC dependency."
        },
        {
            time: "3 days ago",
            text: "Forecast model predicts consumption normalization if current usage behavior remains unchanged."
        },
        {
            time: "5 days ago",
            text: "Peak demand events occur in concentrated intervals rather than distributed usage, increasing cost impact under time-based tariffs."
        },
        {
            time: "1 week ago",
            text: "Energy recovery periods are visible after peak hours, suggesting automated systems or scheduled shutdowns are partially effective."
        },
        {
            time: "1 week ago",
            text: "Consumption baseline remains higher than optimal idle thresholds, indicating opportunity for automation or smart scheduling."
        },
        {
            time: "2 weeks ago",
            text: "Usage consistency score suggests predictable behavioral patterns suitable for optimization recommendations."
        },
        {
            time: "3 weeks ago",
            text: "Late-month consumption acceleration detected, historically correlating with higher final billing amounts."
        },
        {
            time: "1 month ago",
            text: "Comparative analysis shows current usage efficiency outperforming last quarter averages despite similar total consumption."
        }
    ].slice(0, 6); // Only taking the first 6 as requested

    const containerRef = useRef<HTMLDivElement>(null);
    const monthsRowRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Generate Data (Memoized)
    const { yearData, allDays, neighbours, monthStats, dayPeerStats, DIM } = useMemo(() => {
        const DIM = getDaysInMonth(activeYear);
        const rand = seededRand(activeYear * 10000 + 101);
        const yData = PROFILES.map((p, m) =>
            Array.from({ length: DIM[m] }, (_, di) => {
                const tp = TEMP_PROFILES[m];
                const tempMin = +(tp.min + (rand() - 0.5) * 3).toFixed(1);
                const tempMax = +(tp.max + (rand() - 0.5) * 4).toFixed(1);
                const tempAvg = +((tempMin + tempMax) / 2).toFixed(1);
                const totalKwh = +(p.kwh * (0.55 + rand() * 0.9)).toFixed(1);
                const dayRatio = 0.55 + rand() * 0.2;
                const dayKwh = +(totalKwh * dayRatio).toFixed(1);
                const nightKwh = +(totalKwh - dayKwh).toFixed(1);

                // Generate 24 hourly bars - DYNAMIC AS PER USAGE
                const hourlyKwh = Array.from({ length: 24 }, (_, h) => {
                    // Improved unique seed: year + month*1000 + day*100 + hour
                    const seedVal = (activeYear * 10000) + (m * 500) + ((di + 1) * 31) + h;
                    const hRand = seededRand(seedVal)();

                    // Base distribution: peaks around morning and evening, but with random shifts
                    const morningPeak = 6 + hRand * 4; // 6am to 10am
                    const eveningPeak = 17 + hRand * 5; // 5pm to 10pm

                    const base = 0.2 +
                        Math.exp(-Math.pow(h - morningPeak, 2) / (4 + hRand * 6)) +
                        Math.exp(-Math.pow(h - eveningPeak, 2) / (6 + hRand * 8)) +
                        hRand * 0.5; // Base noise

                    return Math.max(0.1, base);
                });
                const hSum = hourlyKwh.reduce((s, v) => s + v, 0);
                const scaledHourly = hourlyKwh.map(v => +(v / hSum * totalKwh).toFixed(2));

                const scaledLimit = hourlyKwh.map((_, h) => {
                    const seedVal = (activeYear * 20000) + (m * 700) + ((di + 1) * 55) + h;
                    const lRand = seededRand(seedVal)();
                    // Limit is roughly 120% of the peer average, with some variation
                    const baseLimit = (p.avg / 24) * 1.2;
                    return +(baseLimit * (0.9 + lRand * 0.4)).toFixed(2);
                });

                return {
                    kwh: totalKwh,
                    dayKwh,
                    nightKwh,
                    hourlyKwh: scaledHourly,
                    hourlyLimit: scaledLimit,
                    avg: +(p.avg * (0.70 + rand() * 0.6)).toFixed(1),
                    pct: Math.max(2, Math.min(98, Math.round(p.pct + (rand() - 0.5) * 44))),
                    tempMin, tempMax, tempAvg,
                    m, d: di + 1
                };
            })
        );

        const days: any[] = [];
        yData.forEach(mArr => mArr.forEach(d => {
            days.push(d);
        }));

        const nbrRandGen = seededRand(99887766);
        const nbrs = Array.from({ length: 47 }, (_, i) => {
            const fi = Math.floor(nbrRandGen() * FIRST_NAMES.length);
            const li = Math.floor(nbrRandGen() * LAST_NAMES.length);
            return {
                id: `N-${String(i + 1).padStart(3, '0')}`,
                name: `${FIRST_NAMES[fi]} ${LAST_NAMES[li]}`,
                size: SIZES[Math.floor(nbrRandGen() * SIZES.length)],
                build: BUILDS[Math.floor(nbrRandGen() * BUILDS.length)],
                occ: OCCS[Math.floor(nbrRandGen() * OCCS.length)],
                baseMulti: 0.6 + nbrRandGen() * 0.8
            };
        });

        const nbrMonthly = nbrs.map(n =>
            PROFILES.map((p, m) => {
                const base = p.avg * DIM[m];
                return +(base * n.baseMulti * (0.88 + nbrRandGen() * 0.24)).toFixed(0);
            })
        );

        const myMonthly = yData.map(mArr => +mArr.reduce((s, d) => s + d.kwh, 0).toFixed(0));

        const mStats = MN.map((_, m) => {
            const vals = nbrs.map((_, ni) => ({ ni, kwh: nbrMonthly[ni][m] }));
            vals.sort((a, b) => b.kwh - a.kwh);
            const highest = vals[0];
            const lowest = vals[vals.length - 1];
            const predictedKwh = +(myMonthly[m] * (0.85 + rand() * 0.3)).toFixed(0);
            return {
                myKwh: myMonthly[m],
                predictedKwh,
                highestNi: highest.ni,
                highestKwh: highest.kwh,
                lowestNi: lowest.ni,
                lowestKwh: lowest.kwh,
                allMax: highest.kwh
            };
        });

        const dPeerStats = yData.map((mArr, _m) =>
            mArr.map((d, _di) => {
                const dayPredicted = +(d.kwh * (0.85 + rand() * 0.3)).toFixed(1);
                const dayHighest = +(d.kwh * (1.2 + rand() * 0.6)).toFixed(1);
                const dayLowest = +(d.kwh * (0.4 + rand() * 0.4)).toFixed(1);

                const dayRatio = 0.55 + rand() * 0.2;
                const dailyTotal = d.kwh;
                const dayKwh = +(dailyTotal * dayRatio).toFixed(1);
                const nightKwh = +(dailyTotal - dayKwh).toFixed(1);

                return {
                    highestKwh: dayHighest,
                    lowestKwh: dayLowest,
                    myKwh: dailyTotal,
                    dayKwh,
                    nightKwh,
                    predictedKwh: dayPredicted,
                    highestNi: Math.floor(rand() * nbrs.length),
                    lowestNi: Math.floor(rand() * nbrs.length),
                    allMax: dayHighest
                };
            })
        );

        return {
            yearData: yData,
            allDays: days,
            neighbours: nbrs,
            monthStats: mStats,
            dayPeerStats: dPeerStats,
            DIM
        };
    }, [activeYear]);

    // Handle Measurements
    const updateMeasurements = useCallback(() => {
        if (hideHeatmap) {
            if (chartContainerRef.current) {
                const w = chartContainerRef.current.offsetWidth - GUTTER_W;
                const slotW = w / 12;
                const rects = MN.map((_, i) => ({
                    left: i * slotW,
                    right: (i + 1) * slotW,
                    width: slotW,
                    mid: i * slotW + slotW / 2
                }));
                setMonthRects(rects);
            }
            return;
        }

        if (!monthsRowRef.current) return;
        const blocks = monthsRowRef.current.querySelectorAll('.month-block');
        const rects = Array.from(blocks).map(b => {
            const r = (b as HTMLElement);
            return {
                left: r.offsetLeft,
                right: r.offsetLeft + r.offsetWidth,
                width: r.offsetWidth,
                mid: r.offsetLeft + r.offsetWidth / 2
            };
        });
        setMonthRects(rects);
    }, []);

    useEffect(() => {
        updateMeasurements();
        window.addEventListener('resize', updateMeasurements);
        return () => window.removeEventListener('resize', updateMeasurements);
    }, [updateMeasurements]);

    // Handle Tooltip Position
    const onMouseMove = (e: React.MouseEvent) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const tempChartData = useMemo(() => {
        if (monthRects.length < 12) return null;
        const allMin = Math.min(...allDays.map(d => d.tempMin));
        const allMax = Math.max(...allDays.map(d => d.tempMax));
        const tRange = (allMax - allMin) || 1;
        const H = 240; // Matched with Peer Comparison chart
        const PAD_T = 28, PAD_B = 32; // Matching Peer Comparison chart padding
        const chartH = H - PAD_T - PAD_B;
        const yS = (t: number) => PAD_T + chartH - ((t - allMin) / tRange) * chartH;

        // kWh Scale (Left Axis)
        const maxKwh = Math.max(...monthStats.map(s => s.myKwh)) * 1.1;
        const yKwh = (v: number) => PAD_T + chartH - (v / maxKwh) * chartH;

        return { yS, allMin, allMax, H, PAD_T, chartH, maxKwh, yKwh };
    }, [allDays, monthRects, monthStats]);

    // Neighbour Chart Calculations (removed nbrChartData since we replaced it with Peak Hours Pattern)



    return (
        <div ref={containerRef} className="energy-peer-heatmap-container text-[var(--text-primary)]" onMouseMove={onMouseMove}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .month-block { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
                .month-grid { display: grid; grid-template-columns: repeat(7, 7px); gap: 1px; }
                .day-cell { width: 7px; height: 7px; border-radius: 1.2px; cursor: pointer; transition: transform .1s, outline .1s; }
                .day-cell.empty { background: transparent; cursor: default; pointer-events: none; }
                .day-cell:not(.empty):not(.future):hover { transform: scale(3); z-index: 50; outline: 1px solid rgba(0,0,0,.25); }
                .day-cell.future { background: #E5E7EB !important; cursor: default; opacity: 0.5; }
                .m-col { transition: opacity 0.15s; }

                .g4 { background: #00A32A } .g3 { background: #1A9E3A } .g2 { background: #7EE89A } .g1 { background: #C8F5D0 }
                .a1 { background: #FFF0B3 } .a2 { background: #FFC107 } .a3 { background: #E08000 }
                .r1 { background: #FFAB9F } .r2 { background: #E53935 } .r3 { background: #B71C1C }

                .tooltip-floating { 
                    position: fixed; 
                    background: ${tooltipBg}; 
                    border: 1px solid ${tooltipBorder}; 
                    color: ${tooltipText};
                    border-radius: 8px; 
                    pointer-events: none; 
                    z-index: 999; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.12); 
                    padding: 12px; 
                    min-width: 220px; 
                }
            `}} />


            <Card className="border border-[var(--border-subtle)] shadow-none overflow-hidden bg-[var(--bg-surface-1)]">
                <CardContent className="p-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div ref={cardRef} className="flex-1 min-w-0">

                            {/* Sub-header: year tabs or year dropdown + month tabs */}
                            {!hideTabs && (viewMode === 'annual' ? (
                                <div className="mb-4">
                                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface-2)] rounded-lg w-fit">
                                        {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                                            <button
                                                key={y}
                                                onClick={() => setActiveYear(y)}
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeYear === y
                                                    ? 'bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                                                    : 'text-[var(--text-secondary)] hover:text-blue-600 transition-colors'
                                                    }`}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mt-2">⚡ Annual Performance</div>
                                </div>
                            ) : viewMode === 'monthly' ? (
                                <div className="mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <select
                                            value={activeYear}
                                            onChange={(e: any) => setActiveYear(Number(e.target.value))}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300"
                                        >
                                            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface-2)] rounded-lg">
                                            {MN.map((name, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedMonth(i)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedMonth === i
                                                        ? 'bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                                                        : 'text-[var(--text-secondary)] hover:text-blue-600 transition-colors'
                                                        }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">📅 Monthly Performance — {MNF[selectedMonth]} {activeYear}</div>
                                </div>
                            ) : null)}

                            {/* ═══ ANNUAL VIEW ═══ */}
                            {viewMode === 'annual' && (
                                <>
                                    {/* TEMPERATURE CHART */}
                                    <div className="mb-2" ref={chartContainerRef}>
                                        <div className="flex items-center justify-start gap-4 mb-2">
                                            {hideHeatmap ? (
                                                <div className="flex items-center justify-between w-full">
                                                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Usage History</h3>
                                                    <div className="flex gap-3 text-[10px] text-[var(--text-primary)]">
                                                        <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t-2 border-dashed border-red-500"></div>Plan Limit</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t-2 border-blue-500"></div>Avg Usage</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#E2E8F0]"></div>2020</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#CBD5E1]"></div>2021</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#94A3B8]"></div>2022</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#64748B]"></div>2023</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#1E293B]"></div>2024</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3 text-[10px] text-[var(--text-primary)]">
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-1 rounded bg-blue-500"></div>Min</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-1 rounded bg-orange-500"></div>Max</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t border-dashed border-purple-500"></div>Avg</div>
                                                </div>
                                            )}
                                        </div>
                                        {tempChartData && monthRects.length >= 12 && (
                                            <svg width="100%" height={tempChartData.H} className="overflow-visible">
                                                <defs>
                                                    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0" stopColor="#F97316" stopOpacity="0.15" />
                                                        <stop offset="1" stopColor="#3B82F6" stopOpacity="0.15" />
                                                    </linearGradient>
                                                </defs>
                                                {/* Usage Bars */}
                                                {MN.map((_, m) => {
                                                    if (!monthRects[m]) return null;

                                                    if (hideHeatmap) {
                                                        const cx = GUTTER_W + monthRects[m].mid;
                                                        const barW = 6;
                                                        const gap = 2;
                                                        const totalW = 5 * barW + 4 * gap;
                                                        const startX = cx - totalW / 2;

                                                        return (
                                                            <React.Fragment key={`hist-${m}`}>
                                                                {HIST_YEARS.map((y, i) => {
                                                                    const val = HIST_MONTHLY[y as keyof typeof HIST_MONTHLY][m];
                                                                    const barH = tempChartData.chartH - (tempChartData.yKwh(val) - tempChartData.PAD_T);
                                                                    const barColors = ["#FFF7ED", "#FFEDD5", "#FED7AA", "#FDBA74", "#FB923C"];
                                                                    const baseColor = barColors[i];
                                                                    const isHovered = hoverData?.type === 'usage-month' && hoverData.month === m;

                                                                    return (
                                                                        <rect
                                                                            key={`hist-${m}-${y}`}
                                                                            x={startX + i * (barW + gap)}
                                                                            y={tempChartData.yKwh(val)}
                                                                            width={barW}
                                                                            height={Math.max(0, barH)}
                                                                            fill={baseColor}
                                                                            rx={2}
                                                                            opacity={hoverData?.type === 'usage-month' ? (isHovered ? 1 : 0.5) : 1}
                                                                            style={{ transition: 'all 0.2s' }}
                                                                        />
                                                                    );
                                                                })}
                                                                <rect
                                                                    x={startX - gap}
                                                                    y={0}
                                                                    width={totalW + gap * 2}
                                                                    height={tempChartData.H}
                                                                    fill="transparent"
                                                                    onMouseEnter={(e) => {
                                                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                                                        setHoverData({
                                                                            type: 'usage-month',
                                                                            month: m,
                                                                        });
                                                                    }}
                                                                    onMouseLeave={() => setHoverData(null)}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </React.Fragment>
                                                        );
                                                    } else {
                                                        const stat = monthStats[m];
                                                        const barH = tempChartData.chartH - (tempChartData.yKwh(stat.myKwh) - tempChartData.PAD_T);
                                                        const x = GUTTER_W + monthRects[m].mid - 12;
                                                        return (
                                                            <rect
                                                                key={`usage-${m}`}
                                                                x={x}
                                                                y={tempChartData.yKwh(stat.myKwh)}
                                                                width={24}
                                                                height={barH}
                                                                fill={hoverData?.type === 'usage-bar' && hoverData.month === m ? "#EA580C" : "#F97316"}
                                                                opacity={hoverData?.type === 'usage-bar' && hoverData.month === m ? 1 : 0.8}
                                                                rx={4}
                                                                onMouseEnter={(e) => {
                                                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                                                    setHoverData({
                                                                        type: 'usage-bar',
                                                                        month: m,
                                                                        kwh: stat.myKwh,
                                                                        cost: (stat.myKwh * 0.12).toFixed(2)
                                                                    });
                                                                }}
                                                                onMouseLeave={() => setHoverData(null)}
                                                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                            />
                                                        );
                                                    }
                                                })}

                                                {/* Avg Usage Trend Line */}
                                                {!hideTrendLine && (
                                                    <>
                                                        <polyline
                                                            points={MN.map((_, m) => {
                                                                if (!monthRects[m]) return '';
                                                                const usages = HIST_YEARS.map(y => HIST_MONTHLY[y as keyof typeof HIST_MONTHLY][m]);
                                                                const avg = usages.reduce((a, b) => a + b, 0) / usages.length;
                                                                return `${GUTTER_W + monthRects[m].mid},${tempChartData.yKwh(avg)}`;
                                                            }).filter(Boolean).join(' ')}
                                                            fill="none" stroke="#2563EB" strokeWidth="2"
                                                        />
                                                        {MN.map((_, m) => {
                                                            if (!monthRects[m]) return null;
                                                            const cx = GUTTER_W + monthRects[m].mid;
                                                            const usages = HIST_YEARS.map(y => HIST_MONTHLY[y as keyof typeof HIST_MONTHLY][m]);
                                                            const avg = usages.reduce((a, b) => a + b, 0) / usages.length;
                                                            const cy = tempChartData.yKwh(avg);
                                                            return (
                                                                <g key={`avg-dot-${m}`}>
                                                                    <circle cx={cx} cy={cy} r={3.5} fill="#2563EB" stroke="#fff" strokeWidth={1.5} />
                                                                    <text x={cx} y={cy - 12} fontSize="11" fill="#2563EB" textAnchor="middle" fontWeight="bold">{Math.round(avg)}</text>
                                                                </g>
                                                            );
                                                        })}
                                                    </>
                                                )}

                                                {/* kWh grid & labels (Left Axis) */}
                                                {[0, Math.round(tempChartData.maxKwh / 2), Math.round(tempChartData.maxKwh)].map(v => {
                                                    const y = tempChartData.yKwh(v);
                                                    return (
                                                        <React.Fragment key={`kwh-${v}`}>
                                                            <line x1={GUTTER_W} y1={y} x2={GUTTER_W + (monthRects[11]?.right || 0)} y2={y} stroke={gridColor} strokeWidth="0.5" strokeDasharray="2,2" opacity={0.3} />
                                                            <text x={GUTTER_W - 8} y={y + 3} fontSize="9" fill={axisColor} textAnchor="end" fontWeight="600">{v}k</text>
                                                        </React.Fragment>
                                                    );
                                                })}

                                                {/* Temperature grid & Fahrenheit labels (Right Axis) */}
                                                {hideHeatmap ? null : [0, 10, 20, 30].map(t => {
                                                    const y = tempChartData.yS(t);
                                                    const f = Math.round(t * 9 / 5 + 32);
                                                    const chartRight = GUTTER_W + (monthRects[11]?.right || 0);
                                                    return (
                                                        <React.Fragment key={`temp-${t}`}>
                                                            <line x1={GUTTER_W} y1={y} x2={chartRight} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="3,4" />
                                                            <text x={chartRight + 8} y={y + 3} fontSize="9" fill={axisColor} textAnchor="start">{f}°F</text>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {MN.map((_, m) => {
                                                    if (!monthRects[m]) return null;
                                                    const x = GUTTER_W + monthRects[m].left;
                                                    return <line key={m} x1={x} y1={0} x2={x} y2={tempChartData.H} stroke={gridColor} strokeWidth="1" strokeDasharray="2,2" />;
                                                })}
                                                {hideHeatmap ? null : (() => {
                                                    const tempPoints = MN.map((_, m) => {
                                                        if (!monthRects[m]) return null;
                                                        const mData = yearData[m];
                                                        const maxT = Math.max(...mData.map((d: any) => d.tempMax));
                                                        const minT = Math.min(...mData.map((d: any) => d.tempMin));
                                                        const avgT = +(mData.reduce((s: number, d: any) => s + d.tempAvg, 0) / mData.length).toFixed(1);
                                                        return { cx: GUTTER_W + monthRects[m].mid, maxT, minT, avgT };
                                                    }).filter(Boolean) as { cx: number; maxT: number; minT: number; avgT: number }[];
                                                    const maxLine = tempPoints.map(p => `${p.cx},${tempChartData.yS(p.maxT)}`).join(' ');
                                                    const minLine = tempPoints.map(p => `${p.cx},${tempChartData.yS(p.minT)}`).join(' ');
                                                    const avgLine = tempPoints.map(p => `${p.cx},${tempChartData.yS(p.avgT)}`).join(' ');
                                                    return (
                                                        <>
                                                            <polyline points={maxLine} fill="none" stroke="#F97316" strokeWidth={1.5} opacity={0.6} />
                                                            <polyline points={minLine} fill="none" stroke="#3B82F6" strokeWidth={1.5} opacity={0.6} />
                                                            <polyline points={avgLine} fill="none" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
                                                        </>
                                                    );
                                                })()}
                                                {MN.map((_, m) => {
                                                    if (!monthRects[m]) return null;
                                                    const cx = GUTTER_W + monthRects[m].mid;

                                                    if (hideHeatmap) {
                                                        return <text key={m} x={cx} y={tempChartData.H - 4} fontSize="10" fill={axisColor} textAnchor="middle" className="opacity-50">{MN[m]}</text>;
                                                    }

                                                    const mData = yearData[m];
                                                    const maxT = Math.max(...mData.map((d: any) => d.tempMax));
                                                    const minT = Math.min(...mData.map((d: any) => d.tempMin));
                                                    const avgT = +(mData.reduce((s: number, d: any) => s + d.tempAvg, 0) / mData.length).toFixed(1);
                                                    return (
                                                        <React.Fragment key={m}>
                                                            <rect x={cx - 6} y={tempChartData.yS(maxT)} width={12} height={tempChartData.yS(minT) - tempChartData.yS(maxT)} fill="url(#bandGrad)" rx={4} />
                                                            <circle cx={cx} cy={tempChartData.yS(maxT)} r={2.5} fill="#F97316"
                                                                onMouseEnter={() => setHoverData({ type: 'temp', month: m, max: maxT, min: minT, avg: avgT })}
                                                                onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                            <circle cx={cx} cy={tempChartData.yS(minT)} r={2.5} fill="#3B82F6"
                                                                onMouseEnter={() => setHoverData({ type: 'temp', month: m, max: maxT, min: minT, avg: avgT })}
                                                                onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                            <line x1={cx} y1={tempChartData.yS(avgT) - 3} x2={cx} y2={tempChartData.yS(avgT) + 3} stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="2,2" />
                                                            <text x={cx} y={tempChartData.H - 4} fontSize="10" fill={axisColor} textAnchor="middle" className="opacity-50">{MN[m]}</text>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {hideHeatmap && (() => {
                                                    const limitY = tempChartData.yKwh(560); // Example plan limit at 560 kWh
                                                    const chartRight = GUTTER_W + (monthRects[11]?.right || 0);

                                                    return (
                                                        <g className="pointer-events-none">
                                                            <line x1={GUTTER_W} y1={limitY} x2={chartRight} y2={limitY} stroke="#EF4444" strokeWidth="2" strokeDasharray="4,4" opacity={1} />
                                                        </g>
                                                    );
                                                })()}
                                            </svg>
                                        )}
                                    </div>

                                    {/* HEATMAP GRID */}
                                    {!hideHeatmap && (
                                        <div className="flex items-start gap-0 mt-4">
                                            <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-center gap-0 pr-4 border-r border-[var(--border-subtle)] shrink-0 py-2">
                                                <span className="text-[8px] text-emerald-600 font-bold mb-1">Best</span>
                                                <div className="w-2 rounded-full flex-1 min-h-[60px] bg-gradient-to-b from-[#00A32A] via-[#FFD700] to-[#B71C1C]" />
                                                <span className="text-[8px] text-rose-600 font-bold mt-1">Worst</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div ref={monthsRowRef} className="flex justify-start gap-4 overflow-hidden relative">
                                                    {MN.map((mName, m) => {
                                                        const mData = yearData[m];
                                                        const firstDow = getDow(activeYear, m, 1);
                                                        const totalKwh = mData.reduce((s: number, d: any) => s + d.kwh, 0).toFixed(0);
                                                        const weeks = Math.ceil((firstDow + DIM[m]) / 7);
                                                        return (
                                                            <div key={mName} className={mergeClasses("month-block", activeMonth !== -1 && activeMonth !== m && "opacity-20 transition-opacity", activeMonth === m && "ring-1 ring-[var(--border-subtle)] rounded-lg p-1.5 -m-1.5")}>
                                                                <div className={mergeClasses("text-[9px] font-bold uppercase text-[var(--text-secondary)] mb-1", activeMonth === m && "text-[var(--text-primary)]")}>{mName}</div>
                                                                <div className="dow-row grid grid-cols-7 gap-px mb-1">
                                                                    {DOW.map((l, i) => <div key={i} className="w-[7px] text-[5px] font-bold text-[var(--text-secondary)] text-center leading-none">{l}</div>)}
                                                                </div>
                                                                <div className="month-grid">
                                                                    {Array.from({ length: weeks * 7 }).map((_, i) => {
                                                                        const di = i - firstDow;
                                                                        if (di < 0 || di >= DIM[m]) return <div key={i} className="day-cell empty" />;
                                                                        const day = mData[di];
                                                                        const today = new Date();
                                                                        const isFuture = activeYear === today.getFullYear() && (m > today.getMonth() || (m === today.getMonth() && (di + 1) > today.getDate()));
                                                                        if (isFuture) return <div key={i} className="day-cell future" />;
                                                                        return (
                                                                            <div key={i} className={`day-cell ${getCC(day.pct)}`}
                                                                                onMouseEnter={() => { setActiveMonth(m); setHoverData({ type: 'day', ...day }); }}
                                                                                onMouseLeave={() => { setActiveMonth(-1); setHoverData(null); }} />
                                                                        );
                                                                    })}
                                                                </div>
                                                                <div className="text-[10px] text-[var(--text-secondary)] mt-1"><strong>{totalKwh}</strong> kWh</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CONDITIONAL CHART SECTION */}
                                    <div className="mt-8">
                                        {isMyUsagePage ? (
                                            /* PEER COMPARISON & REDUCED SIZE CHART (PEAK PATTERNS) */
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Daily Peak Hours Pattern Chart */}
                                                <div className="col-span-1 flex flex-col">
                                                    <div className="mb-2 pl-1">
                                                        <h3 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-widest">📊 Daily Peak Hours Pattern</h3>
                                                        <p className="text-[12px] text-[var(--text-primary)] font-medium mt-0.5 opacity-80">Avg kWh per hour slot across the year</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg p-3 border border-[var(--border-subtle)] min-h-[220px]">
                                                        {(() => {
                                                            const maxHr = Math.max(...hourAvgs) * 1.15;
                                                            const H = 180, W = 400;
                                                            const PAD = { l: 30, r: 10, t: 10, b: 30 };
                                                            const cH = H - PAD.t - PAD.b, cW = W - PAD.l - PAD.r;
                                                            const yS = (v: number) => PAD.t + cH - (v / maxHr) * cH;
                                                            const xS = (h: number) => PAD.l + ((h + 0.5) / 24) * cW;
                                                            const bW = (cW / 24) * 0.7;

                                                            return (
                                                                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
                                                                    {[0, Math.round(maxHr / 2), Math.round(maxHr)].map(v => (
                                                                        <React.Fragment key={v}>
                                                                            <line x1={PAD.l} y1={yS(v)} x2={PAD.l + cW} y2={yS(v)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,4" />
                                                                            <text x={PAD.l - 5} y={yS(v) + 3} fontSize="9" fill="var(--text-secondary)" textAnchor="end">{v} kWh</text>
                                                                        </React.Fragment>
                                                                    ))}
                                                                    {hourAvgs.map((val, h) => {
                                                                        const isPk = PEAK_HOURS.has(h);
                                                                        return (
                                                                            <g key={h}
                                                                                onMouseEnter={(e) => {
                                                                                    setHoverData({ type: 'peak-hour', hour: h, val, isPk });
                                                                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                                                                }}
                                                                                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                                                                onMouseLeave={() => setHoverData(null)}
                                                                            >
                                                                                <rect x={xS(h) - bW / 2} y={yS(val)} width={bW} height={Math.max(2, cH - (yS(val) - PAD.t))}
                                                                                    fill={isPk ? '#ea580c' : '#3b82f6'} rx={2} opacity={0.8} />
                                                                                {h % 4 === 0 && <text x={xS(h)} y={H - 5} fontSize="9" fill="var(--text-secondary)" textAnchor="middle">{h}:00</text>}
                                                                            </g>
                                                                        );
                                                                    })}
                                                                </svg>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Weekly Peak Days Pattern Chart */}
                                                <div className="col-span-1 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] pt-4 lg:pt-0 lg:pl-6 flex flex-col">
                                                    <div className="mb-2 pl-1">
                                                        <h3 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-widest">📊 Weekly Peak Days Pattern</h3>
                                                        <p className="text-[12px] text-[var(--text-primary)] font-medium mt-0.5 opacity-80">Avg kWh per day across the week</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg p-3 border border-[var(--border-subtle)] min-h-[220px]">
                                                        {(() => {
                                                            const maxD = Math.max(...dowAvgs) * 1.15;
                                                            const H = 180, W = 400;
                                                            const PAD = { l: 30, r: 10, t: 10, b: 30 };
                                                            const cH = H - PAD.t - PAD.b, cW = W - PAD.l - PAD.r;
                                                            const yS = (v: number) => PAD.t + cH - (v / maxD) * cH;
                                                            const xS = (d: number) => PAD.l + ((d + 0.5) / 7) * cW;
                                                            const bW = (cW / 7) * 0.7;

                                                            return (
                                                                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
                                                                    {[0, Math.round(maxD / 2), Math.round(maxD)].map(v => (
                                                                        <React.Fragment key={v}>
                                                                            <line x1={PAD.l} y1={yS(v)} x2={PAD.l + cW} y2={yS(v)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,4" />
                                                                            <text x={PAD.l - 5} y={yS(v) + 3} fontSize="9" fill="var(--text-secondary)" textAnchor="end">{v} kWh</text>
                                                                        </React.Fragment>
                                                                    ))}
                                                                    {dowAvgs.map((val, d) => {
                                                                        const isWeekend = WEEKEND_DAYS.has(d);
                                                                        return (
                                                                            <g key={d}
                                                                                onMouseEnter={(e) => {
                                                                                    setHoverData({ type: 'peak-day', day: d, val, isWeekend });
                                                                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                                                                }}
                                                                                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                                                                onMouseLeave={() => setHoverData(null)}
                                                                            >
                                                                                <rect x={xS(d) - bW / 2} y={yS(val)} width={bW} height={Math.max(2, cH - (yS(val) - PAD.t))}
                                                                                    fill={isWeekend ? '#ea580c' : '#3b82f6'} rx={2} opacity={0.8} />
                                                                                <text x={xS(d)} y={H - 5} fontSize="9" fill="var(--text-secondary)" textAnchor="middle">{DOW_NAMES[d]}</text>
                                                                            </g>
                                                                        );
                                                                    })}
                                                                </svg>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* YEARLY PEER COMPARISON CHART */
                                            <div className="flex items-start gap-0">
                                                <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-start pr-4 pt-10 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">📊 Yearly Peer Comparison</div>

                                                    {monthRects.length >= 12 && (() => {
                                                        const allV = monthStats.flatMap(ms => [ms.myKwh, ms.highestKwh, ms.lowestKwh, ms.predictedKwh]);
                                                        const gMax = Math.max(...allV) * 1.05;
                                                        const PAD_T = 10, PAD_B = 25;
                                                        const H = 220;
                                                        const chartH = H - PAD_T - PAD_B;
                                                        const yS = (v: number) => PAD_T + chartH - (v / gMax) * chartH;

                                                        const chartRight = monthRects[11]?.right || 700;
                                                        const getX = (mi: number) => monthRects[mi]?.mid || 0;

                                                        const highL = monthStats.map((ms, i) => `${getX(i)},${yS(ms.highestKwh)}`).join(' ');
                                                        const youL = monthStats.map((ms, i) => `${getX(i)},${yS(ms.myKwh)}`).join(' ');
                                                        const lowL = monthStats.map((ms, i) => `${getX(i)},${yS(ms.lowestKwh)}`).join(' ');
                                                        const predL = monthStats.map((ms, i) => `${getX(i)},${yS(ms.predictedKwh)}`).join(' ');

                                                        return (
                                                            <svg width="100%" height={H} className="overflow-visible">
                                                                {[0, Math.round(gMax / 2), Math.round(gMax)].map((v: number) => {
                                                                    const y = yS(v);
                                                                    return (
                                                                        <React.Fragment key={v}>
                                                                            <line x1={0} y1={y} x2={chartRight} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,4" />
                                                                            <text x={-8} y={y + 3} fontSize="9" fill="var(--text-secondary)" textAnchor="end">{v} kWh</text>
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                                <polyline points={highL} fill="none" stroke="#DC2626" strokeWidth={1.5} opacity={0.4} />
                                                                <polyline points={youL} fill="none" stroke="#2563EB" strokeWidth={2} opacity={0.8} />
                                                                <polyline points={lowL} fill="none" stroke="#16A34A" strokeWidth={1.5} opacity={0.4} />
                                                                <polyline points={predL} fill="none" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4,2" opacity={0.6} />

                                                                {monthStats.map((ms: any, mi: number) => {
                                                                    const x = getX(mi);
                                                                    return (
                                                                        <React.Fragment key={mi}>
                                                                            <circle cx={x} cy={yS(ms.myKwh)} r={3} fill="#2563EB" stroke="#fff" strokeWidth={1.5} />
                                                                            <circle cx={x} cy={yS(ms.highestKwh)} r={2} fill="#DC2626" />
                                                                            <circle cx={x} cy={yS(ms.lowestKwh)} r={2} fill="#16A34A" />

                                                                            {/* Invisible hover target */}
                                                                            <rect x={x - 15} y={0} width={30} height={H} fill="transparent"
                                                                                className="cursor-pointer"
                                                                                onMouseEnter={() => setHoverData({ type: 'month-peer', month: mi, ...ms })}
                                                                                onMouseLeave={() => setHoverData(null)}
                                                                            />
                                                                            <text x={x} y={H - 5} fontSize="9" fill="var(--text-secondary)" textAnchor="middle">{MN[mi]}</text>
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </svg>
                                                        );
                                                    })()}
                                                    <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1 mt-4">
                                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">Highest</span></div>
                                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">You</span></div>
                                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">Lowest</span></div>
                                                        <div className="flex items-center gap-1.5 text-[10px]"><div className="w-4 h-0.5 rounded bg-purple-500 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">Predicted</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ═══ MONTHLY VIEW ═══ */}
                            {viewMode === 'monthly' && (
                                <div className="space-y-6">
                                    {/* DAILY TEMPERATURE CHART */}
                                    <div className="mb-2">
                                        <div className="flex items-start gap-0">
                                            <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-start pr-4 pt-10 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-start gap-4 mb-2">
                                                    <div className="flex gap-3 text-[10px] text-[var(--text-primary)] font-medium">
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" />Max Temp</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" />Min Temp</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t border-dashed border-purple-500" />Avg</div>
                                                    </div>
                                                </div>
                                                {(() => {
                                                    const mData = yearData[selectedMonth];
                                                    const daysCount = DIM[selectedMonth];
                                                    const allT = mData.flatMap(d => [d.tempMin, d.tempMax]);
                                                    const tMin = Math.min(...allT) - 2;
                                                    const tMax = Math.max(...allT) + 2;
                                                    const tRange = tMax - tMin || 1;
                                                    const PAD_T = 10, PAD_B = 25;
                                                    const H = 140;
                                                    const chartH = H - PAD_T - PAD_B;
                                                    const yS = (t: number) => PAD_T + chartH - ((t - tMin) / tRange) * chartH;
                                                    const cW = cardRef.current?.clientWidth || 700;
                                                    const usable = cW - GUTTER_W;
                                                    const getX = (di: number) => (di / (daysCount - 1)) * usable;

                                                    const maxPoints = mData.map((d, i) => `${getX(i)},${yS(d.tempMax)}`).join(' ');
                                                    const minPoints = mData.map((d, i) => `${getX(i)},${yS(d.tempMin)}`).join(' ');
                                                    const avgPoints = mData.map((d, i) => `${getX(i)},${yS(d.tempAvg)}`).join(' ');

                                                    return (
                                                        <svg width="100%" height={H} className="overflow-visible">
                                                            {[0, 5, 10, 15, 20, 25, 30].map(t => {
                                                                if (t < tMin || t > tMax) return null;
                                                                const y = yS(t);
                                                                return (
                                                                    <React.Fragment key={t}>
                                                                        <line x1={0} y1={y} x2={usable} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="3,4" />
                                                                        <text x={-8} y={y + 3} fontSize="9" fill={axisColor} textAnchor="end">{t}°</text>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <polyline points={maxPoints} fill="none" stroke="#F97316" strokeWidth={1.5} opacity={0.5} />
                                                            <polyline points={minPoints} fill="none" stroke="#3B82F6" strokeWidth={1.5} opacity={0.5} />
                                                            <polyline points={avgPoints} fill="none" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="4,2" opacity={0.4} />

                                                            {mData.map((d: any, di: number) => {
                                                                const x = getX(di);
                                                                return (
                                                                    <React.Fragment key={di}>
                                                                        <circle cx={x} cy={yS(d.tempMax)} r={2} fill="#F97316"
                                                                            onMouseEnter={() => setHoverData({ type: 'temp', month: selectedMonth, max: d.tempMax, min: d.tempMin, avg: d.tempAvg })}
                                                                            onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                                        <circle cx={x} cy={yS(d.tempMin)} r={2} fill="#3B82F6"
                                                                            onMouseEnter={() => setHoverData({ type: 'temp', month: selectedMonth, max: d.tempMax, min: d.tempMin, avg: d.tempAvg })}
                                                                            onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                                        {(di === 0 || (di + 1) % 5 === 0 || di === daysCount - 1) && (
                                                                            <text x={x} y={H - 5} fontSize="9" fill={axisColor} textAnchor="middle">{di + 1}</text>
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </svg>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DAY/NIGHT BAR CHART */}
                                    <div className="mt-8">
                                        <div className="flex items-start gap-0">
                                            <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-start pr-4 pt-10 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">📊 Daily Consumption Split</div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                                                            <div className="w-3 h-3 rounded-sm bg-[#facc15]" />
                                                            <span className="text-[var(--text-secondary)] font-bold uppercase tracking-tight">Day</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                                                            <div className="w-3 h-3 rounded-sm bg-[#60a5fa]" />
                                                            <span className="text-[var(--text-secondary)] font-bold uppercase tracking-tight">Night</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const mData = yearData[selectedMonth];
                                                    const daysCount = DIM[selectedMonth];
                                                    const maxDaily = Math.max(...mData.map(d => d.kwh)) * 1.1;

                                                    const PAD_T = 10, PAD_B = 25;
                                                    const H = 200;
                                                    const chartH = H - PAD_T - PAD_B;
                                                    const yS = (v: number) => PAD_T + chartH - (v / maxDaily) * chartH;
                                                    const cW = cardRef.current?.clientWidth || 700;
                                                    const usable = cW - GUTTER_W;

                                                    // Width for each day's group
                                                    const dayGroupW = (usable / daysCount) * 0.8;
                                                    const barW = dayGroupW / 2.2;
                                                    const gap = (usable / daysCount) * 0.2;
                                                    const getX = (di: number) => di * (dayGroupW + gap);

                                                    return (
                                                        <svg width="100%" height={H} className="overflow-visible">
                                                            {/* Y-Axis Grid */}
                                                            {[0, Math.round(maxDaily / 2), Math.round(maxDaily)].map(v => {
                                                                const y = yS(v);
                                                                return (
                                                                    <React.Fragment key={v}>
                                                                        <line x1={0} y1={y} x2={usable} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="3,4" />
                                                                        <text x={-8} y={y + 3} fontSize="9" fill={axisColor} textAnchor="end">{v} kWh</text>
                                                                    </React.Fragment>
                                                                );
                                                            })}

                                                            {mData.map((d: any, di: number) => {
                                                                const x = getX(di);
                                                                const dayH = chartH - (yS(d.dayKwh) - PAD_T);
                                                                const nightH = chartH - (yS(d.nightKwh) - PAD_T);

                                                                const today = new Date();
                                                                const isFuture = activeYear === today.getFullYear() && (selectedMonth > today.getMonth() || (selectedMonth === today.getMonth() && (di + 1) > today.getDate()));

                                                                return (
                                                                    <React.Fragment key={di}>
                                                                        {!isFuture ? (
                                                                            <>
                                                                                {/* Day Bar */}
                                                                                <rect
                                                                                    x={x}
                                                                                    y={yS(d.dayKwh)}
                                                                                    width={barW}
                                                                                    height={dayH}
                                                                                    fill="#facc15"
                                                                                    rx={1.5}
                                                                                    className="transition-all duration-300 hover:brightness-90 cursor-pointer"
                                                                                    onMouseEnter={() => setHoverData({ type: 'day-split', part: 'Day', kwh: d.dayKwh, date: `${di + 1} ${MNF[selectedMonth]}` })}
                                                                                    onMouseLeave={() => setHoverData(null)}
                                                                                />
                                                                                {/* Night Bar */}
                                                                                <rect
                                                                                    x={x + barW + 1}
                                                                                    y={yS(d.nightKwh)}
                                                                                    width={barW}
                                                                                    height={nightH}
                                                                                    fill="#60a5fa"
                                                                                    rx={1.5}
                                                                                    className="transition-all duration-300 hover:brightness-90 cursor-pointer"
                                                                                    onMouseEnter={() => setHoverData({ type: 'day-split', part: 'Night', kwh: d.nightKwh, date: `${di + 1} ${MNF[selectedMonth]}` })}
                                                                                    onMouseLeave={() => setHoverData(null)}
                                                                                />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <rect x={x} y={yS(0) - 2} width={barW} height={2} fill="#E5E7EB" rx={1} />
                                                                                <rect x={x + barW + 1} y={yS(0) - 2} width={barW} height={2} fill="#E5E7EB" rx={1} />
                                                                            </>
                                                                        )}
                                                                        {/* X-Axis labels */}
                                                                        {(di === 0 || (di + 1) % 5 === 0 || di === daysCount - 1) && (
                                                                            <text x={x + barW} y={H - 5} fontSize="9" fill={axisColor} textAnchor="middle">{di + 1}</text>
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </svg>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DAILY PEER COMPARISON CHART */}
                                    <div className="mt-8">
                                        <div className="flex items-start gap-0">
                                            <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-start pr-4 pt-10 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">📊 Daily Peer Comparison — {MNF[selectedMonth]}</div>
                                                <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1 mb-3">
                                                    <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">Highest</span></div>
                                                    <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">You</span></div>
                                                    <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">Lowest</span></div>
                                                    <div className="flex items-center gap-1.5 text-[10px]"><div className="w-4 h-0.5 rounded bg-purple-500 shrink-0"></div><span className="text-[var(--text-primary)] font-medium">Predicted</span></div>
                                                </div>
                                                {(() => {
                                                    const dStats = dayPeerStats[selectedMonth];
                                                    const daysCount = DIM[selectedMonth];
                                                    const allV = dStats.flatMap(ds => [ds.myKwh, ds.highestKwh, ds.lowestKwh, ds.predictedKwh]);
                                                    const gMax = Math.max(...allV) * 1.05;
                                                    const PAD_T = 10, PAD_B = 25;
                                                    const H = 180;
                                                    const chartH = H - PAD_T - PAD_B;
                                                    const yS = (v: number) => PAD_T + chartH - (v / gMax) * chartH;
                                                    const cW = cardRef.current?.clientWidth || 700;
                                                    const usable = cW - GUTTER_W;
                                                    const getX = (di: number) => (di / (daysCount - 1)) * usable;

                                                    const highL = dStats.map((ds, i) => `${getX(i)},${yS(ds.highestKwh)}`).join(' ');
                                                    const youL = dStats.map((ds, i) => `${getX(i)},${yS(ds.myKwh)}`).join(' ');
                                                    const lowL = dStats.map((ds, i) => `${getX(i)},${yS(ds.lowestKwh)}`).join(' ');
                                                    const predL = dStats.map((ds, i) => `${getX(i)},${yS(ds.predictedKwh)}`).join(' ');

                                                    return (
                                                        <svg width="100%" height={H} className="overflow-visible">
                                                            {[0, Math.round(gMax / 2), Math.round(gMax)].map((v: number) => {
                                                                const y = yS(v);
                                                                return (
                                                                    <React.Fragment key={v}>
                                                                        <line x1={0} y1={y} x2={usable} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="3,4" />
                                                                        <text x={-8} y={y + 3} fontSize="9" fill={axisColor} textAnchor="end">{v} kWh</text>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <polyline points={highL} fill="none" stroke="#DC2626" strokeWidth={1.5} opacity={0.4} />
                                                            <polyline points={youL} fill="none" stroke="#2563EB" strokeWidth={1.5} opacity={0.4} />
                                                            <polyline points={lowL} fill="none" stroke="#16A34A" strokeWidth={1.5} opacity={0.4} />
                                                            <polyline points={predL} fill="none" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="4,2" opacity={0.3} />

                                                            {dStats.map((ds: any, di: number) => {
                                                                const x = getX(di);
                                                                const today = new Date();
                                                                const isFuture = activeYear === today.getFullYear() && (selectedMonth > today.getMonth() || (selectedMonth === today.getMonth() && (di + 1) > today.getDate()));
                                                                return (
                                                                    <React.Fragment key={di}>
                                                                        {!isFuture && (
                                                                            <>
                                                                                <circle cx={x} cy={yS(ds.highestKwh)} r={2} fill="#DC2626"
                                                                                    onMouseEnter={() => setHoverData({ type: 'nbr-single', month: selectedMonth, role: 'highest', kwh: ds.highestKwh, nbr: neighbours[ds.highestNi], allMax: ds.highestKwh })}
                                                                                    onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                                                <circle cx={x} cy={yS(ds.myKwh)} r={2.5} fill="#2563EB"
                                                                                    onMouseEnter={() => setHoverData({ type: 'day', ...yearData[selectedMonth][di] })}
                                                                                    onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                                                <circle cx={x} cy={yS(ds.lowestKwh)} r={2} fill="#16A34A"
                                                                                    onMouseEnter={() => setHoverData({ type: 'nbr-single', month: selectedMonth, role: 'lowest', kwh: ds.lowestKwh, nbr: neighbours[ds.lowestNi], allMax: ds.highestKwh })}
                                                                                    onMouseLeave={() => setHoverData(null)} style={{ cursor: 'pointer' }} />
                                                                            </>
                                                                        )}
                                                                        <circle cx={x} cy={yS(ds.predictedKwh)} r={1.5} fill="#8B5CF6" opacity={0.6} />
                                                                        {(di === 0 || (di + 1) % 5 === 0 || di === daysCount - 1) && (
                                                                            <text x={x} y={H - 5} fontSize="9" fill={axisColor} textAnchor="middle">{di + 1}</text>
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </svg>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* INSIGHTS Sidebar */}
                        <div className="w-full lg:w-[432px] shrink-0 border-l border-[var(--border-subtle)] pl-6 space-y-6">
                            <div className="flex bg-slate-100 rounded-lg p-0.5 w-full mb-4">
                                <button
                                    onClick={() => setSidebarTab('insights')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sidebarTab === 'insights'
                                        ? 'bg-white text-[var(--text-primary)] shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/50'
                                        }`}
                                >
                                    Insights
                                </button>
                                <button
                                    onClick={() => setSidebarTab('chat')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sidebarTab === 'chat'
                                        ? 'bg-white text-[var(--text-primary)] shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/50'
                                        }`}
                                >
                                    Chat
                                </button>
                            </div>

                            {sidebarTab === 'insights' ? (
                                <div className="space-y-3 pt-1 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border-subtle)]">
                                        <div className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wider uppercase">Audio Overview</div>
                                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all border border-blue-700" title="Listen to all insights">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            <span className="text-xs font-bold">Listen</span>
                                        </button>
                                    </div>

                                    {insightsData.slice(0, 3).map((insight, idx) => (
                                        <div key={idx} className="bg-transparent pb-4 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wider uppercase">{insight.time}</div>
                                            </div>
                                            <p className="text-xs leading-relaxed text-[var(--text-primary)] mb-2">
                                                {insight.text}
                                            </p>
                                            <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                                                View detail
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col h-[700px]">
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Chat feature coming soon</h3>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[200px]">
                                                Ask questions about your usage and get AI-powered answers.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-[var(--border-subtle)]">
                                        <AskAIBar />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>



            {/* FLOATING TOOLTIPS */}
            {
                hoverData && typeof document !== 'undefined' && createPortal(
                    <div
                        className="tooltip-floating"
                        style={{
                            left: Math.min(tooltipPos.x + 12, window.innerWidth - 320),
                            top: Math.min(tooltipPos.y + 12, window.innerHeight - 450)
                        }}
                    >
                        {hoverData.type === 'day' && (
                            <>
                                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[var(--border-subtle)]">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_MAP[getCC(hoverData.pct)] }} />
                                    <span className="font-bold text-sm">{MNF[hoverData.m]} {hoverData.d}, {activeYear}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">⚡ Your Usage</span>
                                        <span className="font-bold">{hoverData.kwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">👥 Peer Avg</span>
                                        <span className="font-bold">{hoverData.avg} kWh</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">📊 Rank</span>
                                        <span className="font-bold">{getRankLabel(hoverData.pct)}</span>
                                    </div>
                                    <div className="h-1 w-full bg-[var(--bg-surface-2)] rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-[var(--text-secondary)] rounded-full" style={{ width: `${hoverData.pct}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter mt-1">
                                        <span>Top Efficiency</span>
                                        <span>High Usage</span>
                                    </div>

                                    {/* Hourly Chart */}
                                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">24h Consumption</div>
                                            <div className="text-[9px] font-bold py-0.5 px-1.5 bg-blue-50 text-blue-600 rounded">Hourly</div>
                                        </div>
                                        <div className="flex h-16 w-full gap-1">
                                            {/* Y-Axis Label */}
                                            <div className="flex flex-col justify-between text-[7px] font-bold text-[var(--text-secondary)] pr-1 border-r border-[var(--border-subtle)] pb-1 leading-none h-full">
                                                <span>{Math.max(...hoverData.hourlyKwh, ...hoverData.hourlyLimit).toFixed(1)}</span>
                                                <span className="text-[6px] opacity-70">kWh</span>
                                                <span>{(Math.max(...hoverData.hourlyKwh, ...hoverData.hourlyLimit) / 2).toFixed(1)}</span>
                                                <span>0</span>
                                            </div>

                                            <div className="relative flex-1 bg-[var(--bg-surface-2)]/50 rounded flex items-end justify-between px-1 overflow-hidden h-full pt-2">
                                                {/* Night Shade Background (Indices 12-23) */}
                                                <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-blue-900/10 dark:bg-blue-400/10 pointer-events-none" />

                                                {/* Limit Curve SVG Overlay - SMOOTHED CURVE */}
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                                                    <path
                                                        d={(() => {
                                                            const points = hoverData.hourlyLimit?.map((limit: number, hi: number) => {
                                                                const maxH = Math.max(...hoverData.hourlyKwh, ...hoverData.hourlyLimit);
                                                                const x = (hi / 23) * 100;
                                                                const y = 100 - ((limit / (maxH || 1)) * 90);
                                                                return { x, y };
                                                            });

                                                            // Simple cubic bezier smoothing
                                                            if (!points || points.length < 2) return '';
                                                            let d = `M ${points[0].x}% ${points[0].y}%`;
                                                            for (let i = 0; i < points.length - 1; i++) {
                                                                const p0 = points[i];
                                                                const p1 = points[i + 1];
                                                                const cpX = (p0.x + p1.x) / 2;
                                                                d += ` C ${cpX}% ${p0.y}%, ${cpX}% ${p1.y}%, ${p1.x}% ${p1.y}%`;
                                                            }
                                                            return d;
                                                        })()}
                                                        fill="none"
                                                        stroke="#f43f5e"
                                                        strokeWidth="2"
                                                        strokeDasharray="4,2"
                                                        className="opacity-80"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>

                                                {hoverData.hourlyKwh?.map((val: number, hi: number) => {
                                                    const limit = hoverData.hourlyLimit[hi];
                                                    const maxH = Math.max(...hoverData.hourlyKwh, ...hoverData.hourlyLimit);

                                                    const baseVal = Math.min(val, limit);
                                                    const excessVal = Math.max(0, val - limit);

                                                    const baseHeight = (baseVal / (maxH || 1)) * 90;
                                                    const excessHeight = (excessVal / (maxH || 1)) * 90;

                                                    return (
                                                        <div
                                                            key={hi}
                                                            className="relative h-full flex flex-col justify-end"
                                                            style={{ width: '4px' }}
                                                        >
                                                            {excessVal > 0 && (
                                                                <div
                                                                    className="w-full bg-rose-500 rounded-t-[1.5px] relative z-10"
                                                                    style={{ height: `${excessHeight}%` }}
                                                                />
                                                            )}
                                                            <div
                                                                className={`w-full transition-all duration-500 ${excessVal > 0 ? '' : 'rounded-t-[1.5px]'} ${hi >= 12 ? 'bg-blue-700 dark:bg-blue-400' : 'bg-amber-500 dark:bg-amber-400'}`}
                                                                style={{
                                                                    height: `${Math.max(2, baseHeight)}%`,
                                                                    opacity: hi >= 12 ? 0.9 : 1
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[8px] text-[var(--text-secondary)] font-bold uppercase mt-2 px-0.5 ml-6">
                                            <div className="flex items-center gap-1.5 translate-x-[-4px]">
                                                <Sun size={12} className="text-amber-500 fill-amber-500/20" strokeWidth={2.5} />
                                                <span>00</span>
                                            </div>
                                            {['06', '12'].map(h => (
                                                <span key={h} className="opacity-60">{h}</span>
                                            ))}
                                            <div className="flex items-center gap-1.5 translate-x-[4px]">
                                                <span>18</span>
                                                <Moon size={11} className="text-blue-700 dark:text-blue-400 fill-blue-700/20 dark:fill-blue-400/20" strokeWidth={2.5} />
                                            </div>
                                            <span className="opacity-60">23</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {hoverData.type === 'peak-hour' && (
                            <>
                                <div className="flex justify-between items-center pb-2 mb-3 border-b border-[var(--border-subtle)]">
                                    <span className="font-bold text-sm text-[var(--text-primary)]">{hoverData.hour}:00 Usage</span>
                                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full uppercase tracking-tight ${hoverData.isPk ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {hoverData.isPk ? 'Peak Hour' : 'Off-Peak'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-[var(--text-secondary)]">Avg. Consumption</span>
                                        <span className="font-bold text-lg">{hoverData.val.toFixed(2)} <small className="font-normal text-[10px]">kWh</small></span>
                                    </div>
                                    <div className="text-[10px] text-[var(--text-secondary)] italic">
                                        {hoverData.isPk ? 'Typically higher rates apply during this window.' : 'Standard energy rates apply.'}
                                    </div>
                                </div>
                            </>
                        )}

                        {hoverData.type === 'peak-day' && (
                            <>
                                <div className="flex justify-between items-center pb-2 mb-3 border-b border-[var(--border-subtle)]">
                                    <span className="font-bold text-sm text-[var(--text-primary)]">{DOW_NAMES[hoverData.day]} Usage</span>
                                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full uppercase tracking-tight ${hoverData.isWeekend ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {hoverData.isWeekend ? 'Weekend' : 'Weekday'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-[var(--text-secondary)]">Daily Average</span>
                                        <span className="font-bold text-lg">{hoverData.val.toFixed(2)} <small className="font-normal text-[10px]">kWh</small></span>
                                    </div>
                                    <div className="text-[10px] text-[var(--text-secondary)] italic">
                                        {hoverData.isWeekend ? 'Weekend profiles often show higher base-load usage.' : 'Weekday patterns reflect standard morning/evening peaks.'}
                                    </div>
                                </div>
                            </>
                        )}

                        {hoverData.type === 'temp' && (
                            <>
                                <div className="flex justify-between items-center pb-2 mb-3 border-b border-[var(--border-subtle)]">
                                    <span className="font-bold text-sm text-[var(--text-primary)]">{MNF[hoverData.month]}</span>
                                    <span className="text-xl">🌡</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Max Temp</span>
                                        <span className="font-bold">{hoverData.max}°F</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Avg Temp</span>
                                        <span className="font-bold font-mono text-purple-600">{hoverData.avg}°F</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Min Temp</span>
                                        <span className="font-bold">{hoverData.min}°F</span>
                                    </div>
                                    <div className="flex h-1.5 w-full bg-blue-50 rounded-full mt-3 overflow-hidden">
                                        <div className="h-full bg-blue-300" style={{ width: `${100 - (hoverData.max / 26) * 100}%` }} />
                                        <div className="h-full bg-rose-300" style={{ width: `${(hoverData.max / 26) * 100}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter mt-1">
                                        <span>Cold</span>
                                        <span>Warm</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {hoverData.type === 'peer-compare-detailed' && (
                            <div className="w-[320px]">
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border-subtle)]">
                                    <span className="font-bold text-sm text-[var(--text-primary)]">{MNF[hoverData.month]} Comparisons</span>
                                    <span className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 rounded-full text-slate-500 uppercase tracking-tight">{activeYear}</span>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
                                            <th className="pb-2 font-bold">Parameter</th>
                                            <th className="pb-2 font-bold text-rose-600">Highest</th>
                                            <th className="pb-2 font-bold text-blue-600">You</th>
                                            <th className="pb-2 font-bold text-emerald-600">Lowest</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px]">
                                        <tr className="border-b border-[var(--border-subtle)]/30">
                                            <td className="py-2 text-[var(--text-secondary)] font-medium">Usage (kWh)</td>
                                            <td className="py-2 font-bold">{hoverData.highest.kwh}</td>
                                            <td className="py-2 font-bold text-blue-600">{hoverData.you.kwh}</td>
                                            <td className="py-2 font-bold">{hoverData.lowest.kwh}</td>
                                        </tr>
                                        <tr className="border-b border-[var(--border-subtle)]/30">
                                            <td className="py-2 text-[var(--text-secondary)] font-medium">House Size</td>
                                            <td className="py-2">{hoverData.highest.size}</td>
                                            <td className="py-2 font-semibold">{hoverData.you.size}</td>
                                            <td className="py-2">{hoverData.lowest.size}</td>
                                        </tr>
                                        <tr className="border-b border-[var(--border-subtle)]/30">
                                            <td className="py-2 text-[var(--text-secondary)] font-medium">Build Year</td>
                                            <td className="py-2">{hoverData.highest.build}</td>
                                            <td className="py-2 font-semibold">{hoverData.you.build}</td>
                                            <td className="py-2">{hoverData.lowest.build}</td>
                                        </tr>
                                        <tr className="border-b border-[var(--border-subtle)]/30">
                                            <td className="py-2 text-[var(--text-secondary)] font-medium">Occupants</td>
                                            <td className="py-2">{hoverData.highest.occ}</td>
                                            <td className="py-2 font-semibold">{hoverData.you.occ}</td>
                                            <td className="py-2">{hoverData.lowest.occ}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 text-[var(--text-secondary)] font-medium">Avg Temp</td>
                                            <td colSpan={3} className="py-2 text-center font-bold text-purple-600">{hoverData.avgTemp}°F</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                                    <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 text-center">Relative Efficiency Gap</div>
                                    <div className="relative h-2 w-full bg-[var(--bg-surface-2)] rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500/20 flex-1" />
                                        <div className="h-full bg-amber-500/10 w-[30%]" />
                                        <div className="h-full bg-rose-500/20 w-[20%]" />
                                        {/* Tick for 'You' */}
                                        <div
                                            className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-[0_0_4px_rgba(37,99,235,0.5)] z-10 transition-all duration-500"
                                            style={{ left: `${(hoverData.you.kwh / hoverData.allMax) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[8px] text-[var(--text-secondary)] font-bold uppercase mt-1">
                                        <span>Most Efficient</span>
                                        <span>Least Efficient</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'nbr-single' && (
                            <>
                                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[var(--border-subtle)]">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                                        style={{
                                            background: hoverData.role === 'you' ? '#EFF6FF' : (hoverData.role === 'highest' ? '#FEF2F2' : '#F0FDF4'),
                                            color: hoverData.role === 'you' ? '#2563EB' : (hoverData.role === 'highest' ? '#DC2626' : '#16A34A')
                                        }}
                                    >
                                        {hoverData.role === 'you' ? '⚡' : hoverData.nbr.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-[var(--text-primary)]">{hoverData.role === 'you' ? 'Your Household' : hoverData.nbr.name}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-tight" style={{ color: hoverData.role === 'you' ? '#2563EB' : (hoverData.role === 'highest' ? '#DC2626' : '#16A34A') }}>
                                            {hoverData.role === 'you' ? 'YOU' : (hoverData.role === 'highest' ? 'Highest Consumer' : 'Lowest Consumer')} • {MNF[hoverData.month]}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">Monthly Usage</span>
                                        <span className="font-bold text-[var(--text-primary)]">{hoverData.kwh} kWh</span>
                                    </div>
                                    {hoverData.nbr && (
                                        <>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">House Size</span>
                                                <span className="font-medium">{hoverData.nbr.size}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Build Year</span>
                                                <span className="font-medium">{hoverData.nbr.build}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-[var(--text-secondary)]">Occupants</span>
                                                <span className="font-medium">{hoverData.nbr.occ}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="mt-3">
                                        <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Usage vs peer group max</div>
                                        <div className="h-1.5 w-full bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(hoverData.kwh / hoverData.allMax) * 100}%`,
                                                    background: hoverData.role === 'you' ? '#2563EB' : (hoverData.role === 'highest' ? '#DC2626' : '#16A34A')
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {hoverData.type === 'day-split' && (
                            <>
                                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[var(--border-subtle)]">
                                    <div className="w-3 h-3 rounded-sm" style={{ background: hoverData.part === 'Day' ? '#facc15' : '#60a5fa' }} />
                                    <span className="font-bold text-sm">{hoverData.date}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--text-secondary)]">{hoverData.part} Consumption</span>
                                        <span className="font-bold text-[var(--text-primary)]">{hoverData.kwh} kWh</span>
                                    </div>
                                </div>
                            </>
                        )}
                        {hoverData.type === 'usage-month' && (() => {
                            const { month } = hoverData;
                            const years = HIST_YEARS;
                            const usages = years.map(y => HIST_MONTHLY[y as keyof typeof HIST_MONTHLY][month]);
                            const peerAvgs = usages.map(val => Math.round(val * (peerMonthly[month] / monthTotals[month])));
                            const costs = usages.map(val => (val * RATE).toFixed(0));

                            const firstUsage = usages[0];
                            const lastUsage = usages[usages.length - 1];
                            const numYears = years.length - 1;
                            const cagr = (((lastUsage / firstUsage) ** (1 / numYears)) - 1) * 100;
                            const isIncrease = cagr > 0;

                            return (
                                <div className="w-[380px]">
                                    <div className="flex items-center gap-2 pb-3 mb-2 border-b border-[var(--border-subtle)]">
                                        <span className="font-bold text-base text-[var(--text-primary)]">{MNF[month]} Historical Performance</span>
                                    </div>

                                    {/* Mini Chart */}
                                    <div className="mb-4 pt-2">
                                        <div className="flex items-center gap-4 mb-2 text-[10px] text-[var(--text-secondary)] justify-center">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-[1px] bg-[#f97316]"></div>
                                                <span>My Consumption</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-[1px] bg-[#cbd5e1]"></div>
                                                <span>Peer Consumption</span>
                                            </div>
                                        </div>
                                        <svg width="100%" height={130} className="overflow-visible">
                                            {(() => {
                                                const cw = 380;
                                                const padT = 20;
                                                const ch = 90;
                                                const padX = 30; // space for y-axes
                                                const usableW = cw - padX * 2;

                                                // scales
                                                const maxVal = Math.max(...usages, ...peerAvgs, 100);
                                                const maxCost = Math.max(...costs.map(Number), 10);
                                                const yKwh = (val: number) => padT + ch - (val / maxVal) * ch;
                                                const yCost = (val: number) => padT + ch - (val / maxCost) * ch;

                                                const xSpace = usableW / years.length;
                                                const getCx = (index: number) => padX + xSpace * index + xSpace / 2;

                                                // path for cost line
                                                const costLinePath = costs.map((c, i) => `${getCx(i)},${yCost(Number(c))}`).join(' ');

                                                return (
                                                    <>
                                                        {/* Grid and Axes */}
                                                        {[0, 0.5, 1].map(pct => {
                                                            const y = padT + ch - ch * pct;
                                                            return (
                                                                <React.Fragment key={pct}>
                                                                    <line x1={padX} y1={y} x2={cw - padX} y2={y} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2,2" />
                                                                    <text x={padX - 4} y={y + 3} fontSize="9" fill="var(--text-secondary)" textAnchor="end">{Math.round(maxVal * pct)}</text>
                                                                    <text x={cw - padX + 4} y={y + 3} fontSize="9" fill="var(--text-secondary)" textAnchor="start">${Math.round(maxCost * pct)}</text>
                                                                </React.Fragment>
                                                            );
                                                        })}

                                                        {/* Horizontal limit line at 560 kWh */}
                                                        <line x1={padX} y1={yKwh(560)} x2={cw - padX} y2={yKwh(560)} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" opacity={0.6} />

                                                        {/* Bars */}
                                                        {years.map((y, i) => {
                                                            const cx = getCx(i);
                                                            const uVal = usages[i];
                                                            const pVal = peerAvgs[i];
                                                            const barW = 8;
                                                            const pY = yKwh(pVal);
                                                            const uY = yKwh(uVal);

                                                            return (
                                                                <g key={`bars-${y}`}>
                                                                    {/* Peer Usage */}
                                                                    <rect x={cx - barW - 1} y={pY} width={barW} height={padT + ch - pY} fill="#cbd5e1" rx={1} />
                                                                    {/* User Usage */}
                                                                    <rect x={cx + 1} y={uY} width={barW} height={padT + ch - uY} fill="#f97316" rx={1} />

                                                                    {/* Year Label */}
                                                                    <text x={cx} y={padT + ch + 12} fontSize="9" fill="var(--text-secondary)" textAnchor="middle">{y}</text>
                                                                </g>
                                                            );
                                                        })}

                                                        {/* Green price curve */}
                                                        <polyline points={costLinePath} fill="none" stroke="#16A34A" strokeWidth="2" />
                                                        {costs.map((c, i) => (
                                                            <g key={`dot-${i}`}>
                                                                <circle cx={getCx(i)} cy={yCost(Number(c))} r={3} fill="#16A34A" stroke="#fff" strokeWidth={1} />
                                                                <text x={getCx(i)} y={yCost(Number(c)) - 8} fontSize="10" fill="#16A34A" textAnchor="middle" fontWeight="bold">${c}</text>
                                                            </g>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>

                                    <table className="w-full text-left border-collapse mb-4">
                                        <thead>
                                            <tr className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                                                <th className="pb-3 pt-2 font-bold whitespace-nowrap">Parameter</th>
                                                {years.map(y => (
                                                    <th key={y} className="pb-3 pt-2 font-bold text-center">{y}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-[var(--border-subtle)]/50">
                                                <td className="py-2.5 text-[var(--text-secondary)] font-medium">Total Usage (kWh)</td>
                                                {usages.map((u, i) => (
                                                    <td key={i} className="py-2.5 font-bold text-[var(--text-primary)] text-center">{u}</td>
                                                ))}
                                            </tr>
                                            <tr className="border-b border-[var(--border-subtle)]/50">
                                                <td className="py-2.5 text-[var(--text-secondary)] font-medium">Peer Avg. (kWh)</td>
                                                {peerAvgs.map((pa, i) => (
                                                    <td key={i} className="py-2.5 text-[var(--text-secondary)] text-center">{pa}</td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <td className="py-2.5 text-[var(--text-secondary)] font-medium">Total Cost ($)</td>
                                                {costs.map((c, i) => (
                                                    <td key={i} className="py-2.5 font-bold text-emerald-600 text-center">${c}</td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div className="bg-[var(--bg-surface-2)] rounded-lg p-4 text-[13px] leading-relaxed border border-[var(--border-subtle)]/30">
                                        <div className="flex items-center gap-2 font-bold mb-2">
                                            <SparkleRegular className="text-amber-400" fontSize={16} />
                                            <span className="text-[var(--text-primary)] text-sm">Insight</span>
                                        </div>
                                        <div>
                                            <p className="mb-2">
                                                <strong className={isIncrease ? "text-rose-600" : "text-emerald-600"}>
                                                    CAGR is {Math.abs(cagr).toFixed(1)}% ({isIncrease ? 'Increase' : 'Decrease'})
                                                </strong> <span className="text-[var(--text-primary)]">in usage.</span>
                                            </p>
                                            <p className="text-[var(--text-secondary)]">
                                                {isIncrease
                                                    ? 'Your consumption trend indicates a steady increase over the last 5 years. Optimizing thermostat schedules could help offset rising utilization.'
                                                    : 'Excellent progress! Your historic data shows a steady reduction in overall consumption relative to established peer usage baselines.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                        {hoverData.type === 'usage-bar' && (
                            <div className="flex flex-col gap-1 min-w-[140px]">
                                <div className="font-bold text-sm text-[var(--text-primary)] mb-1 pb-1 border-b border-[var(--border-subtle)]">
                                    {MNF[hoverData.month]} Performance
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--text-secondary)]">Usage:</span>
                                    <span className="font-bold text-[var(--text-primary)]">{hoverData.kwh} kWh</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--text-secondary)]">Est. Cost:</span>
                                    <span className="font-bold text-emerald-600">${hoverData.cost}</span>
                                </div>
                            </div>
                        )}
                        {hoverData.type === 'month-peer' && (
                            <div className="flex flex-col min-w-[160px]">
                                <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 mb-2">
                                    {MNF[hoverData.month]} Peer Review
                                </div>
                                <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div>You</div>
                                        <span className="font-bold text-slate-900">{hoverData.myKwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-600"></div>Highest</div>
                                        <span className="font-bold text-slate-900">{hoverData.highestKwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div>Lowest</div>
                                        <span className="font-bold text-slate-900">{hoverData.lowestKwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-100 pt-1 mt-0.5">
                                        <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-purple-500"></div>Predicted</div>
                                        <span className="font-bold italic">{hoverData.predictedKwh} kWh</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>,
                    document.body
                )
            }
        </div >
    );
};
