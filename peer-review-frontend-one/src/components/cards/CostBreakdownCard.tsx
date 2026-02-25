import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Settings, Sparkles, Lightbulb, LightbulbOff, X, Thermometer, Zap, ChevronRight, TrendingUp, TrendingDown, Calendar, ChevronDown, Filter, MapPin, Ruler } from 'lucide-react';
import { getMonthlyUsage, getBillAnalysis, getPeerFilters, PeerFilters } from '@/lib/api';

interface MonthlyData {
    BILLING_MONTH: string;
    MONTHLY_KWH: number;
    MONTHLY_COST: number;
}

interface CostBreakdownCardProps {
    totalCost?: number;
    pctChange?: number;
    peerCost?: number;
    peerCount?: number;
    filterLabel?: string;
    customerId?: string;
    showPeerComparison?: boolean;
    onFiltersChange?: (filters: PeerFilters) => void;
    initialFilters?: PeerFilters;
}

export function CostBreakdownCard({
    totalCost = 98,
    // pctChange removed
    peerCost = 0,
    peerCount = 115,
    filterLabel = '',
    customerId,
    showPeerComparison = false,
    onFiltersChange,
    initialFilters = {}
}: CostBreakdownCardProps) {
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [compareMonth, setCompareMonth] = useState<string>('');
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    // Peer filter states
    const [showPeerFilters, setShowPeerFilters] = useState(false);
    const [filterOptions, setFilterOptions] = useState<any>(null);
    const [localFilters, setLocalFilters] = useState<PeerFilters>(initialFilters);

    // Sync local filters with parent, but only if parent has meaningful defaults or changes
    useEffect(() => {
        if (Object.keys(initialFilters).length > 0) {
            setLocalFilters(initialFilters);
        }
    }, [initialFilters]);

    // Fetch filter options for peer comparison
    useEffect(() => {
        if (showPeerComparison) {
            getPeerFilters().then(setFilterOptions);
        }
    }, [showPeerComparison]);

    // Notify parent when filters change
    const handleFilterChange = (key: keyof PeerFilters, value: string | undefined) => {
        const newFilters = { ...localFilters, [key]: value || undefined };
        setLocalFilters(newFilters);
        onFiltersChange?.(newFilters);
    };

    // Fallback: If peerCost is 0/undefined, mock it for demo based on totalCost
    const displayPeerCost = peerCost > 0 ? peerCost : (totalCost > 0 ? totalCost * 0.85 : 120);
    const savings = displayPeerCost > totalCost ? displayPeerCost - totalCost : 0;
    const moreExpensive = totalCost > displayPeerCost ? totalCost - displayPeerCost : 0;
    const hasActiveLocalFilters = Object.values(localFilters).some(v => v);

    // Fetch monthly data for bill comparison
    useEffect(() => {
        if (customerId && !showPeerComparison) {
            getMonthlyUsage(customerId).then(data => {
                const sorted = [...(data || [])].sort((a: any, b: any) =>
                    new Date(b.BILLING_MONTH).getTime() - new Date(a.BILLING_MONTH).getTime()
                );
                setMonthlyData(sorted);
                if (sorted.length > 0) {
                    setSelectedMonth(sorted[0].BILLING_MONTH);
                    if (sorted.length > 1) {
                        setCompareMonth(sorted[1].BILLING_MONTH);
                    }
                }
            });
        }
    }, [customerId, showPeerComparison]);

    // Fetch AI analysis when months change
    useEffect(() => {
        if (selectedMonth && compareMonth && customerId && !showPeerComparison) {
            setLoadingAnalysis(true);
            getBillAnalysis(customerId, selectedMonth, compareMonth)
                .then(res => setAiAnalysis(res?.analysis || 'Analyzing your usage patterns...'))
                .catch(() => setAiAnalysis('Usage is higher this month due to seasonal changes. Consider adjusting thermostat settings.'))
                .finally(() => setLoadingAnalysis(false));
        }
    }, [selectedMonth, compareMonth, customerId, showPeerComparison]);

    // Get data for selected months
    const currentMonthData = monthlyData.find(m => m.BILLING_MONTH === selectedMonth);
    const previousMonthData = monthlyData.find(m => m.BILLING_MONTH === compareMonth);

    const currentCost = currentMonthData?.MONTHLY_COST || totalCost;
    const previousCost = previousMonthData?.MONTHLY_COST || (totalCost * 0.9);
    const costDiff = currentCost - previousCost;
    const costPctChange = previousCost > 0 ? ((costDiff / previousCost) * 100) : 0;

    const currentKwh = currentMonthData?.MONTHLY_KWH || 0;
    const previousKwh = previousMonthData?.MONTHLY_KWH || 0;

    // Mini sparkline data (last 6 months)
    const sparklineData = monthlyData.slice(0, 6).reverse();
    const maxCost = Math.max(...sparklineData.map(d => d.MONTHLY_COST || 0), 1);

    const formatMonth = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    return (
        <Card className="col-span-1 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col relative group">
                    <CardTitle className="text-xl font-bold text-slate-800 leading-tight cursor-help">
                        Cost <br /> Breakdown
                    </CardTitle>
                    <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-semibold mb-1">Cost Breakdown</p>
                        <p>Compare your energy bills month-over-month. Select different months to analyze usage patterns, view spending trends, and get AI-powered insights to help reduce costs.</p>
                        <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-800"></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <button
                            className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                            onClick={() => window.open('/billing', '_blank')}
                        >
                            Bill
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-52 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <p className="font-semibold mb-1">View Current Bill</p>
                            <p>Click to view your full billing statement with detailed line-item charges.</p>
                            <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div>
                        </div>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-50 transition-colors">
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Metric */}
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-slate-900">${Math.round(currentCost)}</span>

                        {/* Comparison Indicator Bulb */}
                        {savings > 0 ? (
                            <div
                                className="ml-1 relative group cursor-pointer transition-transform hover:scale-110"
                                onClick={() => setShowRecommendations(true)}
                            >
                                <Lightbulb className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-pulse" />
                                <span className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                                    Great! Click for tips.
                                </span>
                            </div>
                        ) : (
                            <div
                                className="ml-1 relative group cursor-pointer transition-transform hover:scale-110"
                                onClick={() => setShowRecommendations(true)}
                            >
                                <LightbulbOff className="h-8 w-8 text-slate-400 hover:text-slate-600 transition-colors" />
                                <span className="absolute bottom-full mb-2 hidden group-hover:block w-max px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                                    Higher than average. Click to fix.
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-1 ml-2">
                            <span className={`text-lg font-bold ${costPctChange > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {costPctChange > 0 ? '+' : ''}{costPctChange.toFixed(1)}%
                            </span>
                            <Sparkles className={`h-4 w-4 ${costPctChange > 0 ? 'text-rose-400 fill-rose-400' : 'text-emerald-400 fill-emerald-400'}`} />
                        </div>
                    </div>

                    {/* Home View: Bill-to-Bill Comparison */}
                    {!showPeerComparison && (
                        <>
                            {/* Month Selector */}
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={() => setShowMonthSelector(!showMonthSelector)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                                >
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatMonth(selectedMonth)} vs {formatMonth(compareMonth)}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </div>

                            {/* Month Selector Dropdown */}
                            {showMonthSelector && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Current Month</label>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500"
                                            >
                                                {monthlyData.map(m => (
                                                    <option key={m.BILLING_MONTH} value={m.BILLING_MONTH}>
                                                        {formatMonth(m.BILLING_MONTH)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Compare To</label>
                                            <select
                                                value={compareMonth}
                                                onChange={(e) => setCompareMonth(e.target.value)}
                                                className="w-full mt-1 px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500"
                                            >
                                                {monthlyData.filter(m => m.BILLING_MONTH !== selectedMonth).map(m => (
                                                    <option key={m.BILLING_MONTH} value={m.BILLING_MONTH}>
                                                        {formatMonth(m.BILLING_MONTH)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mini Trend Sparkline */}
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500">6-Month Trend</span>
                                    {costPctChange > 0 ? (
                                        <span className="flex items-center text-xs text-rose-500">
                                            <TrendingUp className="h-3 w-3 mr-1" /> Increasing
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs text-emerald-500">
                                            <TrendingDown className="h-3 w-3 mr-1" /> Decreasing
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end gap-1 h-12">
                                    {sparklineData.map((d, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 flex flex-col items-center"
                                            title={`${formatMonth(d.BILLING_MONTH)}: $${Math.round(d.MONTHLY_COST)}`}
                                        >
                                            <div
                                                className={`w-full rounded-t transition-all ${d.BILLING_MONTH === selectedMonth ? 'bg-blue-500' : 'bg-slate-200 hover:bg-slate-300'}`}
                                                style={{ height: `${(d.MONTHLY_COST / maxCost) * 100}%`, minHeight: '4px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-1">
                                    {sparklineData.length > 0 && (
                                        <>
                                            <span className="text-[10px] text-slate-400">{formatMonth(sparklineData[0]?.BILLING_MONTH)}</span>
                                            <span className="text-[10px] text-slate-400">{formatMonth(sparklineData[sparklineData.length - 1]?.BILLING_MONTH)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Bill Comparison */}
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-end justify-between px-2 mb-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-xs font-semibold text-slate-400">{formatMonth(selectedMonth)}</span>
                                        <span className="text-xl font-bold text-slate-800">${Math.round(currentCost)}</span>
                                        <span className="text-[10px] text-slate-400">{Math.round(currentKwh)} kWh</span>
                                    </div>

                                    <div className="flex items-end gap-3 h-12 pb-1">
                                        <div
                                            className={`w-3 rounded-t-sm ${currentCost > previousCost ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            style={{ height: `${Math.min((currentCost / Math.max(currentCost, previousCost)) * 100, 100)}%` }}
                                        />
                                        <div
                                            className="w-3 rounded-t-sm bg-slate-300"
                                            style={{ height: `${Math.min((previousCost / Math.max(currentCost, previousCost)) * 100, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-xs font-semibold text-slate-400">{formatMonth(compareMonth)}</span>
                                        <span className="text-xl font-bold text-slate-800">${Math.round(previousCost)}</span>
                                        <span className="text-[10px] text-slate-400">{Math.round(previousKwh)} kWh</span>
                                    </div>
                                </div>

                                <div className="flex justify-center items-center gap-1.5 text-xs bg-slate-50 py-1.5 rounded-lg">
                                    {costDiff < 0 ? (
                                        <>
                                            <Sparkles className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                            <span className="font-bold text-emerald-600">You saved ${Math.abs(Math.round(costDiff))} this month!</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-bold text-orange-500">${Math.round(costDiff)} higher than {formatMonth(compareMonth)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Peer Analysis View: Peer Comparison */}
                    {showPeerComparison && displayPeerCost > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-slate-400">You vs. Peer Average</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                        {peerCount} peers{filterLabel && ` • ${filterLabel}`}
                                    </span>
                                    <button
                                        onClick={() => setShowPeerFilters(!showPeerFilters)}
                                        className={`p-1 rounded-full transition-colors ${hasActiveLocalFilters || showPeerFilters ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Inline Filter Panel */}
                            {showPeerFilters && filterOptions && (
                                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-1">
                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Plot Age Filter */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mb-1">
                                                <Calendar className="h-3 w-3" /> Plot Age
                                            </label>
                                            <select
                                                value={localFilters.year_built_range || ''}
                                                onChange={(e) => handleFilterChange('year_built_range', e.target.value)}
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {!localFilters.year_built_range && <option value="">All Ages</option>}
                                                {filterOptions.year_built_ranges?.map((opt: any) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Zipcode Filter */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mb-1">
                                                    <MapPin className="h-3 w-3" /> Zipcode
                                                </label>
                                                <select
                                                    value={localFilters.zipcode || ''}
                                                    onChange={(e) => handleFilterChange('zipcode', e.target.value)}
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {!localFilters.zipcode && <option value="">All</option>}
                                                    {filterOptions.zipcodes?.map((opt: any) => (
                                                        <option key={opt.value} value={opt.value}>{opt.value}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Plot Size Filter */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mb-1">
                                                    <Ruler className="h-3 w-3" /> Size
                                                </label>
                                                <select
                                                    value={localFilters.plot_size || ''}
                                                    onChange={(e) => handleFilterChange('plot_size', e.target.value)}
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {!localFilters.plot_size && <option value="">All</option>}
                                                    {filterOptions.plot_sizes?.map((opt: any) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label.split(' ')[0]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-end justify-between px-2 mb-2">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-semibold text-slate-400">You</span>
                                    <span className="text-xl font-bold text-slate-800">${Math.round(totalCost)}</span>
                                </div>

                                <div className="flex items-end gap-3 h-12 pb-1">
                                    <div
                                        className={`w-3 rounded-t-sm ${totalCost < displayPeerCost ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                        style={{ height: `${Math.min((totalCost / Math.max(totalCost, displayPeerCost)) * 100, 100)}%` }}
                                    />
                                    <div
                                        className="w-3 rounded-t-sm bg-slate-300"
                                        style={{ height: `${Math.min((displayPeerCost / Math.max(totalCost, displayPeerCost)) * 100, 100)}%` }}
                                    />
                                </div>

                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-semibold text-slate-400">Peer Avg</span>
                                    <span className="text-xl font-bold text-slate-800">${Math.round(displayPeerCost)}</span>
                                </div>
                            </div>

                            <div className="flex justify-center items-center gap-1.5 text-xs bg-slate-50 py-1.5 rounded-lg">
                                {savings > 0 ? (
                                    <>
                                        <Sparkles className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                        <span className="font-bold text-emerald-600">You save ${Math.round(savings)} vs peers!</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold text-orange-500">${Math.round(moreExpensive)} higher than peers</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Analysis Section */}
                <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Analysis</h4>

                    {/* AI-Generated Insight */}
                    <div className={`p-3 rounded-lg border ${costPctChange > 0 ? 'bg-orange-50/50 border-orange-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                        <div className="flex gap-2 items-start">
                            <div className={`mt-0.5 rounded-full p-1 ${costPctChange > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                <Sparkles className="h-3 w-3" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-700 font-medium">
                                    {costPctChange > 0 ? 'Cost Trending Up' : 'Cost Trending Down'}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                                    {loadingAnalysis ? (
                                        <span className="animate-pulse">Analyzing your usage patterns...</span>
                                    ) : aiAnalysis ? (
                                        aiAnalysis
                                    ) : (
                                        <>
                                            Your bill is <strong>{Math.abs(costPctChange).toFixed(1)}% {costPctChange > 0 ? 'higher' : 'lower'}</strong> than {formatMonth(compareMonth)}.
                                            {costPctChange > 0 ? ' Check for increased AC/Heating usage.' : ' Great job maintaining efficiency!'}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Peer Insight - Only show on Peer Analysis page */}
                    {showPeerComparison && (
                        <div className={`p-3 rounded-lg border ${savings > 0 ? 'bg-blue-50/50 border-blue-100' : 'bg-amber-50/50 border-amber-100'}`}>
                            <div className="flex gap-2 items-start">
                                <div className={`mt-0.5 rounded-full p-1 ${savings > 0 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <Sparkles className="h-3 w-3" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-700 font-medium">
                                        {savings > 0 ? 'Efficient Consumer' : 'Efficiency Opportunity'}
                                    </p>
                                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                                        {savings > 0
                                            ? `You spent $${Math.round(savings)} less than similar homes.`
                                            : `You spent $${Math.round(moreExpensive)} more than similar homes.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Recommendations Popup Modal */}
            {showRecommendations && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowRecommendations(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 fill-white" />
                                Smart Recommendations
                            </h3>
                            <button className="p-1 hover:bg-white/20 rounded-full" onClick={() => setShowRecommendations(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
                            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <Thermometer className="h-5 w-5 text-orange-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm text-slate-800">Adjust Thermostat</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Consider setting AC to 78°F during summer. Potential savings: <strong>$15-25/mo</strong></p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm text-slate-800">Switch Off-Peak</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Run major appliances after 9 PM for lower rates. Potential savings: <strong>$10-20/mo</strong></p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <ChevronRight className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm text-slate-800">Smart Power Strips</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Eliminate phantom loads with smart outlets. Potential savings: <strong>$5-10/mo</strong></p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50">
                            <button
                                className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700"
                                onClick={() => { window.location.href = '/recommendation'; }}
                            >
                                Find My Best Plan →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
