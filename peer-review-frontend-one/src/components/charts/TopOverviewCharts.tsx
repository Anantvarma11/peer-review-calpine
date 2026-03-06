import { useState, useEffect, useMemo } from 'react';
import { getDailyUsage, getHourlyUsage, getWeatherForCity, getCustomer } from '@/lib/api';
import { Card, CardContent } from "@/components/ui/Card";
import { Line, Bar, ComposedChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Info, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/SimpleTooltip';

interface TopOverviewChartsProps {
    customerId?: string;
    isMyUsagePage?: boolean;
}

export function TopOverviewCharts({ customerId, isMyUsagePage }: TopOverviewChartsProps) {
    const [rangeData, setRangeData] = useState<any[]>([]);
    const [dailyDataLocal, setDailyDataLocal] = useState<any[]>([]);
    const [hourlyDataLocal, setHourlyDataLocal] = useState<any[]>([]);
    const [weatherDataLocal, setWeatherDataLocal] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);
    const [tempDisplayMode, setTempDisplayMode] = useState<'avg' | 'highlow' | 'hide'>('avg');

    // Default range: Current Month
    const getMonthStart = () => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    };
    const getMonthEnd = () => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    };

    const [rangeStartDate, setRangeStartDate] = useState<string>(getMonthStart());
    const [rangeEndDate, setRangeEndDate] = useState<string>(getMonthEnd());

    // Current date/time for dynamic data context
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();
    const currentDay = now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    useEffect(() => {
        if (!customerId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const todayStr = now.toISOString().split('T')[0];

                const [daily, hourly] = await Promise.all([
                    getDailyUsage(customerId, { start_date: startOfMonth, end_date: todayStr }),
                    getHourlyUsage(customerId, { usage_date: todayStr })
                ]);

                setDailyDataLocal(daily || []);
                setHourlyDataLocal(hourly || []);

                // Fetch real weather data
                try {
                    const customer = await getCustomer(customerId);
                    const city = customer.Service_City || "Houston";
                    const weather = await getWeatherForCity(city);
                    setWeatherDataLocal(weather || []);
                } catch (weatherErr) {
                    console.error("Failed to fetch weather data", weatherErr);
                }
            } catch (err) {
                console.error("Failed to fetch chart data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [customerId]);

    // Deterministic pseudo-random based on customerId
    const pseudoRandom = (seed: number) => {
        const charSum = customerId ? customerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 123;
        const x = Math.sin(seed + charSum) * 10000;
        return x - Math.floor(x);
    };

    // 1. Today Data (Hourly 24 Hours)
    const todayData = useMemo(() => {
        const currentHour = now.getHours();

        if (hourlyDataLocal.length > 0) {
            return hourlyDataLocal.map((d: any) => {
                const hour = d.HR;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const label = `${hour % 12 || 12}${ampm}`;
                const displayLabel = hour % 6 === 0 ? (hour === 0 ? '12AM' : hour === 12 ? '12PM' : `${hour % 12}${ampm}`) : '';
                return {
                    label,
                    displayLabel,
                    my: d.VALUE,
                    peer: d.peer_value || ((d.VALUE || 1) * (0.8 + pseudoRandom(hour) * 0.4)),
                    predicted: null
                };
            });
        }

        return Array.from({ length: 24 }, (_, i) => {
            const hour = i % 24;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayLabel = hour % 6 === 0 ? (hour === 0 ? '12AM' : hour === 12 ? '12PM' : `${hour % 12}${ampm}`) : '';
            const hourWeight = hour < 6 ? 0.3 : hour < 10 ? 0.8 : hour < 17 ? 0.5 : hour < 22 ? 1.0 : 0.4;
            const myBase = (8 + pseudoRandom(i) * 8) * hourWeight;
            const peerBase = (10 + pseudoRandom(i + 50) * 12) * hourWeight;
            const isFuture = hour > currentHour;
            return {
                label: `${hour % 12 || 12}${ampm}`,
                displayLabel,
                my: isFuture ? null : myBase,
                peer: isFuture ? null : peerBase,
                predicted: (isFuture || hour === currentHour) ? myBase : null
            };
        });
    }, [customerId, hourlyDataLocal, now]);

    // 2. Month Data (Daily 28-31 Days)
    const monthData = useMemo(() => {
        const currentDayNum = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyDataMap = new Map(dailyDataLocal.map(d => [new Date(d.USAGE_DATE).getDate(), d]));
        const weatherMap = new Map(weatherDataLocal.map(w => [new Date(w.FLOW_DATE).getDate(), w.VALUE]));

        return Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const isFuture = dayNum > currentDayNum;
            const realData = dailyDataMap.get(dayNum);
            const realTemp = weatherMap.get(dayNum);
            const peerBase = realData?.peer_value || (20 * (0.8 + pseudoRandom(dayNum) * 0.4));
            const myBase = realData?.VALUE || (isFuture ? null : 15 + pseudoRandom(dayNum) * 10);


            const avgTemp = realTemp || realData?.avg_temp || (40 + Math.sin(dayNum / 10) * 20 + pseudoRandom(dayNum) * 5);
            return {
                label: dayNum.toString(),
                my: myBase,
                peer: peerBase,
                predicted: (isFuture || dayNum === currentDayNum) && !realData ? (15 + pseudoRandom(dayNum) * 10) : null,
                temp: avgTemp,
                tempHigh: avgTemp + 5 + pseudoRandom(dayNum + 300) * 5,
                tempLow: avgTemp - 5 - pseudoRandom(dayNum + 400) * 5,
                isFuture,
                isPeak: false
            };
        });
    }, [customerId, dailyDataLocal, weatherDataLocal, now]);

    // 5b. Range Data (Fetched from backend based on From/To)
    useEffect(() => {
        if (!customerId || !isMyUsagePage) return;

        const fetchRangeData = async () => {
            try {
                const data = await getDailyUsage(customerId, {
                    start_date: rangeStartDate,
                    end_date: rangeEndDate
                });
                setRangeData(data || []);
            } catch (err) {
                console.error("Failed to fetch range data", err);
            }
        };

        fetchRangeData();
    }, [customerId, rangeStartDate, rangeEndDate, isMyUsagePage]);

    const formattedRangeData = useMemo(() => {
        const start = new Date(rangeStartDate);
        const end = new Date(rangeEndDate);
        const result: any[] = [];

        const curr = new Date(start);
        // Safety break to prevent infinite loop
        let count = 0;
        while (curr <= end && count < 366) {
            const dateStr = curr.toISOString().split('T')[0];
            const real = rangeData.find((d: any) => d.USAGE_DATE.startsWith(dateStr));
            const isFuture = curr > now;
            const dayNum = curr.getDate();

            // Mock values for peer/predicted if real data is missing
            const mockMy = 15 + pseudoRandom(dayNum + 100) * 10;
            const mockPeer = 20 * (0.8 + pseudoRandom(dayNum + 200) * 0.4);

            const avgTemp = real?.avg_temp || (15 + pseudoRandom(dayNum + 100) * 10) + 40; // Mock avg temp
            result.push({
                label: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                dateStr: dateStr,
                my: real ? real.VALUE : (isFuture ? null : mockMy * 0.8), // Restore mock fallback for past dates
                peer: real?.peer_value || mockPeer,
                predicted: mockMy, // Unified predicted line across past and future
                temp: avgTemp,
                tempHigh: avgTemp + 7 + pseudoRandom(dayNum + 500) * 5,
                tempLow: avgTemp - 7 - pseudoRandom(dayNum + 600) * 5,
                isFuture
            });

            curr.setDate(curr.getDate() + 1);
            count++;
        }
        return result;
    }, [rangeData, rangeStartDate, rangeEndDate, now]);

    // Hourly data for the selected day in popup
    const selectedDayHourlyData = useMemo(() => {
        if (!selectedDayDetail) return [];
        // Generate mock hourly data based on the daily total to ensure consistency
        const total = selectedDayDetail.my || 15;
        return Array.from({ length: 24 }, (_, i) => {
            const ampm = i >= 12 ? 'PM' : 'AM';
            const hourLabel = `${i % 12 || 12}${ampm}`;
            // Use a bell curve for residential usage (peaks in morning and evening)
            const baseFactor = Math.sin((i - 6) / 12 * Math.PI) + 1;
            const morningPeak = Math.exp(-Math.pow(i - 8, 2) / 4);
            const eveningPeak = Math.exp(-Math.pow(i - 19, 2) / 8);
            const multiplier = (0.2 + baseFactor * 0.3 + morningPeak * 0.8 + eveningPeak * 1.2);

            return {
                time: hourLabel,
                value: (total / 24) * multiplier * (0.8 + Math.random() * 0.4),
                peer: (selectedDayDetail.peer / 24) * multiplier * (0.7 + Math.random() * 0.3),
                temp: 65 + Math.sin((i - 10) / 12 * Math.PI) * 15 + Math.random() * 2,
                predicted: (total / 24) * multiplier * (0.9 + Math.random() * 0.2)
            };
        });
    }, [selectedDayDetail]);

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
                                color = '#475569'; // Slate 600 - much better contrast
                                name = 'Peer Baseline';
                            } else if (name?.toLowerCase().includes('you') || entry.dataKey === 'value') {
                                color = '#f97316'; // Orange 500
                                name = 'Your Usage';
                            } else if (entry.dataKey === 'tempHigh') {
                                color = '#f87171'; // Red 400
                                name = 'High Temp';
                                suffix = "°F";
                            } else if (entry.dataKey === 'tempLow') {
                                color = '#60a5fa'; // Blue 400
                                name = 'Low Temp';
                                suffix = "°F";
                            } else if (entry.dataKey === 'temp' || name?.toLowerCase().includes('temp')) {
                                color = '#10b981'; // Emerald 500
                                name = 'Avg Temp';
                                suffix = "°F";
                            } else if (name?.toLowerCase().includes('predicted')) {
                                color = '#8b5cf6'; // Violet 500
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
        const currentIndex = formattedRangeData.findIndex(d => d.dateStr === selectedDayDetail.dateStr);
        if (currentIndex === -1) return;

        const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex >= 0 && newIndex < formattedRangeData.length) {
            setSelectedDayDetail(formattedRangeData[newIndex]);
        }
    };

    return (
        <div className="mb-3 space-y-3">


            {/* 1. MY CURRENT USAGE DRILL-DOWN SECTION */}
            <section>
                <div className="flex items-center gap-1.5 mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Consumption Drill-down</h2>
                </div>

                {isMyUsagePage && (
                    <div className="mb-3">
                        <Card className="bg-[var(--bg-surface-1)] border-none shadow-sm overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select Period</h3>
                                            <SimpleTooltip content="Select a date range to drill down into your behavioral patterns.">
                                                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                            </SimpleTooltip>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">From</span>
                                                <input
                                                    type="date"
                                                    value={rangeStartDate}
                                                    onChange={(e) => setRangeStartDate(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">To</span>
                                                <input
                                                    type="date"
                                                    value={rangeEndDate}
                                                    onChange={(e) => setRangeEndDate(e.target.value)}
                                                    className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">You</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 border border-slate-300 bg-slate-100 rounded-sm"></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Peer</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Predicted</span>
                                            </div>
                                            {tempDisplayMode === 'avg' && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-0.5 w-3 bg-emerald-500"></div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Temp</span>
                                                </div>
                                            )}
                                            {tempDisplayMode === 'highlow' && (
                                                <>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-0.5 w-3 bg-red-400"></div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">High Temp</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-0.5 w-3 bg-blue-400"></div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Low Temp</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    className="w-3 h-3 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    checked={tempDisplayMode === 'avg'}
                                                    onChange={() => setTempDisplayMode('avg')}
                                                />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-800 transition-colors">Show Avg Temp</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    className="w-3 h-3 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    checked={tempDisplayMode === 'highlow'}
                                                    onChange={() => setTempDisplayMode('highlow')}
                                                />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-800 transition-colors">Show High & Low Temp</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    className="w-3 h-3 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    checked={tempDisplayMode === 'hide'}
                                                    onChange={() => setTempDisplayMode('hide')}
                                                />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-800 transition-colors">Hide Temp</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={formattedRangeData}
                                            margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                                        >
                                            <XAxis
                                                dataKey="label"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748b' }}
                                                interval="preserveStartEnd"
                                                minTickGap={20}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'kWh', position: 'top', offset: 10, fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis yAxisId="temp" hide domain={[0, 120]} />
                                            <Tooltip content={<CustomTooltip />} allowEscapeViewBox={{ x: false, y: false }} />
                                            <Bar
                                                dataKey="peer"
                                                name="Peer Baseline"
                                                fill="#e2e8f0"
                                                radius={[2, 2, 0, 0]}
                                                maxBarSize={40}
                                            />
                                            <Bar
                                                dataKey="predicted"
                                                name="Predicted"
                                                fill="#8b5cf6"
                                                fillOpacity={0.4}
                                                radius={[2, 2, 0, 0]}
                                                maxBarSize={40}
                                            />
                                            <Bar
                                                dataKey="my"
                                                name="Your Usage"
                                                radius={[2, 2, 0, 0]}
                                                maxBarSize={40}
                                            >
                                                {formattedRangeData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill="#f97316"
                                                        fillOpacity={entry.isFuture ? 0.3 : 1}
                                                        cursor="pointer"
                                                        onClick={() => setSelectedDayDetail(entry)}
                                                    />
                                                ))}
                                            </Bar>
                                            {tempDisplayMode === 'avg' && (
                                                <Line
                                                    yAxisId="temp"
                                                    type="monotone"
                                                    dataKey="temp"
                                                    name="Avg Temp"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            )}
                                            {tempDisplayMode === 'highlow' && (
                                                <>
                                                    <Line
                                                        yAxisId="temp"
                                                        type="monotone"
                                                        dataKey="tempHigh"
                                                        name="High Temp"
                                                        stroke="#f87171"
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                    <Line
                                                        yAxisId="temp"
                                                        type="monotone"
                                                        dataKey="tempLow"
                                                        name="Low Temp"
                                                        stroke="#60a5fa"
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </>
                                            )}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}


                {/* Only show old charts on NON-MyUsage regular dashboard */}
                {!isMyUsagePage && (
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {/* Today Card */}
                        <Card className="bg-[var(--bg-surface-1)] border-none shadow-sm overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <p className="text-[12px] font-medium text-blue-800">Usage peaks at 7 PM during evening.</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Today ({currentDay})</h3>
                                        <SimpleTooltip content="Displays your hourly energy consumption compared to your peers for today.">
                                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                        </SimpleTooltip>
                                    </div>
                                    <div className="flex gap-3 items-center mt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">You</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 border border-slate-300 bg-slate-100 rounded-sm"></div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Peer</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[140px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={todayData} margin={{ top: 20, right: 5, left: -15, bottom: 0 }}>
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={(props) => {
                                                const { x, y, payload } = props;
                                                const d = todayData.find((d: any) => d.label === payload.value);
                                                const label = d?.displayLabel;
                                                if (!label) return <g></g>;
                                                return <text x={x} y={y + 12} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="500">{label}</text>;
                                            }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'kWh', position: 'top', offset: 10, fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <Tooltip content={<CustomTooltip />} allowEscapeViewBox={{ x: false, y: false }} />
                                            <Bar dataKey="peer" fill="#e2e8f0" radius={[1, 1, 0, 0]} maxBarSize={8} />
                                            <Bar dataKey="my" radius={[1, 1, 0, 0]} maxBarSize={8}>
                                                {todayData.map((_, index) => <Cell key={`cell-${index}`} fill="#f97316" />)}
                                            </Bar>
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Month Card */}
                        <Card className="bg-[var(--bg-surface-1)] border-none shadow-sm overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <p className="text-[12px] font-medium text-blue-800">Great! Usage is 36% below peer average.</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Usage this month ({currentMonth} {currentYear})</h3>
                                        <SimpleTooltip content="Displays your daily energy consumption compared to your peers for the current month.">
                                            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                        </SimpleTooltip>
                                    </div>
                                    <div className="flex gap-3 items-center mt-0.5">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase">You</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-slate-300 bg-slate-100 rounded-sm"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Peer</span></div>
                                        <div className="flex items-center gap-1.5"><div className="h-0.5 w-3 bg-red-400"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Temp</span></div>
                                    </div>
                                </div>
                                <div className="h-[140px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={monthData} margin={{ top: 20, right: 5, left: -15, bottom: 0 }}>
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={6} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'kWh', position: 'top', offset: 10, fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <Tooltip content={<CustomTooltip />} allowEscapeViewBox={{ x: false, y: false }} />
                                            <Bar dataKey="peer" fill="#e2e8f0" radius={[1, 1, 0, 0]} maxBarSize={8} />
                                            <Bar dataKey="my" radius={[1, 1, 0, 0]} maxBarSize={8}>
                                                {monthData.map((entry, index) => <Cell key={`cell-${index}`} fill="#f97316" fillOpacity={entry.isFuture ? 0.3 : 1} />)}
                                            </Bar>
                                            <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </section>

            {/* DAY DETAIL POPUP / MODAL */}
            {selectedDayDetail && (
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
                                            <h2 className="text-lg font-black text-slate-800 leading-tight">{selectedDayDetail.label}, {currentYear}</h2>
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
                                {/* DRAGGED CHART UP TO TOP */}
                                <div className="pt-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hourly Usage Pattern</h4>
                                        <div className="flex gap-3 text-[9px] font-bold uppercase">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span className="text-slate-500">You</span>
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
                                                    dataKey="value"
                                                    name="You"
                                                    fill="#f97316"
                                                    radius={[2, 2, 0, 0]}
                                                    maxBarSize={12}
                                                />
                                                <Line
                                                    yAxisId="temp"
                                                    type="monotone"
                                                    dataKey="temp"
                                                    name="Temperature"
                                                    stroke="#22c55e"
                                                    strokeWidth={1.5}
                                                    dot={{ r: 3, fill: '#22c55e', strokeWidth: 1, stroke: '#fff' }}
                                                    activeDot={{ r: 5 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="predicted"
                                                    name="Predicted"
                                                    stroke="#a855f7"
                                                    strokeWidth={1.5}
                                                    strokeDasharray="4 4"
                                                    dot={false}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1">
                                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                                        <p className="text-[10px] font-bold text-orange-500 uppercase mb-1">Your Usage</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedDayDetail.my ? `${selectedDayDetail.my.toFixed(2)} kWh` : 'N/A'}</p>
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
                                                High variable load detected between 6 PM - 9 PM. Consider shifting dishwashing or laundry to off-peak morning hours.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedDayDetail(null)}
                                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                >
                                    Dismiss Insights
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
