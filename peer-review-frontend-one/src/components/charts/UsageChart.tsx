import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { getMonthlyUsage, getDailyUsage, getHourlyUsage } from "@/lib/api";
import { ThermometerSun } from 'lucide-react';
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";

const VIEW_CONFIGS = {
    monthly: { dataKey: 'MONTHLY_KWH', costKey: 'MONTHLY_COST', labelKey: 'BILLING_MONTH', fetch: getMonthlyUsage },
    daily: { dataKey: 'DAILY_KWH', costKey: 'DAILY_COST', labelKey: 'USAGE_DATE', fetch: getDailyUsage },
    hourly: { dataKey: 'KWH', costKey: 'COST', labelKey: 'USAGE_HOUR', fetch: getHourlyUsage }
};

interface UsageChartProps {
    customerId: string;
}

export function UsageChart({ customerId }: UsageChartProps) {
    const [view, setView] = useState<'monthly' | 'daily' | 'hourly'>('monthly');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [showTemp, setShowTemp] = useState(true);

    // Drill-down State
    const [history, setHistory] = useState<{ view: 'monthly' | 'daily' | 'hourly', filter: any }[]>([]);
    const [currentFilter, setCurrentFilter] = useState<any>({});
    const [viewTitle, setViewTitle] = useState("Usage Analytics");

    useEffect(() => {
        async function loadData() {
            if (!customerId) return;
            setLoading(true);
            try {
                let result;
                if (view === 'monthly') {
                    result = await VIEW_CONFIGS.monthly.fetch(customerId);
                    setViewTitle("Monthly Usage & Cost");
                } else if (view === 'daily') {
                    result = await VIEW_CONFIGS.daily.fetch(customerId, currentFilter);
                    const monthLabel = currentFilter.start_date ? new Date(currentFilter.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Last 30 Days';
                    setViewTitle(`Daily Usage & Cost - ${monthLabel}`);
                } else if (view === 'hourly') {
                    result = await VIEW_CONFIGS.hourly.fetch(customerId, currentFilter);
                    const dayLabel = currentFilter.usage_date ? new Date(currentFilter.usage_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Last 24 Hours';
                    setViewTitle(`Hourly Usage & Cost - ${dayLabel}`);
                }

                // Sort and Enrich with Mock Temperature if missing
                const processed = [...(result || [])].map((item: any) => {
                    let temp = item.TEMP_F || item.MIN_TEMP_F || item.MAX_TEMP_F;
                    if (!temp) {
                        // Simulate Temperature for demo
                        if (view === 'monthly') temp = 65 + Math.random() * 20;
                        if (view === 'daily') temp = 70 + (item.DAILY_KWH ? item.DAILY_KWH * 0.5 : 0) + (Math.random() * 10 - 5);
                        if (view === 'hourly') {
                            const hour = item.USAGE_HOUR || 12;
                            temp = 60 + 15 * Math.sin((hour - 6) * 3.14 / 12) + (Math.random() * 2);
                        }
                    }
                    return { ...item, TEMP: Math.round(temp) };
                });

                const sorted = processed.sort((a, b) => {
                    if (view === 'hourly') {
                        const dateA = new Date(a.USAGE_DATE).getTime();
                        const dateB = new Date(b.USAGE_DATE).getTime();
                        return dateA === dateB ? a.USAGE_HOUR - b.USAGE_HOUR : dateA - dateB;
                    }
                    return new Date(a[VIEW_CONFIGS[view].labelKey]).getTime() - new Date(b[VIEW_CONFIGS[view].labelKey]).getTime();
                });
                setData(sorted);
            } catch (error) {
                console.error("Failed to fetch usage data:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [view, currentFilter, customerId]);

    const handleBarClick = (data: any) => {
        if (view === 'monthly') {
            const monthStart = new Date(data.BILLING_MONTH);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

            setHistory([...history, { view, filter: currentFilter }]);
            setCurrentFilter({
                start_date: data.BILLING_MONTH,
                end_date: monthEnd.toISOString().split('T')[0]
            });
            setView('daily');
        } else if (view === 'daily') {
            setHistory([...history, { view, filter: currentFilter }]);
            setCurrentFilter({ usage_date: data.USAGE_DATE });
            setView('hourly');
        }
    };

    const handleBack = () => {
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            setView(lastState.view);
            setCurrentFilter(lastState.filter);
        } else {
            setView('monthly');
            setCurrentFilter({});
        }
    };

    const formatXAxis = (tickItem: any, _index?: any) => {
        if (!tickItem) return '';
        const date = new Date(tickItem);
        if (isNaN(date.getTime())) return tickItem; // Fallback if invalid

        if (view === 'monthly') return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
        if (view === 'daily') return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });

        if (view === 'hourly') {
            const hour = parseInt(tickItem);
            if (isNaN(hour)) return tickItem;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const h = hour % 12 || 12;
            return `${h} ${ampm}`;
        }
        return tickItem;
    };

    const totalUsage = data.reduce((acc, curr) => acc + (curr[VIEW_CONFIGS[view].dataKey] || 0), 0);

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
                <div className="flex items-center gap-2">
                    {history.length > 0 && (
                        <button
                            onClick={handleBack}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            title="Go Back"
                        >
                            <span className="text-xl">←</span>
                        </button>
                    )}
                    <CardTitle className="text-base font-normal text-slate-500">
                        {viewTitle}
                    </CardTitle>
                </div>

                <div className="flex items-center gap-4">
                    {/* Temp Toggle */}
                    <button
                        onClick={() => setShowTemp(!showTemp)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            showTemp
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        )}
                    >
                        <ThermometerSun className="h-3.5 w-3.5" />
                        Temp
                    </button>

                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {['monthly', 'daily', 'hourly'].map((v) => (
                            <button
                                key={v}
                                onClick={() => {
                                    if (v === 'monthly') {
                                        setHistory([]);
                                        setCurrentFilter({});
                                    }
                                    setView(v as any);
                                }}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                                    view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <div className="text-3xl font-bold text-slate-900">
                        {loading ? "..." : totalUsage.toFixed(1)} <span className="text-lg font-normal text-slate-500">kWh</span>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart onClick={(state) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                                handleBarClick(state.activePayload[0].payload);
                            }
                        }} data={data} onMouseMove={(state: any) => {
                            if (state.isTooltipActive) setActiveIndex(state.activeTooltipIndex);
                            else setActiveIndex(null);
                        }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey={VIEW_CONFIGS[view].labelKey}
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatXAxis}
                            />
                            {/* Left Y-Axis for Usage (kWh) */}
                            <YAxis
                                yAxisId="left"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 10 } }}
                            />
                            {/* Right Y-Axis for Cost ($) */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#f59e0b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                                label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 10 } }}
                            />
                            {/* Hidden Axis for Temp to scale nicely */}
                            {showTemp && (
                                <YAxis
                                    yAxisId="temp"
                                    orientation="right"
                                    hide
                                    domain={['auto', 'auto']}
                                />
                            )}

                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={formatXAxis}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />

                            <Bar
                                yAxisId="left"
                                dataKey={VIEW_CONFIGS[view].dataKey}
                                name="Usage (kWh)"
                                radius={[4, 4, 0, 0]}
                                style={{ cursor: view !== 'hourly' ? 'pointer' : 'default' }}
                            >
                                {data.map((_entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={activeIndex === index ? '#2563eb' : '#93c5fd'}
                                        fillOpacity={showTemp ? 0.8 : 1}
                                    />
                                ))}
                            </Bar>

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey={VIEW_CONFIGS[view].costKey}
                                name="Cost ($)"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />

                            {showTemp && (
                                <Line
                                    yAxisId="temp"
                                    type="monotone"
                                    dataKey="TEMP"
                                    name="Temperature (°F)"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* AI Smart Analysis */}
                <div className="mt-2">
                    <AIChartAnalysis
                        chartType={`Usage Analysis (${view})`}
                        dataContext={{
                            view_mode: view,
                            total_usage: totalUsage,
                            data_sample: data.slice(-7), // Last 7 points
                            current_filter: currentFilter
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
