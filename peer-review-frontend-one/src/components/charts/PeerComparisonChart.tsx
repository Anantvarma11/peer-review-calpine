import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from "@/components/ui/Card";
import { Info } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/SimpleTooltip';
import { getHourlyUsage, getDailyUsage, getMonthlyUsage, getAnnualUsage, getWeatherForCity, getCustomer } from '@/lib/api';

interface PeerComparisonChartProps {
    customerId?: string;
}

export function PeerComparisonChart({ customerId }: PeerComparisonChartProps) {
    // Hover tooltip state
    const [hoveredRow, setHoveredRow] = useState<any>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Zip Code Filters (replacing period filters)
    const [zipSearch, setZipSearch] = useState('');
    const [selectedZip, setSelectedZip] = useState('75001');
    const zipCodes = useMemo(() => [
        '75001', '75002', '75003', '75004', '75005',
        '75101', '75102', '75103', '75104', '75105',
        '75201', '75202', '75203', '75204', '75205'
    ], []);

    const filteredZipList = useMemo(() => {
        return zipCodes.filter(z => z.includes(zipSearch));
    }, [zipSearch, zipCodes]);

    // New period filters
    const [activePeriod] = useState<'Hourly' | 'Daily' | 'Monthly' | 'Annually'>('Monthly');
    const [selectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Default dynamic current Month/Year
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [selectedMonth] = useState(() => months[new Date().getMonth()]);
    const [selectedYear] = useState(() => new Date().getFullYear().toString());
    const [selectedAnnualRange] = useState<'All' | 'Last 3 Years' | 'Last 5 Years'>('Last 5 Years');

    // Real data state
    const [realData, setRealData] = useState<any[]>([]);
    const [weatherData, setWeatherData] = useState<any[]>([]);
    const [annualDataStore, setAnnualDataStore] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!customerId) return;

        const fetchData = async () => {
            setIsFetching(true);
            try {
                let data: any[] = [];
                let annualData: any[] = [];

                if (activePeriod === 'Hourly') {
                    data = await getHourlyUsage(customerId, { usage_date: selectedDate });
                } else if (activePeriod === 'Daily') {
                    const selY = parseInt(selectedYear);
                    const selM = months.indexOf(selectedMonth);
                    const startOfMonth = new Date(selY, selM, 1).toISOString().split('T')[0];
                    const endOfMonth = new Date(selY, selM + 1, 0).toISOString().split('T')[0];
                    data = await getDailyUsage(customerId, { start_date: startOfMonth, end_date: endOfMonth });
                } else if (activePeriod === 'Monthly') {
                    data = await getMonthlyUsage(customerId);
                } else if (activePeriod === 'Annually') {
                    annualData = await getAnnualUsage(customerId);
                }

                setRealData(data || []);
                setAnnualDataStore(annualData || []);

                // Fetch real weather data
                try {
                    const customer = await getCustomer(customerId);
                    const city = customer.Service_City || "Houston";
                    const weather = await getWeatherForCity(city);
                    setWeatherData(weather || []);
                } catch (weatherErr) {
                    console.error("Failed to fetch weather data", weatherErr);
                }
            } catch (err) {
                console.error("Failed to fetch real data", err);
                setRealData([]);
            } finally {
                setIsFetching(false);
            }
        };

        fetchData();
    }, [customerId, activePeriod, selectedDate, selectedMonth, selectedYear]);

    // Get the current dynamic data, varying it by all active filters
    const data = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDateStr = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const currentDay = now.getDate();

        // Deterministic pseudo-random based on customerId (same as TopOverviewCharts)
        const pseudoRandom = (seed: number) => {
            const charSum = customerId ? customerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 123;
            const x = Math.sin(seed + charSum) * 10000;
            return x - Math.floor(x);
        };

        const myBase = 850;
        const peerBase = 1050;


        if (activePeriod === 'Hourly') {
            const isFutureDate = selectedDate > currentDateStr;
            const isToday = selectedDate === currentDateStr;

            return Array.from({ length: 24 }, (_, i) => {
                const hour = i;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hrLabel = `${hour % 12 || 12} ${ampm}`;
                const hourWeight = hour < 6 ? 0.3 : hour < 10 ? 0.8 : hour < 17 ? 0.5 : hour < 22 ? 1.0 : 0.4;
                const isFutureTime = isFutureDate || (isToday && hour > currentHour);

                // Try to find real data for this hour
                const realHour = realData.find(d => d.HR === hour);

                // temp curve - US typical hourly variation (e.g. 55F to 80F for typical non-summer)
                const weatherHour = weatherData.find(w => w.HR === hour);
                const temp = realHour?.avg_temp || weatherHour?.VALUE || (65 + Math.sin(((hour - 14) / 24) * 2 * Math.PI) * 12 + pseudoRandom(i + 200) * 5 - 2);

                const myUsage = realHour ? realHour.VALUE : (isFutureTime ? null : Number(Math.max(0.5, (8 + pseudoRandom(i) * 8) * hourWeight)));
                const peerUsage = realHour?.peer_value || (isFutureTime ? null : Number(Math.max(0.5, (10 + pseudoRandom(i + 50) * 12) * hourWeight)));

                return {
                    label: hrLabel,
                    myUsage,
                    peerUsage,
                    temperature: isFutureTime && !realHour && !weatherHour ? null : Number(temp.toFixed(1))
                };
            });
        }
        if (activePeriod === 'Daily') {
            const selY = parseInt(selectedYear);
            const selM = months.indexOf(selectedMonth);
            const daysInMonth = new Date(selY, selM + 1, 0).getDate();
            const isFutureMonth = selY > currentYear || (selY === currentYear && selM > currentMonth);
            const isCurrentMonth = selY === currentYear && selM === currentMonth;

            const weatherMap = new Map(weatherData.map(w => [new Date(w.FLOW_DATE).getDate(), w.VALUE]));

            return Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isFutureTime = isFutureMonth || (isCurrentMonth && day > currentDay);

                // Try to find real data for this day
                const realDay = realData.find(d => new Date(d.USAGE_DATE).getDate() === day);
                const weatherTemp = weatherMap.get(day);

                const temp = realDay?.avg_temp || weatherTemp || (55 + Math.sin((i / daysInMonth) * 2 * Math.PI) * 10 + pseudoRandom(day + 200) * 8 - 4);

                const myUsage = realDay ? realDay.VALUE : (isFutureTime ? null : Number(Math.max(0.5, 15 + pseudoRandom(day) * 10)));
                const peerUsage = realDay?.peer_value || (isFutureTime ? null : Number(Math.max(0.5, 20 * (0.8 + pseudoRandom(day) * 0.4))));

                return {
                    label: `${selectedMonth.substring(0, 3)} ${day}`,
                    myUsage,
                    peerUsage,
                    temperature: isFutureTime && !realDay && !weatherTemp ? null : Number(temp.toFixed(1))
                };
            });
        }
        if (activePeriod === 'Monthly') {
            const selY = parseInt(selectedYear);
            const isFutureYear = selY > currentYear;
            const isCurrentYear = selY === currentYear;

            return months.map((m, i) => {
                const isFutureTime = isFutureYear || (isCurrentYear && i > currentMonth);

                // Try to find real data for this month
                const realMonth = realData.find(d => d.MONTH === i + 1 || d.label === m.substring(0, 3));

                // Yearly temp bell curve (US context: Jan 35F, July 85F) - Adjusted lower base
                const temp = realMonth?.avg_temp || (55 - Math.cos((i / 11) * 2 * Math.PI) * 20 + pseudoRandom(i + 200) * 5);

                const myUsage = realMonth ? realMonth.VALUE : (isFutureTime ? null : Number((myBase * (0.8 + pseudoRandom(i) * 0.4))));
                const peerUsage = realMonth?.peer_value || (isFutureTime ? null : Number((peerBase * (0.8 + pseudoRandom(i + 100) * 0.4))));

                return {
                    label: m.substring(0, 3),
                    myUsage,
                    peerUsage,
                    temperature: isFutureTime && !realMonth ? null : Number(temp.toFixed(1))
                };
            });
        }
        if (activePeriod === 'Annually') {
            let numYears = 5;
            if (selectedAnnualRange === 'Last 3 Years') numYears = 3;
            else if (selectedAnnualRange === 'Last 5 Years') numYears = 5;
            else if (selectedAnnualRange === 'All') numYears = 8;

            const annualDataMap = new Map(annualDataStore.map(d => [d.YEAR || d.label, d.VALUE]));

            return Array.from({ length: numYears }, (_, i) => {
                const yearLabel = (currentYear - (numYears - 1 - i));
                const isFutureTime = yearLabel > currentYear;

                const realVal = annualDataMap.get(yearLabel) || annualDataMap.get(String(yearLabel));
                const temp = 62 + pseudoRandom(i + 200) * 6 - 3; // steady average around 62F

                return {
                    label: yearLabel.toString(),
                    myUsage: realVal || (isFutureTime ? null : Number((myBase * 12 * (0.8 + pseudoRandom(i) * 0.4)))),
                    peerUsage: isFutureTime ? null : Number((peerBase * 12 * (0.8 + pseudoRandom(i + 100) * 0.4))),
                    temperature: isFutureTime ? null : Number(temp.toFixed(1))
                };
            });
        }

        return [];
    }, [activePeriod, selectedDate, selectedMonth, selectedYear, selectedAnnualRange, realData, customerId]);

    // Calculate cost and finalize data
    const finalChartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            cost: item.myUsage !== null ? item.myUsage * 0.12 : null
        }));
    }, [data]);

    // maxUsage handles empty array gracefully
    const calculatedMax = finalChartData.length > 0 ? Math.max(...finalChartData.flatMap(d => [d.peerUsage || 0, d.myUsage || 0])) : 0;
    const maxUsage = calculatedMax > 0 ? calculatedMax : 1000;


    return (
        <>
            <Card className="border border-[var(--border-subtle)] shadow-none overflow-hidden bg-[var(--bg-surface-1)]">
                <CardContent className="p-0 flex flex-col md:flex-row h-[850px]">
                    {/* Left Panel - Zip Filters */}
                    <div className="w-full md:w-64 shrink-0 flex flex-col gap-4 md:border-r border-slate-100 p-4 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="flex flex-col gap-1 mb-2">
                            <div className="text-sm font-bold text-slate-800">
                                ZIP Performance
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                Select Pick-code
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-2">
                            <input
                                type="text"
                                placeholder="Search Zip Code..."
                                value={zipSearch}
                                onChange={(e) => setZipSearch(e.target.value)}
                                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all shadow-sm"
                            />
                            <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Zip List */}
                        <div className="flex flex-col gap-1 max-h-[400px]">
                            {filteredZipList.map(zip => (
                                <button
                                    key={zip}
                                    onClick={() => setSelectedZip(zip)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${selectedZip === zip
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                                        : 'hover:bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedZip === zip ? 'bg-white' : 'bg-slate-300'}`} />
                                        <span>{zip}</span>
                                    </div>
                                    {selectedZip === zip && (
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                            {filteredZipList.length === 0 && (
                                <div className="text-center py-4 text-[10px] text-slate-400 italic">
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Chart Area (Full Height) */}
                    <div className="flex-1 w-full flex flex-col overflow-hidden bg-white relative">
                        {isFetching && (
                            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <div className="w-full h-full flex flex-col p-4 pr-[28px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <div className="mb-6 shrink-0">
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                                        ⚡ Peer Comparision
                                    </div>
                                    <SimpleTooltip content="Compare your energy usage with peers across different ZIP codes.">
                                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                    </SimpleTooltip>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Average energy usage (kWh) by Selected Period</p>
                            </div>

                            <div className="relative w-full flex-1 mt-6">
                                <div className="h-full min-h-[500px] relative transition-opacity duration-500 w-full opacity-100">
                                    <div className="absolute inset-0 flex">
                                        {/* Y-axis Labels on Left */}
                                        <div className="w-[50px] relative h-[calc(100%-80px)] shrink-0 pr-2 border-r border-slate-100 flex flex-col items-end">
                                            <div className="absolute -top-6 right-2 text-[10px] font-bold text-slate-400 whitespace-nowrap">Energy (kWh)</div>
                                            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                                                <div key={pct} className="absolute right-2 text-[10px] font-medium text-slate-400 translate-y-1/2" style={{ bottom: `${pct * 100}%` }}>
                                                    {Math.round(maxUsage * pct).toLocaleString()}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Chart Grid & Bars Container */}
                                        <div className="flex-1 relative h-[calc(100%-80px)] group/chart">
                                            <div className="absolute inset-0 pointer-events-none z-0">
                                                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                                                    <div key={pct} className="absolute w-full border-b border-slate-100" style={{ bottom: `${pct * 100}%` }}></div>
                                                ))}
                                            </div>

                                            <div className="absolute inset-0 flex items-end justify-around px-2 z-10 w-full h-full">
                                                {finalChartData.map((item, index) => {
                                                    const peerHeightPct = item.peerUsage !== null ? (item.peerUsage / maxUsage) * 100 : 0;
                                                    const myHeightPct = item.myUsage !== null ? (item.myUsage / maxUsage) * 100 : 0;
                                                    const showLabel = finalChartData.length > 50 ? index % 4 === 0 : true;

                                                    return (
                                                        <div
                                                            key={item.label + '-' + index}
                                                            className="relative h-full flex flex-col justify-end group cursor-pointer"
                                                            style={{ width: `${100 / Math.max(1, finalChartData.length)}%` }}
                                                            onMouseEnter={() => setHoveredRow(item)}
                                                            onMouseLeave={() => setHoveredRow(null)}
                                                            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                                                        >
                                                            <div className="w-full flex justify-center items-end gap-[1px] h-full absolute inset-0 z-10">
                                                                {item.peerUsage !== null && (
                                                                    <div
                                                                        className="max-w-[14px] w-[45%] transition-all duration-500 ease-out bg-[#e2e8f0] group-hover:bg-[#cbd5e1]"
                                                                        style={{ height: `${Math.max(peerHeightPct, 1)}%` }}
                                                                    ></div>
                                                                )}
                                                                {item.myUsage !== null && (
                                                                    <div
                                                                        className="max-w-[14px] w-[45%] transition-all duration-500 ease-out bg-[#f97316] group-hover:bg-[#ea580c]"
                                                                        style={{ height: `${Math.max(myHeightPct, 1)}%` }}
                                                                    ></div>
                                                                )}
                                                            </div>

                                                            {showLabel && (
                                                                <div className="absolute -bottom-[2px] left-1/2 w-0 flex justify-end overflow-visible pointer-events-none">
                                                                    <div className={`text-[9px] sm:text-[10px] font-semibold text-slate-500 whitespace-nowrap transition-transform ${finalChartData.length > 15
                                                                        ? "origin-top-right -rotate-45 pr-1.5 pt-2"
                                                                        : "translate-x-1/2 pt-2"
                                                                        }`}>
                                                                        {item.label}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Floating Portal Tooltip */}
            {
                hoveredRow && typeof document !== 'undefined' && document.body && createPortal(
                    <div
                        className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl rounded-lg z-[9999] flex flex-col w-[300px] sm:w-[380px] overflow-hidden transition-opacity duration-150 animate-in fade-in zoom-in-95"
                        style={{
                            left: Math.max(12, Math.min(mousePos.x + 12, window.innerWidth - 392)),
                            top: Math.max(12, Math.min(mousePos.y - 120, window.innerHeight - 252)),
                        }}
                    >
                        {/* Header Info */}
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Period: {hoveredRow.label}</div>
                                <div className="text-xs font-semibold text-slate-800">
                                    {hoveredRow.myUsage !== null && hoveredRow.myUsage !== undefined ? (
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                <span className="text-orange-500">{Number(hoveredRow.myUsage.toFixed(2))}</span> vs <span className="text-slate-500">{Number((hoveredRow.peerUsage ?? 0).toFixed(2))}</span> kWh
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 font-normal italic">No future data available</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Insights Area */}
                        {hoveredRow.myUsage !== null && hoveredRow.peerUsage !== null && (
                            <div className="px-3 py-2 bg-blue-50/50">
                                <div className="text-[10px] text-blue-800 flex items-center gap-1.5 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    {hoveredRow.myUsage > hoveredRow.peerUsage
                                        ? `Usage tracking ${Math.max(0, (hoveredRow.myUsage / (hoveredRow.peerUsage || 1) * 100 - 100)).toFixed(0)}% above peer average.`
                                        : `Great! Usage is ${Math.max(0, (100 - hoveredRow.myUsage / (hoveredRow.peerUsage || 1) * 100)).toFixed(0)}% below peer average.`}
                                </div>
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </>
    );
}
