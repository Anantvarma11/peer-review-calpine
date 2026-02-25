import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    LineChart, Line, Bar, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { getDailyUsage, getMonthlyUsage, getHourlyUsage } from "@/lib/api";
import { BarChart3, TrendingUp, ArrowLeft, Users, MoreHorizontal } from 'lucide-react';
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";
import { useUI } from "@/lib/do-library/context/UIContext";


interface MyUsageComparisonChartProps {
    customerId?: string;
    projectedData?: any[];
}

type ChartView = 'monthly_bar' | 'daily_bar' | 'hourly_bar' | 'daily_line';

export function MyUsageComparisonChart({ customerId, projectedData }: MyUsageComparisonChartProps) {
    const [view, setView] = useState<ChartView>('monthly_bar');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPeer, setShowPeer] = useState(false);
    const { isDark } = useUI();

    // Drilldown context
    const [drillDate, setDrillDate] = useState<string | null>(null); // ISO date string of context (e.g. Month start or Day)
    const [drillHistory, setDrillHistory] = useState<ChartView[]>([]);

    // Date Range Picker - using Date objects for react-datepicker
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper to filter data by selected date range
    const filterByDateRange = (items: any[], dateField: string) => {
        if (!startDate && !endDate) return items;
        return items.filter((item: any) => {
            // Parse the date string properly
            const itemDateStr = item[dateField];
            if (!itemDateStr) return false;
            const itemDate = new Date(itemDateStr);
            // Set time to start of day for proper comparison
            itemDate.setHours(0, 0, 0, 0);
            const itemTime = itemDate.getTime();

            // Create new Date objects to avoid mutating state
            let afterStart = true;
            let beforeEnd = true;

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                afterStart = itemTime >= start.getTime();
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                beforeEnd = itemTime <= end.getTime();
            }

            return afterStart && beforeEnd;
        });
    };

    useEffect(() => {
        if (!customerId) return;

        async function loadData() {
            setLoading(true);
            try {
                if (view === 'daily_line') {
                    // --- EXISTING DAILY TREND LINE CHART (ALL TIME) ---
                    const dailyData = await getDailyUsage(customerId!);
                    const sorted = [...(dailyData || [])].sort((a: any, b: any) =>
                        new Date(a.USAGE_DATE).getTime() - new Date(b.USAGE_DATE).getTime()
                    );
                    const processed = sorted.map((item: any) => {
                        const temp = item.TEMP_F || item.MIN_TEMP_F || 65 + Math.random() * 15;
                        return {
                            date: new Date(item.USAGE_DATE).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
                            'Energy Usage': Math.round(item.DAILY_KWH || 0),
                            'Usage Cost': parseFloat((item.DAILY_COST || 0).toFixed(2)),
                            'Temperature': Math.round(temp),
                            originalDate: item.USAGE_DATE
                        };
                    });
                    // Apply date range filter
                    const filtered = filterByDateRange(processed, 'originalDate');
                    setData(filtered);

                } else if (view === 'monthly_bar') {
                    // --- MONTHLY BAR+LINE ---
                    const monthlyData = await getMonthlyUsage(customerId!);
                    const sorted = [...(monthlyData || [])].sort((a: any, b: any) =>
                        new Date(a.BILLING_MONTH).getTime() - new Date(b.BILLING_MONTH).getTime()
                    );
                    const processed = sorted.map((item: any) => ({
                        date: new Date(item.BILLING_MONTH).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                        'Energy Usage': Math.round(item.MONTHLY_KWH || 0),
                        'Usage Cost': parseFloat((item.MONTHLY_COST || 0).toFixed(2)),
                        originalDate: item.BILLING_MONTH // Used for drilldown
                    }));
                    // Apply date range filter
                    const filtered = filterByDateRange(processed, 'originalDate');
                    setData(filtered);

                } else if (view === 'daily_bar') {
                    // If receiving projected data, use it!
                    if (projectedData && projectedData.length > 0) {
                        // Fetch last 14 days for context
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - 14);

                        const params = {
                            start_date: start.toISOString().split('T')[0],
                            end_date: end.toISOString().split('T')[0]
                        };

                        const dailyData = await getDailyUsage(customerId!, params);

                        const processedHistory = dailyData.map((item: any) => ({
                            date: new Date(item.USAGE_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            'Energy Usage': Math.round(item.DAILY_KWH || 0),
                            'Usage Cost': parseFloat((item.DAILY_COST || 0).toFixed(2)),
                            'Peer Avg': Math.round((item.DAILY_KWH || 0) * (0.85 + Math.random() * 0.3)),
                            originalDate: item.USAGE_DATE,
                            isProjected: false
                        }));

                        const processedProjection = projectedData.map((item: any) => ({
                            ...item,
                            isProjected: true
                        }));

                        setData([...processedHistory, ...processedProjection]);
                        setLoading(false);
                        return; // Exit early
                    }

                    // --- DAILY BAR+LINE --- (Filtered if drilled or by date range)
                    let params = {};
                    if (drillDate && !startDate && !endDate) {
                        // Only use drillDate if no manual date range is selected
                        const start = new Date(drillDate);
                        const end = new Date(drillDate);
                        end.setMonth(end.getMonth() + 1);
                        end.setDate(0); // Last day of month
                        params = {
                            start_date: start.toISOString().split('T')[0],
                            end_date: end.toISOString().split('T')[0]
                        };
                    }

                    const dailyData = await getDailyUsage(customerId!, params);
                    const sorted = [...(dailyData || [])].sort((a: any, b: any) =>
                        new Date(a.USAGE_DATE).getTime() - new Date(b.USAGE_DATE).getTime()
                    );
                    const processed = sorted.map((item: any) => ({
                        date: new Date(item.USAGE_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        'Energy Usage': Math.round(item.DAILY_KWH || 0),
                        'Usage Cost': parseFloat((item.DAILY_COST || 0).toFixed(2)),
                        // Mock Peer Data relative to usage for demo
                        'Peer Avg': Math.round((item.DAILY_KWH || 0) * (0.85 + Math.random() * 0.3)),
                        originalDate: item.USAGE_DATE // Used for drilldown
                    }));
                    // Apply date range filter
                    const filtered = filterByDateRange(processed, 'originalDate');
                    setData(filtered);

                } else if (view === 'hourly_bar') {
                    // --- HOURLY BAR+LINE ---
                    let params = {};
                    if (drillDate && !startDate && !endDate) {
                        // Only use drillDate if no manual date range is selected
                        params = { usage_date: drillDate };
                    }

                    const hourlyData = await getHourlyUsage(customerId!, params);
                    const sorted = [...(hourlyData || [])].sort((a: any, b: any) => {
                        const da = new Date(a.USAGE_DATE).getTime();
                        const db = new Date(b.USAGE_DATE).getTime();
                        return da === db ? a.USAGE_HOUR - b.USAGE_HOUR : da - db;
                    });

                    const processed = sorted.map((item: any) => {
                        const h = item.USAGE_HOUR;
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const hourLabel = `${h % 12 || 12} ${ampm}`;
                        return {
                            date: hourLabel,
                            fullDate: item.USAGE_DATE,
                            originalDate: item.USAGE_DATE,
                            'Energy Usage': Math.round(item.KWH || 0),
                            'Usage Cost': parseFloat((item.COST || 0).toFixed(2)),
                        };
                    });
                    // Apply date range filter
                    const filtered = filterByDateRange(processed, 'originalDate');
                    setData(filtered);
                }

            } catch (error) {
                console.error("Failed to load chart data", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        // If projectedData just arrived, auto-switch to daily_bar to view it
        if (projectedData && projectedData.length > 0 && view !== 'daily_bar') {
            setView('daily_bar');
        }

        loadData();
    }, [customerId, view, drillDate, startDate, endDate, projectedData]);

    // Drilldown Handlers
    const handleBarClick = (data: any) => {
        if (!data || !data.activePayload) return;
        const item = data.activePayload[0].payload;

        if (view === 'monthly_bar') {
            // Clicked Month -> Go to Daily for that month
            setDrillHistory(prev => [...prev, view]);
            setDrillDate(item.originalDate);
            setView('daily_bar');
        } else if (view === 'daily_bar') {
            // Clicked Day -> Go to Hourly for that day
            setDrillHistory(prev => [...prev, view]);
            setDrillDate(item.originalDate);
            setView('hourly_bar');
        }
    };

    const handleBack = () => {
        if (drillHistory.length > 0) {
            const prevView = drillHistory[drillHistory.length - 1];
            setDrillHistory(prev => prev.slice(0, -1));
            setView(prevView);
            // If going back to monthly, clear date. If back to daily, set date to month? 
            // Simplified: Clear drillDate if we go back to top, but if we go Hourly->Daily, keep month context?
            // Actually, drillDate needs to revert to MONTH context if we go back to Daily.
            // But storing history is simpler if we just reset or re-derive.
            // Let's just pop history. If we go back to Monthly, drillDate is irrelevant (null).
            // If we go back to Daily from Hourly, we theoretically need the Month context.
            // For simplicity, let's just use the history stack and if we go back to 'monthly_bar', clear drillDate.
            if (prevView === 'monthly_bar') setDrillDate(null);
            // Note: If we go back to daily_bar, we still need the drillDate (month) so don't clear it.
        } else {
            // Default reset
            setView('monthly_bar');
            setDrillDate(null);
        }
    };

    const isScrollable = view === 'daily_line' || view === 'daily_bar' || view === 'hourly_bar';
    const chartWidth = isScrollable ? Math.max(data.length * (view.includes('hourly') ? 40 : 50), 600) : '100%';

    // Calculate KPIs from visible data
    const totalKwh = data.reduce((acc, item) => acc + (item['Energy Usage'] || 0), 0);
    const totalCost = data.reduce((acc, item) => acc + (item['Usage Cost'] || 0), 0);

    // Determine Label Context
    const getKpiLabel = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // If same month
            if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                return `(${start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })})`;
            }
            return `(Selected Period)`;
        }
        if (view === 'monthly_bar') return '(Last 24 Mos)';
        return '(All Time)';
    };

    const applyPreset = (preset: 'thisMonth' | 'lastMonth' | 'ytd' | 'last30') => {
        // Use most recent data date as reference (Dec 2025 based on database)
        // This ensures filters work even when current date is ahead of data
        const referenceDate = new Date('2025-12-21');
        let start = new Date(referenceDate);
        let end = new Date(referenceDate);

        if (preset === 'thisMonth') {
            // "This Month" = December 2025 (month of most recent data)
            start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
            end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        } else if (preset === 'lastMonth') {
            // "Last Month" = November 2025
            start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
            end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
        } else if (preset === 'ytd') {
            // Year to Date = Jan 1, 2025 to Dec 21, 2025
            start = new Date(referenceDate.getFullYear(), 0, 1);
            end = new Date(referenceDate);
        } else if (preset === 'last30') {
            // Last 30 days from reference date
            start = new Date(referenceDate);
            start.setDate(referenceDate.getDate() - 30);
            end = new Date(referenceDate);
        }

        setStartDate(start);
        setEndDate(end);
    };

    const axisColor = isDark ? "#9BA4B0" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0";
    const tooltipBg = isDark ? "#1C222B" : "#ffffff";
    const tooltipText = isDark ? "rgba(255,255,255,0.9)" : "#0F172A";

    // Initial Load Auto-Correction
    // If strict mode returns data but "current month" is empty, we might want to auto-adjust? 
    // For now, we'll provide a clear "Show All" action in the empty state.

    if (loading) {
        return (
            <Card className="col-span-1 shadow-sm bg-white h-[450px] flex items-center justify-center">
                <div className="text-[var(--text-secondary)]">Loading data...</div>
            </Card>
        );
    }

    return (
        <>
            {/* Date Range Selector */}
            <DateRangeSelector
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                totalUsage={totalKwh}
                totalCost={totalCost}
                onClear={() => { setStartDate(null); setEndDate(null); }}
            />

            <Card className="col-span-1 shadow-sm bg-[var(--bg-surface-1)] border-[var(--border-subtle)]">
                <CardHeader className="flex flex-col gap-4 pb-2 border-b border-[var(--border-subtle)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                            {drillHistory.length > 0 && (
                                <button onClick={handleBack} className="mr-2 p-1 hover:bg-[var(--bg-surface-2)] transition-colors" title="Go Back">
                                    <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
                                </button>
                            )}
                            <span className="flex items-center gap-2">
                                {view === 'daily_line' ? <TrendingUp className="h-5 w-5 text-blue-600" /> : <BarChart3 className="h-5 w-5 text-blue-600" />}
                                Usage Analysis
                            </span>
                        </CardTitle>

                        {/* View Controls: Granularity Toggles + Peer + Menu */}
                        <div className="flex items-center gap-2">
                            <div className="flex bg-[var(--bg-surface-2)] border-[var(--border-subtle)]">
                                <button
                                    onClick={() => setView('monthly_bar')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'monthly_bar' ? 'bg-[var(--bg-surface-1)] text-blue-700 shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    Month
                                </button>
                                <button
                                    onClick={() => setView('daily_bar')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'daily_bar' ? 'bg-[var(--bg-surface-1)] text-blue-700 shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    Day
                                </button>
                                <button
                                    onClick={() => setView('hourly_bar')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'hourly_bar' ? 'bg-[var(--bg-surface-1)] text-blue-700 shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    Hour
                                </button>
                                <div className="w-px bg-[var(--bg-surface-2)] mx-1 my-1"></div>
                                <button
                                    onClick={() => setShowPeer(!showPeer)}
                                    className={`p-1 px-2 rounded-md transition-all flex items-center gap-1 ${showPeer ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors'}`}
                                    title="Compare with Neighbors"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* More Options Menu - Now contains Calendar & Filters */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-1.5 rounded-md border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] transition-colors"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-surface-1)] border-[var(--border-subtle)] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {/* Quick Filters */}
                                        <div className="px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Quick Filters</div>
                                        <button
                                            onClick={() => { applyPreset('thisMonth'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] hover:text-blue-600"
                                        >
                                            This Month
                                        </button>
                                        <button
                                            onClick={() => { applyPreset('lastMonth'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] hover:text-blue-600"
                                        >
                                            Last Month
                                        </button>
                                        <button
                                            onClick={() => { applyPreset('ytd'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] hover:text-blue-600"
                                        >
                                            Year to Date
                                        </button>

                                        <div className="h-px bg-[var(--bg-surface-2)] my-1"></div>

                                        <button
                                            onClick={() => { setStartDate(null); setEndDate(null); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            Reset Filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards Row */}
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-3 bg-[var(--bg-surface-2)] border-[var(--border-subtle)] flex-1">
                            <div className="flex flex-col">
                                <span className="text-[var(--text-secondary)] text-[10px] uppercase font-semibold tracking-wider">Total Usage <span className="text-[var(--text-secondary)] font-normal">{getKpiLabel()}</span></span>
                                <span className="font-bold text-[var(--text-primary)] text-lg">{Math.round(totalKwh).toLocaleString()} kWh</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--bg-surface-2)] border-[var(--border-subtle)] flex-1">
                            <div className="flex flex-col">
                                <span className="text-[var(--text-secondary)] text-[10px] uppercase font-semibold tracking-wider">Total Cost <span className="text-[var(--text-secondary)] font-normal">{getKpiLabel()}</span></span>
                                <span className="font-bold text-emerald-600 text-lg">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={`relative w-full ${isScrollable ? 'overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[var(--border-subtle)]' : ''}`}>
                        <div style={{ width: isScrollable ? `${chartWidth}px` : '100%', height: '400px' }}>
                            {data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {view === 'daily_line' ? (
                                        <LineChart data={data} margin={{ top: 30, right: 20, bottom: 20, left: 0 }}>
                                            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} interval={0} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} label={{ value: 'kWh / °F', angle: -90, position: 'insideLeft', style: { fill: axisColor, fontSize: 10 } }} domain={['auto', 'auto']} padding={{ top: 20, bottom: 0 }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#f59e0b', fontSize: 12 }} tickFormatter={(val) => `$${val}`} label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 10 } }} domain={['auto', 'auto']} padding={{ top: 20, bottom: 0 }} />
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: tooltipText }} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="Energy Usage" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                            <Line yAxisId="right" type="monotone" dataKey="Usage Cost" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                            {showPeer && (
                                                <Line yAxisId="left" type="monotone" dataKey="Peer Avg" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
                                            )}
                                            <Line yAxisId="left" type="monotone" dataKey="Temperature" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    ) : (
                                        <ComposedChart
                                            data={data}
                                            margin={{ top: 30, right: 20, bottom: 20, left: 0 }}
                                            onClick={handleBarClick} // ENABLE CLICK
                                            className={view !== 'hourly_bar' ? "cursor-pointer" : ""} // Hourly not clickable further
                                        >
                                            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} interval={view === 'hourly_bar' ? 0 : 'preserveEnd'} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fill: axisColor, fontSize: 10 } }} domain={['auto', 'auto']} padding={{ top: 30, bottom: 0 }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#f59e0b', fontSize: 12 }} tickFormatter={(val) => `$${val}`} label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 10 } }} domain={['auto', 'auto']} padding={{ top: 30, bottom: 0 }} />
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: tooltipText }} />
                                            <Legend iconType="rect" iconSize={12} wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }} />
                                            <Bar yAxisId="left" dataKey="Energy Usage" name="Usage (kWh)" radius={[4, 4, 0, 0]} maxBarSize={60} fill="#3b82f6">
                                                {data.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={'#3b82f6'} className="hover:opacity-80 transition-opacity" />
                                                ))}
                                            </Bar>
                                            {showPeer && (
                                                <Line yAxisId="left" type="monotone" dataKey="Peer Avg" name="Peer Avg (kWh)" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                            )}
                                            <Line yAxisId="right" type="monotone" dataKey="Usage Cost" name="Cost ($)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                                        </ComposedChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <div className="p-3 bg-[var(--bg-surface-2)] rounded-full mb-3">
                                        <BarChart3 className="h-6 w-6 text-[var(--text-secondary)]" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-600 mb-1">No usage data found</h3>
                                    <p className="text-xs text-[var(--text-secondary)] max-w-[200px] mb-4">
                                        {startDate ? "There is no usage data recorded for this specific date range." : "Your account appears to have no usage history."}
                                    </p>
                                    {startDate && (
                                        <button
                                            onClick={() => { setStartDate(null); setEndDate(null); }}
                                            className="text-xs bg-[var(--bg-surface-1)] border-[var(--border-subtle)] text-blue-600 px-3 py-1.5 rounded-md hover:bg-[var(--bg-surface-2)] shadow-sm transition-colors"
                                        >
                                            Clear Filters (View All)
                                        </button>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>

                    <div className="mt-4">
                        <AIChartAnalysis
                            chartType={`Detailed Usage (${view})`}
                            dataContext={{
                                view_mode: view,
                                drill_level: drillDate ? 'drilled' : 'top',
                                data_sample: data.slice(-5)
                            }}
                        />
                    </div>
                </CardContent >
            </Card>
        </>
    );
}
