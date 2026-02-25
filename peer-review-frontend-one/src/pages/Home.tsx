import { useState, useEffect } from 'react';
import { EnergyPeerHeatmap } from "@/components/charts/EnergyPeerHeatmap"
import { Card, CardContent } from '@/components/ui/Card'
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { SimpleTooltip } from '@/components/ui/SimpleTooltip'
import { RecommendedPlansModal } from '@/components/modals/RecommendedPlansModal';
import { getMonthlyUsage } from '@/lib/api';
import { AlertCircle, Info } from 'lucide-react';

import { FlashRegular, MoneyRegular } from '@fluentui/react-icons';
import { useAI } from '@/context/AIContext';

interface HomeProps {
    summary: any;
    loading: boolean;
    customerId: string;
}

export default function Home({ summary, loading, customerId }: HomeProps) {
    const { lastResponse } = useAI();
    const [isRecModalOpen, setIsRecModalOpen] = useState(false);
    const [usageViewMode, setUsageViewMode] = useState<'month' | 'total'>('month');
    const [costViewMode, setCostViewMode] = useState<'month' | 'total'>('month');

    // Handle AI Actions (Scroll or Chart Update)
    useEffect(() => {
        if (lastResponse?.action) {
            const { type, parameters } = lastResponse.action;

            if (type === 'SCROLL_TO' && parameters?.target_id) {
                const element = document.getElementById(parameters.target_id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight effect
                    element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
                    setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2'), 2000);
                }
            }
        }
    }, [lastResponse]);
    const [totalKwh, setTotalKwh] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [monthCount, setMonthCount] = useState(0);

    // Fetch actual monthly data to calculate real totals
    useEffect(() => {
        if (customerId) {
            getMonthlyUsage(customerId).then(data => {
                if (data && Array.isArray(data)) {
                    const sumKwh = data.reduce((acc: number, item: any) => acc + (item.MONTHLY_KWH || 0), 0);
                    const sumCost = data.reduce((acc: number, item: any) => acc + (item.MONTHLY_COST || 0), 0);
                    setTotalKwh(Math.round(sumKwh));
                    setTotalCost(Math.round(sumCost));
                    setMonthCount(data.length);
                }
            });
        }
    }, [customerId]);

    if (loading || !summary) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-3">



            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Energy Usage */}
                <Card className="bg-[var(--bg-surface-1)] border-none">
                    <CardContent className="p-3 flex items-center gap-4">
                        <div className="h-6 w-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                            <FlashRegular fontSize={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    Energy Usage
                                </p>
                                <SimpleTooltip content="Total electricity consumed in the selected period">
                                    <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                </SimpleTooltip>
                                <div className="flex ml-auto bg-slate-100 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setUsageViewMode('month')}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${usageViewMode === 'month'
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setUsageViewMode('total')}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${usageViewMode === 'total'
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        Total
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {usageViewMode === 'month'
                                        ? (summary ? `${Math.round(summary.current_kwh).toLocaleString()}` : "0")
                                        : `${Math.round(totalKwh).toLocaleString()}`
                                    } <span className="text-sm font-normal text-[var(--text-secondary)]">kWh</span>
                                </p>
                                {usageViewMode === 'month' && summary?.billing_month && (
                                    <span className="text-xs text-slate-400">
                                        {new Date(summary.billing_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </span>
                                )}
                                {usageViewMode === 'total' && (
                                    <span className="text-xs text-slate-400">{monthCount} months</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost */}
                <Card className="bg-[var(--bg-surface-1)] border-none">
                    <CardContent className="p-3 flex items-center gap-4">
                        <div className="h-6 w-6 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                            <MoneyRegular fontSize={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    Cost
                                </p>
                                <SimpleTooltip content="Estimated cost based on usage for the selected period">
                                    <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                </SimpleTooltip>
                                <div className="flex ml-auto bg-slate-100 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setCostViewMode('month')}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${costViewMode === 'month'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setCostViewMode('total')}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${costViewMode === 'total'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        Total
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {costViewMode === 'month'
                                        ? (summary ? `$${Math.round(summary.current_cost)}` : "$0")
                                        : `$${Math.round(totalCost).toLocaleString()}`
                                    }
                                </p>
                                {costViewMode === 'month' && summary && (
                                    <span className={`text-xs font-bold ${summary.cost_change_pct < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {summary.cost_change_pct < 0 ? '▼' : '▲'} {Math.abs(summary.cost_change_pct)}%
                                    </span>
                                )}
                                {costViewMode === 'month' && summary?.billing_month && (
                                    <span className="text-xs text-slate-400">
                                        {new Date(summary.billing_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                    </span>
                                )}
                                {costViewMode === 'total' && (
                                    <span className="text-xs text-slate-400">{monthCount} months</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Efficiency Score */}
                <Card className="bg-[var(--bg-surface-1)] border-none">
                    <CardContent className="p-3 flex items-center gap-4">
                        <div className="h-6 w-6 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-[var(--text-secondary)]">Efficiency Score</p>
                                <SimpleTooltip content="0-100 score comparing your usage efficiency against similar homes">
                                    <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                </SimpleTooltip>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {summary ? summary.efficiency_score : "-"}
                                </p>
                                {summary && (
                                    <span className={`text-xs font-bold ${summary.score_change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {summary.score_change_pct >= 0 ? '▲' : '▼'} {Math.abs(summary.score_change_pct)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Forecast & Score */}
                <Card className="bg-[var(--bg-surface-1)] border-none">
                    <CardContent className="p-3 flex items-center gap-4">
                        <div className="h-6 w-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-[var(--text-secondary)]">Forecast & Score</p>
                                <SimpleTooltip content="Projected bill amount for the end of the month">
                                    <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                </SimpleTooltip>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {summary ? `$${Math.round(summary.projected_cost || 0)}` : "-"}
                                </p>
                                {summary && (
                                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                                        vs ${Math.round(summary.current_cost || 0)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Insights */}
                <Card className="bg-[var(--bg-surface-1)] border-none">
                    <CardContent className="p-3 flex items-center gap-4">
                        <div className="h-6 w-6 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-[var(--text-secondary)]">Insights</p>
                                <SimpleTooltip content="AI-generated alerts and recommendations based on usage patterns">
                                    <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                </SimpleTooltip>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-[var(--text-primary)] flex items-center">
                                    <span className="text-amber-400 mr-2">
                                        <AlertCircle className="h-5 w-5" />
                                    </span>
                                    {summary ? summary.insight_count : "0"}
                                    <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">New Alerts</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Analysis Section: Heatmap (Summary now internal) */}
            <div id="energy-peer-heatmap" className="scroll-mt-24 rounded-lg transition-all duration-300">
                <EnergyPeerHeatmap hideTrendLine />
            </div>

            {/* Modals */}
            <RecommendedPlansModal
                isOpen={isRecModalOpen}
                onClose={() => setIsRecModalOpen(false)}
            />
        </div>
    )
}
