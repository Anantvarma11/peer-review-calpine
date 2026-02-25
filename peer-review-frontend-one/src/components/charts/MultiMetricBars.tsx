import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BarChart3, Loader2, LineChart as LineChartIcon, Activity } from 'lucide-react';
import { getDailyUsage } from '@/lib/api';

export function MultiMetricBars() {
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<any[]>([]); // Store full dataset
    const [data, setData] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState("");
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'Nov-Dec'>('7D');
    const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
    const [visibleMetrics, setVisibleMetrics] = useState({ usage: true, cost: true, temp: true });
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch a larger dataset (e.g., last 90 days) to allow client-side filtering
                const dailyData = await getDailyUsage('983241', { start_date: '2023-01-01' }); // Adjusted optional params if needed, or just fetch all
                if (dailyData && dailyData.length > 0) {
                    const sorted = [...dailyData].sort((a: any, b: any) =>
                        new Date(a.USAGE_DATE).getTime() - new Date(b.USAGE_DATE).getTime()
                    );
                    setRawData(sorted);
                }
            } catch (err) {
                console.error("Failed to load multi-metric data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter data based on selected timeRange and startDate
    useEffect(() => {
        if (rawData.length > 0) {
            let processed;

            if (timeRange === 'Nov-Dec') {
                // Specific month filtering overrides start date logic
                processed = rawData.filter((item: any) => {
                    const date = new Date(item.USAGE_DATE);
                    const month = date.getMonth();
                    return month === 10 || month === 11; // Nov (10) or Dec (11)
                });
            } else {
                const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;

                if (startDate) {
                    // Forward filtering from Start Date
                    const startTimestamp = new Date(startDate).getTime();
                    const filtered = rawData.filter((item: any) => new Date(item.USAGE_DATE).getTime() >= startTimestamp);
                    processed = filtered.slice(0, days);
                } else {
                    // Backward filtering (Last N Days)
                    processed = rawData.slice(-days);
                }
            }

            const mapped = processed.map((item: any) => ({
                date: new Date(item.USAGE_DATE).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
                fullDate: new Date(item.USAGE_DATE),
                usage: Math.round(item.DAILY_KWH * 10) / 10,
                cost: parseFloat((item.DAILY_COST || item.DAILY_KWH * 0.14).toFixed(2)),
                temp: Math.round(item.TEMP_F || 65 + Math.random() * 15)
            }));

            setData(mapped);

            if (mapped.length > 0) {
                const start = mapped[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const end = mapped[mapped.length - 1].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                setDateRange(`${start} - ${end}`);
            } else {
                setDateRange("No Data");
            }
        }
    }, [rawData, timeRange, startDate]);

    const toggleMetric = (metric: keyof typeof visibleMetrics) => {
        setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    const ChartSection = ({ title, dataKey, color, unit, prefix = "" }: any) => (
        <div className="flex flex-col h-[200px] w-full animate-in fade-in zoom-in duration-300">
            <p className="text-xs font-bold text-slate-500 mb-2 text-center uppercase tracking-wide">{title}</p>
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                    <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                            label={{ value: timeRange === 'Nov-Dec' ? 'Nov - Dec' : startDate ? `Next ${timeRange}` : `Last ${timeRange}`, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                            label={{ value: unit || prefix, angle: -90, position: 'insideLeft', offset: 0, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`${prefix}${value}${unit}`, title]}
                        />
                        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                            ))}
                        </Bar>
                    </BarChart>
                ) : chartType === 'line' ? (
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                            label={{ value: timeRange === 'Nov-Dec' ? 'Nov - Dec' : startDate ? `Next ${timeRange}` : `Last ${timeRange}`, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                            label={{ value: unit || prefix, angle: -90, position: 'insideLeft', offset: 0, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`${prefix}${value}${unit}`, title]}
                        />
                        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, strokeWidth: 0 }} />
                    </LineChart>
                ) : (
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                        <defs>
                            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                            label={{ value: timeRange === 'Nov-Dec' ? 'Nov - Dec' : startDate ? `Next ${timeRange}` : `Last ${timeRange}`, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            fontSize={10}
                            tick={{ fill: '#94a3b8' }}
                            label={{ value: unit || prefix, angle: -90, position: 'insideLeft', offset: 0, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`${prefix}${value}${unit}`, title]}
                        />
                        <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color-${dataKey})`} />
                    </AreaChart>
                )}
            </ResponsiveContainer>
        </div>
    );

    const activeCount = Object.values(visibleMetrics).filter(Boolean).length;
    const gridCols = activeCount === 1 ? 'grid-cols-1' : activeCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';

    return (
        <Card className="col-span-1 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-slate-500" />
                        Metric Comparison
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                        Analysis for <span className="font-semibold text-slate-700">{dateRange || "Last 7 Days"}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Time Range Selector */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg gap-1">
                        {/* Start Date Picker */}
                        <div className="flex items-center mr-2">
                            <span className="text-[10px] text-slate-400 mr-2 uppercase font-bold">Start From:</span>
                            <input
                                type="date"
                                className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:border-indigo-500"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min="2023-01-01"
                            />
                        </div>

                        <button
                            onClick={() => setTimeRange('7D')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${timeRange === '7D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            7D
                        </button>
                        <button
                            onClick={() => setTimeRange('30D')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${timeRange === '30D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            30D
                        </button>
                        <button
                            onClick={() => setTimeRange('90D')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${timeRange === '90D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            90D
                        </button>
                        <button
                            onClick={() => setTimeRange('Nov-Dec')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${timeRange === 'Nov-Dec' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Nov-Dec
                        </button>
                    </div>
                    {/* Chart Type Toggles */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Bar Chart"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Line Chart"
                        >
                            <LineChartIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setChartType('area')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'area' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Area Chart"
                        >
                            <Activity className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Metric Toggles */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => toggleMetric('usage')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${visibleMetrics.usage ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Usage
                        </button>
                        <button
                            onClick={() => toggleMetric('cost')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${visibleMetrics.cost ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Cost
                        </button>
                        <button
                            onClick={() => toggleMetric('temp')}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${visibleMetrics.temp ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Temp
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="h-[200px] w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className={`grid ${gridCols} gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 transition-all`}>
                        {visibleMetrics.usage && <ChartSection title="Energy Usage" dataKey="usage" color="#3b82f6" unit=" kWh" />}
                        {visibleMetrics.cost && <ChartSection title="Cost" dataKey="cost" color="#f59e0b" unit="" prefix="$" />}
                        {visibleMetrics.temp && <ChartSection title="Temperature" dataKey="temp" color="#ef4444" unit="°F" />}
                        {activeCount === 0 && (
                            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic col-span-3">
                                Select a metric to view data
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
