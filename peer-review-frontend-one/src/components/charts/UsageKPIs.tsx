import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";

export function UsageKPIs({ customerId }: { customerId?: string }) {
    const [kpis] = useState({
        totalUsage: 850,
        projectedUsage: 870,
        estimatedCost: 128,
        billToDate: 126,
        usageChange: -8.5,
        loading: false
    });

    useEffect(() => {
        if (!customerId) return;
        // Keep requested values as primary, but we could fetch if needed
        // For now, adhering to "KPIS Ti be updated" with specific numbers
    }, [customerId]);

    if (kpis.loading) {
        return <div className="animate-pulse h-24 bg-slate-100 rounded-lg mb-3"></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
            {/* Total Usage this Month */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">Total Usage this Month</p>
                        </div>
                        <div className="flex items-baseline gap-1 flex-wrap">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {kpis.totalUsage.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-slate-400">
                                / 1,000 <span className="text-[10px] font-normal uppercase">kWh</span>
                            </p>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.min((kpis.totalUsage / 1000) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">Usage so far this month</p>
                    </div>
                </CardContent>
            </Card>

            {/* Projected Usage */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M2 12a10 10 0 0 1 10 10" /><path d="M12 22a10 10 0 0 1-10-10" /><path d="M16 8l-4 4-2-2" /></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Projected Usage</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {kpis.projectedUsage.toLocaleString()} <span className="text-sm font-normal text-[var(--text-secondary)]">kWh</span>
                            </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Estimated month total</p>
                    </div>
                </CardContent>
            </Card>

            {/* Estimated cost this month */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Estimated cost this month</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                ${kpis.estimatedCost.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Projected full month bill</p>
                    </div>
                </CardContent>
            </Card>

            {/* Bill to date */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Bill to date</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                ${kpis.billToDate.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Cost incurred so far</p>
                    </div>
                </CardContent>
            </Card>

            {/* Billing */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Billing History</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase font-medium">Last Billed</span>
                                <span className="text-xs font-semibold text-[var(--text-primary)]">Feb 1, 2026</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-1">
                                <span className="text-[10px] text-slate-400 uppercase font-medium">Next Billing</span>
                                <span className="text-xs font-semibold text-[var(--text-primary)] underline decoration-amber-500/30">Mar 1, 2026</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
