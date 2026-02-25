import { Card, CardContent } from "@/components/ui/Card";
import { totalKwh, totalPeerKwh, annualCost, dailyAvg, overallPct, greenDays, greenPct } from "@/lib/usageDummyData";

export function UsageKPIs() {
    const vsAvgPct = Math.round(((totalKwh - totalPeerKwh) / totalPeerKwh) * 100);

    const rankStatus = overallPct <= 40 ? 'good' : (overallPct <= 65 ? 'warn' : 'bad');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {/* Annual Usage */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Annual Usage</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {totalKwh.toLocaleString()} <span className="text-sm font-normal text-[var(--text-secondary)]">kWh</span>
                            </p>
                            <span className={`text-xs font-bold ${vsAvgPct < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {vsAvgPct < 0 ? '▼' : '▲'} {Math.abs(vsAvgPct)}% vs peer avg
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Full year 2024</p>
                    </div>
                </CardContent>
            </Card>

            {/* Est. Annual Cost */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Est. Annual Cost</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                ${annualCost.toLocaleString()}
                            </p>
                            <span className="text-xs font-bold text-blue-500">
                                Ofgem price cap
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">@ 24.5¢ per kWh</p>
                    </div>
                </CardContent>
            </Card>

            {/* Avg Daily Usage */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Avg Daily Usage</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {dailyAvg} <span className="text-sm font-normal text-[var(--text-secondary)]">kWh</span>
                            </p>
                            <span className={`text-xs font-bold ${rankStatus === 'good' ? 'text-emerald-500' : (rankStatus === 'warn' ? 'text-amber-500' : 'text-rose-500')}`}>
                                Top {overallPct}th pct
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Per day average</p>
                    </div>
                </CardContent>
            </Card>

            {/* Green Days */}
            <Card className="bg-[var(--bg-surface-1)] border-none">
                <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-6 w-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Green Days</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {greenDays} <span className="text-sm font-normal text-[var(--text-secondary)]">days</span>
                            </p>
                            <span className="text-xs font-bold text-emerald-500">
                                {greenPct}% of year
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Below peer average</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
