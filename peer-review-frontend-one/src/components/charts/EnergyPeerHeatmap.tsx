import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Sun, Moon, Info, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ComposedChart, Line } from 'recharts';
import { SimpleTooltip } from '@/components/ui/SimpleTooltip';
import { mergeClasses } from '@fluentui/react-components';
import { SparkleRegular } from '@fluentui/react-icons';
import { HIST_YEARS, HIST_MONTHLY, RATE } from '@/lib/usageDummyData';
import { getMonthlyUsage, getCustomer, getWeatherForCity } from '@/lib/api';

// ── CONSTANTS ────────────────────────────────────────────
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MNF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const GUTTER_W = 64; // Width for y-axis and legends on the left



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
    hideHeatmapGridOnly?: boolean;
    hideTrendLine?: boolean;
    isMyUsagePage?: boolean;
    customerId?: string;
    externalInsights?: any[];
    hidePeerComparison?: boolean;
    useWeatherTabs?: boolean;
    hideSidebar?: boolean;
}

export const EnergyPeerHeatmap: React.FC<EnergyPeerHeatmapProps> = ({ hideTabs, hideHeatmap, hideHeatmapGridOnly, hideTrendLine, isMyUsagePage, customerId, externalInsights, hidePeerComparison, useWeatherTabs = false, hideSidebar = false }) => {
    const [activeYear, setActiveYear] = useState(2026); // Use a baseline year for data
    const [activeFilter, setActiveFilter] = useState<'Hot Days' | 'Cool Days' | 'Humid' | 'None'>('None');
    const [viewMode] = useState<'annual' | 'monthly' | 'daily'>('annual');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [activeMonth, setActiveMonth] = useState(-1);
    const [hoverData, setHoverData] = useState<any>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [actualMonthlyData, setActualMonthlyData] = useState<any[]>([]);
    const [weatherData, setWeatherData] = useState<any[]>([]);
    const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);
    const [selectedMonthPerfDetail, setSelectedMonthPerfDetail] = useState<{ month: number; year: number } | null>(null);

    const { histYears, histMonthly } = useMemo(() => {
        if (!actualMonthlyData || actualMonthlyData.length === 0) {
            return {
                histYears: HIST_YEARS as unknown as number[],
                histMonthly: HIST_MONTHLY as unknown as Record<number, number[]>
            };
        }

        const yearsSet = new Set<number>();
        actualMonthlyData.forEach(d => {
            if (d.BILLING_MONTH) {
                const y = new Date(d.BILLING_MONTH).getFullYear();
                yearsSet.add(y);
            }
        });
        const years = Array.from(yearsSet).sort((a, b) => a - b);

        const monthlyData: Record<number, number[]> = {};
        years.forEach(y => {
            monthlyData[y] = Array(12).fill(0);
        });

        actualMonthlyData.forEach(d => {
            if (d?.BILLING_MONTH) {
                const date = new Date(d.BILLING_MONTH);
                if (!isNaN(date.getTime())) {
                    const y = date.getFullYear();
                    const m = date.getMonth();
                    if (y in monthlyData) {
                        monthlyData[y][m] = d.MONTHLY_KWH || 0;
                    }
                }
            }
        });

        return { histYears: years, histMonthly: monthlyData as Record<number, number[]> };
    }, [actualMonthlyData]);

    const axisColor = "var(--text-secondary)";
    const gridColor = "var(--border-default)";
    const tooltipBg = "var(--bg-surface-1)";
    const tooltipBorder = "var(--border-subtle)";
    const tooltipText = "var(--text-primary)";
    const [monthRects, setMonthRects] = useState<any[]>([]);
    const [sidebarTab, setSidebarTab] = useState<'insights' | 'chat'>('insights');
    const [chatMessages, setChatMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hi! Ask me anything about your energy usage.' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleChatSend = async () => {
        if (!chatInput.trim() || isChatLoading || !customerId) return;
        const msg = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
        setIsChatLoading(true);

        try {
            const { chatWithAI } = await import('@/lib/api');
            const data = await chatWithAI(customerId, msg);
            setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

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

    // Fetch Actual Monthly Data
    useEffect(() => {
        setActualMonthlyData([]); // Clear previous data
        if (customerId) {
            getMonthlyUsage(customerId).then(data => {
                if (data && Array.isArray(data)) {
                    setActualMonthlyData(data);
                }
            });

            // Fetch Weather Data
            getCustomer(customerId).then(customer => {
                if (customer?.Service_City) {
                    getWeatherForCity(customer.Service_City).then(weather => {
                        if (weather && Array.isArray(weather)) {
                            setWeatherData(weather);
                        }
                    });
                }
            });
        }
    }, [customerId]);

    // Generate Data (Memoized)
    const { yearData, allDays, neighbours, monthStats, dayPeerStats, DIM } = useMemo(() => {
        const now = new Date();
        const curY = now.getFullYear();
        const curM = now.getMonth();
        const curD = now.getDate();

        const DIM = getDaysInMonth(activeYear);
        const rand = seededRand(activeYear * 10000 + 101);
        const yData = PROFILES.map((p, m) =>
            Array.from({ length: DIM[m] }, (_, di) => {
                const dayVal = di + 1;
                const isFuture = activeYear > curY || (activeYear === curY && (m > curM || (m === curM && dayVal > curD)));

                const mDateStr = `${activeYear}-${String(m + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
                const dayWeather = weatherData.filter(w => w.FLOW_DATE === mDateStr);
                const highObj = dayWeather.find(w => w.HIGH_LOW === 'HIGH');
                const lowObj = dayWeather.find(w => w.HIGH_LOW === 'LOW');

                const tp = TEMP_PROFILES[m];
                let tempMin = +(tp.min + (rand() - 0.5) * 3).toFixed(1);
                let tempMax = +(tp.max + (rand() - 0.5) * 4).toFixed(1);

                if (lowObj) tempMin = lowObj.VALUE;
                if (highObj) tempMax = highObj.VALUE;

                const tempAvg = +((tempMin + tempMax) / 2).toFixed(1);
                const totalKwh = isFuture ? 0 : +(p.kwh * (0.55 + rand() * 0.9)).toFixed(1);
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

                const seedVal = (activeYear * 20000) + (m * 700) + ((di + 1) * 55);
                const peerAvg = isFuture ? 0 : +(p.avg * (0.70 + seededRand(seedVal + 100)() * 0.6)).toFixed(1);
                const calculatedPct = isFuture ? 0 : Math.max(2, Math.min(98, Math.round((totalKwh / Math.max(0.1, totalKwh + peerAvg)) * 100)));

                return {
                    kwh: totalKwh,
                    dayKwh,
                    nightKwh,
                    hourlyKwh: scaledHourly,
                    hourlyLimit: scaledLimit,
                    avg: peerAvg,
                    pct: calculatedPct,
                    tempMin, tempMax, tempAvg,
                    m, d: di + 1
                };
            })
        );

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

        const myMonthly = yData.map((mArr, mIndex) => {
            const monthStr = `${activeYear}-${String(mIndex + 1).padStart(2, '0')}`;
            const actual = actualMonthlyData.find(d => d.BILLING_MONTH.startsWith(monthStr));

            const isCurrent = activeYear === curY && mIndex === curM;

            if (actual) {
                const kwh = Math.round(actual.MONTHLY_KWH);
                return {
                    kwh,
                    cost: actual.AMT_BILLED !== undefined && actual.AMT_BILLED !== null ? actual.AMT_BILLED : (isCurrent ? kwh * 0.12 : null),
                    label: isCurrent ? 'Est. Cost' : 'Bill',
                    isCurrent,
                    isActual: true
                };
            }

            const isFutureMonth = activeYear > curY || (activeYear === curY && mIndex > curM);
            if (isFutureMonth) {
                return { kwh: 0, cost: null, label: 'Est. Cost', isCurrent: false, isActual: false };
            }

            const currentKwh = +mArr.reduce((s, d) => s + d.kwh, 0).toFixed(0);
            return {
                kwh: currentKwh,
                cost: isCurrent ? currentKwh * 0.12 : null,
                label: isCurrent ? 'Est. Cost' : 'Bill',
                isCurrent,
                isActual: false
            };
        });

        // Scale yData to match myMonthly totals (Consistency between Heatmap and Bars)
        yData.forEach((mArr, m) => {
            const actualTotal = myMonthly[m].kwh;
            const mockTotal = mArr.reduce((s, d) => s + d.kwh, 0);
            if (mockTotal > 0 && actualTotal !== mockTotal) {
                const ratio = actualTotal / mockTotal;
                mArr.forEach(d => {
                    d.kwh = +(d.kwh * ratio).toFixed(2);
                    d.dayKwh = +(d.dayKwh * ratio).toFixed(2);
                    d.nightKwh = +(d.nightKwh * ratio).toFixed(2);
                    if (d.hourlyKwh) {
                        d.hourlyKwh = d.hourlyKwh.map(h => +(h * ratio).toFixed(2));
                    }
                });
            }
        });

        const days: any[] = [];
        yData.forEach(mArr => mArr.forEach(d => {
            days.push(d);
        }));

        const mStats = MN.map((_, m) => {
            const vals = nbrs.map((_, ni) => ({ ni, kwh: nbrMonthly[ni][m] }));
            vals.sort((a, b) => b.kwh - a.kwh);
            const highest = vals[0];
            const lowest = vals[vals.length - 1];
            const predictedKwh = +(myMonthly[m].kwh * (0.85 + rand() * 0.3)).toFixed(0);
            return {
                myKwh: myMonthly[m].kwh,
                cost: myMonthly[m].cost,
                label: myMonthly[m].label,
                isCurrent: myMonthly[m].isCurrent,
                isActual: myMonthly[m].isActual,
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
    }, [activeYear, actualMonthlyData]);

    // Hourly data for the selected day in popup
    const selectedDayHourlyData = useMemo(() => {
        if (!selectedDayDetail) return [];
        const total = selectedDayDetail.kwh || 15;
        const peerTotal = selectedDayDetail.avg || 20;

        return Array.from({ length: 24 }, (_, i) => {
            const ampm = i >= 12 ? 'PM' : 'AM';
            const hourLabel = `${i % 12 || 12}${ampm}`;
            const baseFactor = Math.sin((i - 6) / 12 * Math.PI) + 1;
            const morningPeak = Math.exp(-Math.pow(i - 8, 2) / 4);
            const eveningPeak = Math.exp(-Math.pow(i - 19, 2) / 8);
            const multiplier = (0.2 + baseFactor * 0.3 + morningPeak * 0.8 + eveningPeak * 1.2);

            return {
                time: hourLabel,
                value: (total / 24) * multiplier * (0.8 + Math.random() * 0.4),
                peer: (peerTotal / 24) * multiplier * (0.7 + Math.random() * 0.3),
                temp: 65 + Math.sin((i - 10) / 12 * Math.PI) * 15 + Math.random() * 2,
                predicted: (total / 24) * multiplier * (0.9 + Math.random() * 0.2)
            };
        });
    }, [selectedDayDetail]);

    const selectedMonthPerformanceData = useMemo(() => {
        if (!selectedMonthPerfDetail) return [];
        const { month } = selectedMonthPerfDetail;
        const mDays = yearData[month] || [];
        const mPeer = dayPeerStats[month] || [];

        return mDays.map((d, i) => ({
            day: d.d,
            label: `${d.d}`,
            value: d.kwh,
            predicted: mPeer[i]?.predictedKwh || d.kwh * 0.95,
            temp: d.tempAvg,
            peer: mPeer[i]?.lowestKwh || d.kwh * 0.8 // Using peer average as something lower
        }));
    }, [selectedMonthPerfDetail, yearData, dayPeerStats]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border-2 border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-xl p-3 text-[11px] min-w-[200px] backdrop-blur-sm bg-white/95">
                    <div className="font-extrabold text-slate-800 mb-2 border-b border-slate-50 pb-1.5 flex items-center justify-between">
                        <span>{label}</span>
                        <Zap size={10} className="text-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => {
                            const val = typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value;
                            let color = entry.color;
                            let name = entry.name;
                            let suffix = " kWh";

                            if (name?.toLowerCase().includes('peer')) {
                                color = '#1E293B'; // Brighter visibility contrast
                                name = 'Peer Baseline';
                            } else if (name?.toLowerCase().includes('you') || entry.dataKey === 'value') {
                                color = '#2563EB'; // Blue 600
                                name = 'Your Usage';
                            } else if (name?.toLowerCase().includes('temp')) {
                                color = '#059669'; // Emerald 600
                                name = 'Temperature';
                                suffix = "°F";
                            } else if (name?.toLowerCase().includes('predicted')) {
                                color = '#7C3AED'; // Violet 600
                                name = 'Predicted';
                            }

                            return (
                                <div key={index} className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                        <span className="font-bold uppercase tracking-tight text-[10px]" style={{ color }}>{name}:</span>
                                    </div>
                                    <span className="font-black text-slate-900">{val}{suffix}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    const handlePrevNextDay = (direction: 'prev' | 'next') => {
        if (!selectedDayDetail) return;

        const currentIndex = allDays.findIndex(d => d.m === selectedDayDetail.m && d.d === selectedDayDetail.d);
        if (currentIndex === -1) return;

        const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex >= 0 && newIndex < allDays.length) {
            const nextDay = allDays[newIndex];
            setSelectedDayDetail({
                ...nextDay,
                label: `${nextDay.d} ${MNF[nextDay.m]}`,
                my: nextDay.kwh,
                peer: nextDay.avg
            });
        }
    };

    const handlePrevNextMonth = (direction: 'prev' | 'next') => {
        if (!selectedMonthPerfDetail) return;
        let { month, year } = selectedMonthPerfDetail;
        if (direction === 'prev') {
            if (month === 0) {
                month = 11;
                year -= 1;
            } else {
                month -= 1;
            }
        } else {
            if (month === 11) {
                month = 0;
                year += 1;
            } else {
                month += 1;
            }
        }

        // Only allow within supported years
        if (year < 2024) year = 2024;
        if (year > 2026) year = 2026;

        setActiveYear(year);
        setSelectedMonthPerfDetail({ month, year });
    };

    // Handle Measurements
    const updateMeasurements = useCallback(() => {
        if (hideHeatmap || hideHeatmapGridOnly) {
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
        const H = 450; // Increased height for better clarity
        const PAD_T = 60, PAD_B = 40; // More room for labels and ticks
        const chartH = H - PAD_T - PAD_B;
        const yS = (t: number) => PAD_T + chartH - ((t - allMin) / tRange) * chartH;

        // kWh Scale (Left Axis)
        // Combine current year and historical data to find true max
        const allUsages = [...monthStats.map(s => s.myKwh)];
        if (hideHeatmap) {
            histYears.forEach(y => {
                if (histMonthly[y]) {
                    histMonthly[y].forEach(val => allUsages.push(val));
                }
            });
        }
        const maxKwh = Math.max(...allUsages, 100) * 1.2; // 20% headroom
        const yKwh = (v: number) => PAD_T + chartH - (v / maxKwh) * chartH;

        return { yS, allMin, allMax, H, PAD_T, chartH, maxKwh, yKwh };
    }, [allDays, monthRects, monthStats]);

    // Neighbour Chart Calculations (removed nbrChartData since we replaced it with Peak Hours Pattern)



    return (
        <div ref={containerRef} className="energy-peer-heatmap-container text-[var(--text-primary)]" onMouseMove={onMouseMove}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .month-block { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
                .month-grid { display: grid; grid-template-columns: repeat(7, 7px); gap: 2px; }
                .day-cell { width: 7px; height: 7px; border-radius: 1.2px; cursor: pointer; transition: transform .1s; border: none; }
                .day-cell.empty { background: transparent; cursor: default; pointer-events: none; }
                .day-cell:not(.empty):not(.future):hover { transform: scale(3); z-index: 50; }
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
                    border-radius: 12px; 
                    pointer-events: none; 
                    z-index: 999; 
                    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.2), 0 4px 10px -2px rgba(0,0,0,0.1); 
                    padding: 16px; 
                    width: 200px;
                    max-width: 200px;
                    font-size: 11px;
                    line-height: 1.5;
                    overflow-wrap: break-word;
                    backdrop-blur: 8px;
                }
                .tooltip-section-title {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    border-bottom: 1px solid var(--border-subtle);
                    padding-bottom: 4px;
                }
                .tooltip-formula {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    background: rgba(0,0,0,0.03);
                    padding: 4px 6px;
                    border-radius: 4px;
                    font-size: 9px;
                    margin: 6px 0;
                    display: block;
                    border: 1px solid rgba(0,0,0,0.05);
                }
            `}} />


            <Card className="border border-[var(--border-subtle)] shadow-none overflow-hidden bg-[var(--bg-surface-1)]">
                <CardContent className="p-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div ref={cardRef} className="flex-1 min-w-0">

                            {/* Sub-header: weather filters or year tabs */}
                            {!hideTabs && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface-2)] rounded-lg w-fit">
                                        {useWeatherTabs ? (
                                            ['Hot Days', 'Cool Days', 'Humid'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setActiveFilter(f as any)}
                                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeFilter === f
                                                        ? 'bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm'
                                                        : 'text-[var(--text-secondary)] hover:text-blue-600 transition-colors'
                                                        }`}
                                                >
                                                    {f}
                                                </button>
                                            ))
                                        ) : (
                                            [2024, 2025, 2026].map(y => (
                                                <button
                                                    key={y}
                                                    onClick={() => setActiveYear(y)}
                                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeYear === y
                                                        ? 'bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm'
                                                        : 'text-[var(--text-secondary)] hover:text-blue-600 transition-colors'
                                                        }`}
                                                >
                                                    {y}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {!hideHeatmapGridOnly && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">⚡ Annual Performance</div>
                                            <SimpleTooltip content="Ranks your daily efficiency vs peers. Percentile = (You / (You + Peer)) * 100. Lower % is more efficient. Green = Top 10%, Red = Bottom 5%.">
                                                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                            </SimpleTooltip>
                                        </div>
                                    )}
                                </div>
                            )}
                            {viewMode === 'monthly' && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <select
                                            value={activeYear}
                                            onChange={(e: any) => setActiveYear(Number(e.target.value))}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300"
                                        >
                                            {[2024, 2025, 2026].map(y => (
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
                                    {!hideHeatmapGridOnly && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">📅 Monthly Performance — {MNF[selectedMonth]} {activeYear}</div>
                                            <SimpleTooltip content={`Detailed daily energy usage breakdown for ${MNF[selectedMonth]} ${activeYear}.`}>
                                                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                            </SimpleTooltip>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ ANNUAL VIEW ═══ */}
                            {viewMode === 'annual' && (
                                <>
                                    {/* TEMPERATURE CHART */}
                                    <div className="mb-2" ref={chartContainerRef}>
                                        <div className="flex items-center justify-start gap-4 mb-8">
                                            {hideHeatmapGridOnly ? (
                                                <div className="flex items-center justify-between w-full">
                                                    <h3 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-widest"></h3>
                                                    <div className="flex gap-4 text-[10px] text-[var(--text-primary)]">
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-orange-500"></div>You</div>
                                                        {!hidePeerComparison && (
                                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-slate-400"></div>Avg. peer usage (similar home size & year built)</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : hideHeatmap ? (
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <h3 className="text-sm font-bold text-[var(--text-primary)] shrink-0">Usage History</h3>
                                                    <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] text-[var(--text-primary)]">
                                                        <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t-2 border-dashed border-red-500"></div>Plan Limit</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t-2 border-blue-500"></div>Avg Usage</div>
                                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#EA580C]"></div>2024</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3 text-[10px] text-[var(--text-primary)]">
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-1 rounded bg-blue-500"></div>Min</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-1 rounded bg-orange-500"></div>Max</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-slate-400"></div>Peer</div>
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
                                                    const tcd = tempChartData;
                                                    if (!monthRects[m] || !tcd) return null;

                                                    if (hideHeatmap) {
                                                        const cx = GUTTER_W + monthRects[m].mid;
                                                        const barW = 6;
                                                        const gap = 2;
                                                        const totalW = histYears.length * barW + (histYears.length - 1) * gap;
                                                        const startX = cx - totalW / 2;

                                                        return (
                                                            <React.Fragment key={`hist-${m}`}>
                                                                {histYears.map((y, i) => {
                                                                    const val = histMonthly[y][m];
                                                                    const barH = tcd.chartH - (tcd.yKwh(val) - tcd.PAD_T);
                                                                    const barColors = ["#FED7AA", "#FDBA74", "#FB923C", "#F97316", "#EA580C"];
                                                                    const baseColor = barColors[i];
                                                                    const isHovered = hoverData?.type === 'usage-month' && hoverData.month === m;

                                                                    return (
                                                                        <rect
                                                                            key={`hist-${m}-${y}`}
                                                                            x={startX + i * (barW + gap)}
                                                                            y={tcd.yKwh(val)}
                                                                            width={barW}
                                                                            height={Math.max(0, barH)}
                                                                            fill={baseColor}
                                                                            rx={2}
                                                                            opacity={hoverData?.type === 'usage-month' ? (isHovered ? 1 : 0.5) : 1}
                                                                            style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                                                                            onClick={() => {
                                                                                setActiveYear(y);
                                                                                setSelectedMonthPerfDetail({ month: m, year: y });
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                                <rect
                                                                    x={startX - gap}
                                                                    y={0}
                                                                    width={totalW + gap * 2}
                                                                    height={tcd.H}
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
                                                    } else if (hideHeatmapGridOnly) {
                                                        const stat = monthStats[m];
                                                        const barH = tcd.chartH - (tcd.yKwh(stat.myKwh) - tcd.PAD_T);
                                                        // Get the peer average across all years for this month as a mock approximation
                                                        const peerAvgKwh = stat.predictedKwh || (stat.myKwh * 0.85);
                                                        const peerH = tcd.chartH - (tcd.yKwh(peerAvgKwh) - tcd.PAD_T);

                                                        const barW = 16;
                                                        const gap = 2;
                                                        const startX = GUTTER_W + monthRects[m].mid - (barW * 2 + gap) / 2;

                                                        return (
                                                            <React.Fragment key={`usage-${m}`}>
                                                                <rect
                                                                    x={startX}
                                                                    y={tcd.yKwh(stat.myKwh)}
                                                                    width={barW}
                                                                    height={Math.max(0, barH)}
                                                                    fill={hoverData?.type === 'usage-bar' && hoverData.month === m ? "#EA580C" : "#F97316"}
                                                                    opacity={1}
                                                                    rx={4}
                                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                                    onClick={() => {
                                                                        setSelectedMonthPerfDetail({ month: m, year: activeYear });
                                                                    }}
                                                                >
                                                                    <title>You: {stat.myKwh} kWh</title>
                                                                </rect>
                                                                {!hidePeerComparison && (
                                                                    <rect
                                                                        x={startX + barW + gap}
                                                                        y={tcd.yKwh(peerAvgKwh)}
                                                                        width={barW}
                                                                        height={Math.max(0, peerH)}
                                                                        fill="#94A3B8"
                                                                        opacity={0.8}
                                                                        rx={4}
                                                                        style={{ transition: 'all 0.2s' }}
                                                                        onClick={() => {
                                                                            setSelectedMonthPerfDetail({ month: m, year: activeYear });
                                                                        }}
                                                                    >
                                                                        <title>Peer Avg: {peerAvgKwh.toFixed(0)} kWh</title>
                                                                    </rect>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    } else {
                                                        const stat = monthStats[m];
                                                        const barH = tcd.chartH - (tcd.yKwh(stat.myKwh) - tcd.PAD_T);
                                                        const peerAvgKwh = stat.predictedKwh || (stat.myKwh * 0.85);
                                                        const peerH = tcd.chartH - (tcd.yKwh(peerAvgKwh) - tcd.PAD_T);

                                                        const barW = 12;
                                                        const gap = 2;
                                                        const startX = GUTTER_W + monthRects[m].mid - (barW * 2 + gap) / 2;

                                                        return (
                                                            <React.Fragment key={`usage-${m}`}>
                                                                <rect
                                                                    x={startX}
                                                                    y={tcd.yKwh(stat.myKwh)}
                                                                    width={barW}
                                                                    height={Math.max(0, barH)}
                                                                    fill={hoverData?.type === 'usage-bar' && hoverData.month === m ? "#EA580C" : "#F97316"}
                                                                    opacity={1}
                                                                    rx={3}
                                                                    onMouseEnter={(e) => {
                                                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                                                        setHoverData({
                                                                            type: 'usage-bar',
                                                                            month: m,
                                                                            kwh: stat.myKwh,
                                                                            cost: stat.cost !== null ? stat.cost.toFixed(2) : '--',
                                                                            label: stat.label,
                                                                            isCurrent: stat.isCurrent
                                                                        });
                                                                    }}
                                                                    onMouseLeave={() => setHoverData(null)}
                                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                                    onClick={() => {
                                                                        setSelectedMonthPerfDetail({ month: m, year: activeYear });
                                                                    }}
                                                                />
                                                                <rect
                                                                    x={startX + barW + gap}
                                                                    y={tcd.yKwh(peerAvgKwh)}
                                                                    width={barW}
                                                                    height={Math.max(0, peerH)}
                                                                    fill="#94A3B8"
                                                                    opacity={0.8}
                                                                    rx={3}
                                                                    onMouseEnter={(e) => {
                                                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                                                        setHoverData({
                                                                            type: 'usage-bar',
                                                                            month: m,
                                                                            name: 'Peer Avg',
                                                                            kwh: peerAvgKwh,
                                                                            cost: null
                                                                        });
                                                                    }}
                                                                    onMouseLeave={() => setHoverData(null)}
                                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                                    onClick={() => {
                                                                        setSelectedMonthPerfDetail({ month: m, year: activeYear });
                                                                    }}
                                                                />
                                                            </React.Fragment>
                                                        );
                                                    }
                                                })}

                                                {/* Avg Usage Trend Line */}
                                                {!hideTrendLine && (
                                                    <>
                                                        <polyline
                                                            points={MN.map((_, m) => {
                                                                if (!monthRects[m] || !tempChartData) return '';
                                                                const usages = histYears.map(y => (histMonthly[y] ? histMonthly[y][m] : 0));
                                                                const avg = usages.reduce((a, b) => a + b, 0) / (usages.length || 1);
                                                                return `${GUTTER_W + monthRects[m].mid},${tempChartData.yKwh(avg)}`;
                                                            }).filter(Boolean).join(' ')}
                                                            fill="none" stroke="#2563EB" strokeWidth="2"
                                                        />
                                                        {MN.map((_, m) => {
                                                            if (!monthRects[m] || !tempChartData) return null;
                                                            const cx = GUTTER_W + monthRects[m].mid;
                                                            const usages = histYears.map(y => (histMonthly[y] ? histMonthly[y][m] : 0));
                                                            const avg = usages.reduce((a, b) => a + b, 0) / (usages.length || 1);
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
                                                            <text x={GUTTER_W - 8} y={y + 3} fontSize="9" fill={axisColor} textAnchor="end" fontWeight="600">{v}</text>
                                                        </React.Fragment>
                                                    );
                                                })}

                                                {/* Temperature grid & Fahrenheit labels (Right Axis) */}
                                                {!hideHeatmap && [0, 10, 20, 30].map(t => {
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
                                                    if (!monthRects[m] || !tempChartData) return null;
                                                    const x = GUTTER_W + monthRects[m].left;
                                                    return <line key={m} x1={x} y1={0} x2={x} y2={tempChartData.H} stroke={gridColor} strokeWidth="1" strokeDasharray="2,2" />;
                                                })}
                                                {!hideHeatmap && !hideHeatmapGridOnly && (() => {
                                                    const tempPoints = MN.map((_, m) => {
                                                        if (!monthRects[m] || !tempChartData) return null;
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
                                                    if (!monthRects[m] || !tempChartData) return null;
                                                    const cx = GUTTER_W + monthRects[m].mid;

                                                    if (hideHeatmap || hideHeatmapGridOnly) {
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
                                    {(!hideHeatmap && !hideHeatmapGridOnly) && (
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

                                                                        // Filtering logic
                                                                        let isFiltered = true;
                                                                        if (useWeatherTabs) {
                                                                            if (activeFilter === 'Hot Days') {
                                                                                isFiltered = day.tempMax > 85;
                                                                            } else if (activeFilter === 'Cool Days') {
                                                                                isFiltered = day.tempMin < 45;
                                                                            } else if (activeFilter === 'Humid') {
                                                                                // Mock humidity check - higher chance in summer
                                                                                const seed = (activeYear * 1000) + (m * 50) + di;
                                                                                const seededRand = (s: number) => {
                                                                                    let x = Math.sin(s++) * 10000;
                                                                                    return () => x - Math.floor(x);
                                                                                };
                                                                                const rand = seededRand(seed)();
                                                                                isFiltered = (m >= 5 && m <= 8) ? rand > 0.3 : rand > 0.8;
                                                                            } else if (activeFilter === 'None') {
                                                                                isFiltered = true;
                                                                            }
                                                                        }

                                                                        return (
                                                                            <div key={i}
                                                                                className={`day-cell ${getCC(day.pct)} ${!isFiltered ? 'opacity-20 grayscale-[0.5]' : 'scale-110 shadow-sm'}`}
                                                                                onMouseEnter={() => { setActiveMonth(m); setHoverData({ type: 'day', ...day }); }}
                                                                                onMouseLeave={() => { setActiveMonth(-1); setHoverData(null); }}
                                                                                onClick={() => {
                                                                                    setSelectedDayDetail({
                                                                                        ...day,
                                                                                        label: `${day.d} ${MNF[day.m]}`,
                                                                                        my: day.kwh,
                                                                                        peer: day.avg
                                                                                    });
                                                                                }}
                                                                                style={{ transform: isFiltered ? 'scale(1.1)' : 'scale(1)' }}
                                                                            />
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
                                        {(isMyUsagePage || hidePeerComparison) ? null : (
                                            /* YEARLY PEER COMPARISON CHART */
                                            <div className="flex items-start gap-0">
                                                <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-start pr-4 pt-10 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-4">
                                                        <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">📊 Yearly Peer Comparison</div>
                                                        <SimpleTooltip content="Compares your annual energy usage directly against similar homes in your area.">
                                                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                                        </SimpleTooltip>
                                                    </div>

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
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">📊 Daily Consumption Split</div>
                                                        <SimpleTooltip content="Shows how your daily energy use is distributed across different time blocks.">
                                                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                                        </SimpleTooltip>
                                                    </div>
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
                                        {hidePeerComparison ? null : (
                                            <div className="flex items-start gap-0">
                                                <div style={{ width: GUTTER_W }} className="flex flex-col items-center justify-start pr-4 pt-10 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-4">
                                                        <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">📊 Daily Peer Comparison — {MNF[selectedMonth]}</div>
                                                        <SimpleTooltip content={`Comparing your daily consumption against peers throughout ${MNF[selectedMonth]}.`}>
                                                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                                        </SimpleTooltip>
                                                    </div>
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
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* INSIGHTS Sidebar */}
                        {!hideSidebar && (
                            <div className="w-full lg:w-[320px] shrink-0 border-l border-[var(--border-subtle)] pl-4 space-y-6">
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

                                        {(() => {
                                            const insightsToDisplay = (externalInsights !== undefined && externalInsights !== null) ? externalInsights : (insightsData.slice(0, 3) || []);

                                            if (insightsToDisplay.length === 0) {
                                                return (
                                                    <div className="flex flex-col items-center justify-center py-12 text-center h-full opacity-60">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                            <SparkleRegular fontSize={18} className="text-slate-300" />
                                                        </div>
                                                        <p className="text-xs font-medium text-[var(--text-secondary)]">No insights available for this period</p>
                                                    </div>
                                                );
                                            }

                                            return insightsToDisplay.map((insight, idx) => (
                                                <div key={idx} className="bg-transparent pb-4 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wider uppercase">{insight.time || 'insight'}</div>
                                                    </div>
                                                    <p className="text-xs leading-relaxed text-[var(--text-primary)] mb-2">
                                                        {insight.message || insight.text || insight.description}
                                                    </p>
                                                    <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                                                        View detail
                                                    </a>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-[700px]">
                                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pt-1" ref={chatScrollRef}>
                                            {chatMessages.map((m, i) => (
                                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user'
                                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                                        : 'bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)] rounded-bl-sm'
                                                        }`}>
                                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            ))}
                                            {isChatLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-[var(--border-subtle)] flex gap-1">
                                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-[var(--border-subtle)] mt-auto">
                                            <div className="flex gap-2">
                                                <input
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                                    placeholder="Ask about your usage..."
                                                    className="flex-1 bg-slate-50 border border-[var(--border-subtle)] focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                                                />
                                                <button
                                                    onClick={handleChatSend}
                                                    disabled={isChatLoading || !chatInput.trim()}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* FLOATING TOOLTIPS */}
            {
                hoverData && typeof document !== 'undefined' && createPortal(
                    <div
                        className="tooltip-floating"
                        style={{
                            left: Math.max(12, Math.min(tooltipPos.x + 12, window.innerWidth - 212)),
                            top: Math.max(12, Math.min(tooltipPos.y + 12, window.innerHeight - 302))
                        }}
                    >
                        {hoverData.type === 'day' && (
                            <>
                                <div className="tooltip-section-title">Daily Performance</div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLOR_MAP[getCC(hoverData.pct)] }} />
                                    <span className="font-bold">{MNF[hoverData.m]} {hoverData.d}, {activeYear}</span>
                                </div>
                                <div className="space-y-2">
                                    {((hoverData.tempMax !== undefined && hoverData.tempMin !== undefined) || hoverData.tempAvg !== undefined) && (
                                        <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 italic font-medium">
                                            🌤️ Local Temp: {hoverData.tempAvg !== undefined ? `${Math.round(hoverData.tempAvg)}°F (Avg)` : `${Math.round(hoverData.tempMax)}°F / ${Math.round(hoverData.tempMin)}°F`}
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[11px]">
                                        <span>⚡ You:</span>
                                        <span className="font-bold">{hoverData.kwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span>👥 Peers:</span>
                                        <span className="font-bold text-slate-900">{hoverData.avg} kWh</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span>📊 Rank:</span>
                                            <span className="font-bold text-blue-600">{getRankLabel(hoverData.pct)}</span>
                                        </div>
                                        <code className="tooltip-formula">
                                            Score = (You / (You + Peer)) * 100
                                        </code>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden relative shadow-inner">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${hoverData.pct}%` }} />
                                    </div>
                                    <div className="text-[9px] text-slate-500 italic text-center mt-2 bg-slate-50/50 rounded p-1.5 border border-slate-100/50 leading-tight">
                                        {hoverData.pct <= 50
                                            ? `Efficiency tip: You were more efficient than ${100 - hoverData.pct}% of neighbors.`
                                            : `Efficiency tip: ${100 - hoverData.pct}% of neighbors used less energy than you.`}
                                    </div>
                                    {hoverData.hourlyKwh && (
                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">24h History</div>
                                                <div className="text-[8px] font-bold py-0.5 px-1.5 bg-blue-50 text-blue-600 rounded">Hourly</div>
                                            </div>
                                            <div className="flex h-12 w-full items-end gap-[1px] bg-slate-50/50 rounded p-1">
                                                {hoverData.hourlyKwh.map((h: number, idx: number) => {
                                                    const maxVal = Math.max(...hoverData.hourlyKwh, 0.1);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`flex-1 rounded-t-[1px] ${idx >= 6 && idx <= 18 ? 'bg-amber-400' : 'bg-blue-400'}`}
                                                            style={{ height: `${(h / maxVal) * 100}%` }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div className="flex justify-between text-[8px] text-slate-400 mt-1 uppercase font-bold px-1">
                                                <div className="flex items-center gap-0.5"><Sun size={8} className="text-amber-500" /> 06:00</div>
                                                <div className="flex items-center gap-0.5">18:00 <Moon size={8} className="text-blue-500" /></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {(hoverData.type === 'peak-hour' || hoverData.type === 'peak-day') && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Peak Distribution</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{hoverData.type === 'peak-hour' ? 'Hourly Performance' : 'DOW Trends'}</div>
                                <div className="space-y-4">
                                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 mb-1">
                                            <span>{hoverData.type === 'peak-hour' ? 'Slot' : 'Day'}</span>
                                            <span className="text-slate-900">{hoverData.label}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">Value:</span>
                                            <span className="font-bold">{hoverData.val}%</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-slate-200 pl-2">
                                        {hoverData.type === 'peak-hour'
                                            ? 'Shows when your energy consumption is highest during the day.'
                                            : 'Identifies which days of the week consistently show peak usage.'}
                                    </div>
                                    <code className="tooltip-formula">
                                        Dist % = (Slot Usage / Total Day) * 100
                                    </code>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'temp' && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Climate Context</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{hoverData.label} Summary</div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                            <div className="text-[8px] uppercase font-bold text-blue-500 mb-0.5">Min</div>
                                            <div className="font-bold text-blue-700">{hoverData.min}°F</div>
                                        </div>
                                        <div className="p-2 bg-rose-50 rounded border border-rose-100">
                                            <div className="text-[8px] uppercase font-bold text-rose-500 mb-0.5">Max</div>
                                            <div className="font-bold text-rose-700">{hoverData.max}°F</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
                                        <span className="text-slate-500 font-semibold">Average:</span>
                                        <span className="font-bold">{hoverData.avg}°F</span>
                                    </div>
                                    <code className="tooltip-formula">Delta = Max - Min</code>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'peer-compare-detailed' && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Peer Comparison</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{MNF[hoverData.month]} Detailed Data</div>
                                <div className="space-y-4">
                                    {['highest', 'you', 'lowest'].map(role => (
                                        <div key={role} className={`p-2 rounded-lg border ${role === 'you' ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                            <div className="flex justify-between items-center mb-2 font-bold uppercase text-[9px]">
                                                <span className={role === 'you' ? 'text-blue-600' : (role === 'highest' ? 'text-rose-600' : 'text-emerald-600')}>{role}</span>
                                                <span className="text-slate-900">{hoverData[role].kwh} kWh</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-1 text-[9px] text-slate-500 leading-tight">
                                                <span>Size:</span><span className="text-right text-slate-700">{hoverData[role].size}</span>
                                                <span>Built:</span><span className="text-right text-slate-700">{hoverData[role].build}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <code className="tooltip-formula">Gap = Your kWh - Lowest Peer kWh</code>
                                    <div className="relative h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden shadow-inner flex">
                                        <div className="h-full bg-emerald-500/20 flex-1" />
                                        <div className="h-full bg-amber-500/10 w-[30%]" />
                                        <div className="h-full bg-rose-500/20 w-[20%]" />
                                        <div
                                            className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-md z-10 transition-all duration-500"
                                            style={{ left: `${(hoverData.you.kwh / (hoverData.allMax || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'usage-month' && (() => {
                            const { month } = hoverData;
                            const years = histYears;
                            const usages = years.map(y => histMonthly[y][month]);
                            const costs = usages.map(val => (val * RATE).toFixed(0));

                            return (
                                <div className="w-full">
                                    <div className="tooltip-section-title">Historical Review</div>
                                    <div className="font-bold text-xs mb-3 text-slate-700">{MNF[month]} Multi-Year Trends</div>
                                    <div className="space-y-4">
                                        {years.map((y, i) => (
                                            <div key={y} className="relative">
                                                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                                                    <span>{y}</span>
                                                    <span className="text-emerald-600">${costs[i]}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] mb-1.5 text-slate-500">
                                                    <span>{usages[i]} kWh</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-blue-500/80 rounded-full"
                                                        style={{ width: `${(usages[i] / Math.max(...usages, 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )).reverse()}
                                    </div>
                                    <div className="mt-4">
                                        <code className="tooltip-formula">Cost = kWh * ${RATE}</code>
                                    </div>
                                </div>
                            );
                        })()}

                        {hoverData.type === 'usage-bar' && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Monthly Summary</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{MNF[hoverData.month]} {activeYear}</div>
                                <div className="space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500 font-medium">Usage:</span>
                                            <span className="font-bold text-slate-900">{hoverData.kwh} kWh</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500 font-medium">{hoverData.label}:</span>
                                            {hoverData.cost === '--' ? (
                                                <span className="font-bold text-slate-400">--</span>
                                            ) : (
                                                <span className={`font-bold ${hoverData.isCurrent ? 'text-purple-600' : 'text-blue-600'}`}>${hoverData.cost}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <code className="tooltip-formula">Cost = kWh * ${RATE}/kWh</code>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'nbr-single' && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Peer Profile</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{hoverData.role === 'highest' ? 'Highest Peer' : 'Lowest Peer'}</div>
                                <div className="space-y-4 text-[10px]">
                                    <div className="grid grid-cols-2 gap-y-2 p-2.5 bg-slate-50 rounded border border-slate-100 font-medium">
                                        <span className="text-slate-500">Usage:</span><span className="text-right font-bold text-slate-900">{hoverData.kwh} kWh</span>
                                        <span className="text-slate-500">Occupants:</span><span className="text-right">{hoverData.nbr?.occ}</span>
                                        <span className="text-slate-500">Build Year:</span><span className="text-right">{hoverData.nbr?.build}</span>
                                        <span className="text-slate-500">Home Size:</span><span className="text-right">{hoverData.nbr?.size}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'day-split' && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Day/Night Split</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{hoverData.part} Period — {hoverData.date}</div>
                                <div className="space-y-4 text-[11px]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Consumption:</span>
                                        <span className="font-bold">{hoverData.kwh} kWh</span>
                                    </div>
                                    <div className="pt-2">
                                        <code className="tooltip-formula">Split % = (Part / Total) * 100</code>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hoverData.type === 'month-peer' && (
                            <div className="w-full">
                                <div className="tooltip-section-title">Peer Review</div>
                                <div className="font-bold text-xs mb-3 text-slate-700">{MNF[hoverData.month]} Summary</div>
                                <div className="space-y-3 font-medium text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Highest:</span><span className="text-rose-600 font-bold">{hoverData.highestKwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between p-1.5 bg-blue-50 rounded border border-blue-100 font-bold">
                                        <span className="text-blue-600">You:</span><span className="text-blue-700">{hoverData.myKwh} kWh</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Lowest:</span><span className="text-emerald-600 font-bold">{hoverData.lowestKwh} kWh</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>,
                    document.body
                )
            }

            {/* DAY DETAIL POPUP / MODAL (HEATMAP VERSION) */}
            {
                selectedDayDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-2xl bg-white shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-200">
                            <CardContent className="p-0">
                                <div className="bg-slate-50 p-3 border-b border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handlePrevNextDay('prev')}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase">Previous</span>
                                            </button>
                                            <div className="text-center">
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Detailed Daily Insight</h3>
                                                <h2 className="text-lg font-black text-slate-800 leading-tight">{selectedDayDetail.label}, {activeYear}</h2>
                                            </div>
                                            <button
                                                onClick={() => handlePrevNextDay('next')}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                                            >
                                                <span className="text-[10px] font-bold uppercase">Next Day</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setSelectedDayDetail(null)}
                                            className="p-1 px-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors text-lg font-light"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 space-y-4">
                                    <div className="pt-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hourly Usage Pattern (Heatmap Drilldown)</h4>
                                            <div className="flex gap-3 text-[9px] font-bold uppercase">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-slate-500">You</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                                    <span className="text-slate-400">Peer</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-64 w-full bg-slate-50/50 rounded-xl p-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={selectedDayHourlyData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="time"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                                                        interval={3}
                                                    />
                                                    <YAxis hide />
                                                    <YAxis yAxisId="temp" hide domain={[30, 110]} />
                                                    <Tooltip
                                                        content={<CustomTooltip />}
                                                        cursor={{ fill: '#f1f5f9' }}
                                                    />
                                                    <Bar
                                                        dataKey="peer"
                                                        fill="#cbd5e1"
                                                        radius={[2, 2, 0, 0]}
                                                        maxBarSize={12}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        fill="#3b82f6"
                                                        radius={[2, 2, 0, 0]}
                                                        maxBarSize={12}
                                                    />
                                                    <Line
                                                        yAxisId="temp"
                                                        type="monotone"
                                                        dataKey="temp"
                                                        name="Temperature"
                                                        stroke="#10b981"
                                                        strokeWidth={1.5}
                                                        dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#fff' }}
                                                        activeDot={{ r: 5 }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="predicted"
                                                        name="Predicted"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={1.5}
                                                        strokeDasharray="4 4"
                                                        dot={false}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Your Usage</p>
                                            <p className="text-xl font-bold text-slate-800">{selectedDayDetail.my ? `${selectedDayDetail.my.toFixed(2)} kWh` : 'N/A'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Peer Average</p>
                                            <p className="text-xl font-black text-slate-700">{selectedDayDetail.peer ? `${selectedDayDetail.peer.toFixed(2)} kWh` : 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div className="flex gap-3">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                <Zap className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">System Efficiency</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {selectedDayDetail.my < selectedDayDetail.peer
                                                        ? "Excellent! You were 14% more efficient than your peers on this day."
                                                        : "Usage was slightly above average due to evening climate control optimization."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                <Info className="w-3.5 h-3.5 text-orange-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Behavioral Insight</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    Significant background load detected during sleep hours. Recommend auditing always-on appliances.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedDayDetail(null)}
                                        className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                    >
                                        Dismiss Insights
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* MONTHLY PERFORMANCE DRILLDOWN POPUP */}
            {selectedMonthPerfDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl bg-white shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-200">
                        <CardContent className="p-0">
                            <div className="bg-slate-50 p-3 border-b border-slate-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handlePrevNextMonth('prev')}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase">Previous</span>
                                        </button>
                                        <div className="text-center">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Detailed Monthly Insight</h3>
                                            <h2 className="text-lg font-black text-slate-800 leading-tight">{MNF[selectedMonthPerfDetail.month]} {selectedMonthPerfDetail.year}</h2>
                                        </div>
                                        <button
                                            onClick={() => handlePrevNextMonth('next')}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                                        >
                                            <span className="text-[10px] font-bold uppercase">Next Month</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMonthPerfDetail(null)}
                                        className="p-1 px-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors text-lg font-light"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 space-y-4">
                                <div className="pt-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Usage Pattern — {MN[selectedMonthPerfDetail.month]}</h4>
                                        <div className="flex gap-3 text-[9px] font-bold uppercase">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-slate-500">You</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-0 border-t-2 border-dashed border-[#8b5cf6]"></div>
                                                <span className="text-slate-400">Predicted</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                                <span className="text-slate-400">Temp</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-64 w-full bg-slate-50/50 rounded-xl p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={selectedMonthPerformanceData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    dataKey="label"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                                                    interval={4}
                                                />
                                                <YAxis hide />
                                                <YAxis yAxisId="temp" hide domain={[30, 110]} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                                <Bar
                                                    dataKey="value"
                                                    name="Your Usage"
                                                    fill="#3b82f6"
                                                    radius={[2, 2, 0, 0]}
                                                    maxBarSize={12}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="predicted"
                                                    name="Predicted"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={1.5}
                                                    strokeDasharray="4 4"
                                                    dot={false}
                                                />
                                                <Line
                                                    yAxisId="temp"
                                                    type="monotone"
                                                    dataKey="temp"
                                                    name="Temperature"
                                                    stroke="#10b981"
                                                    strokeWidth={1.5}
                                                    dot={{ r: 2.5, fill: '#10b981', strokeWidth: 1, stroke: '#fff' }}
                                                    activeDot={{ r: 4 }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-2">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Total</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-800">
                                                {monthStats[selectedMonthPerfDetail.month]?.myKwh.toFixed(1)} <span className="text-xs font-bold text-slate-400">kWh</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Zap size={10} className="text-blue-500" />
                                            <span className="text-[10px] font-bold text-blue-600 uppercase">
                                                Expected: {monthStats[selectedMonthPerfDetail.month]?.predictedKwh.toFixed(1)} kWh
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            {monthStats[selectedMonthPerfDetail.month]?.label || (monthStats[selectedMonthPerfDetail.month]?.isCurrent ? 'Estimated Bill' : 'Total Bill')}
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-800">
                                                ${monthStats[selectedMonthPerfDetail.month]?.cost?.toFixed(2) || (monthStats[selectedMonthPerfDetail.month]?.myKwh * 0.12).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-slate-400">
                                            <Info size={10} className="text-slate-400" />
                                            <span className="text-[10px] font-bold uppercase">
                                                {monthStats[selectedMonthPerfDetail.month]?.isActual ? 'Finalized Bill' : 'Projected Based on Usage'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
