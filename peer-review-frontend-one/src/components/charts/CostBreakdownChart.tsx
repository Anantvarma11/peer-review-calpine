import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Zap, ChevronRight, BarChart3 } from "lucide-react";
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";

interface CostBreakdownChartProps {
    totalCost?: number;
    peakCost?: number;
    offPeakCost?: number;
}

export function CostBreakdownChart({ totalCost = 164, peakCost, offPeakCost }: CostBreakdownChartProps) {
    // Determine values: use props if available, otherwise derived or fallback
    const safeTotal = totalCost || 164;
    const displayPeak = peakCost !== undefined ? peakCost : Math.round(safeTotal * 0.56);
    const displayOffPeak = offPeakCost !== undefined ? offPeakCost : Math.round(safeTotal * 0.44);

    // Dynamic Pie Data
    const pieData = [
        { name: 'Peak', value: Math.round(displayPeak), color: '#facc15' },   // Yellow
        { name: 'Standard', value: Math.round(displayOffPeak), color: '#60a5fa' }, // Blue
    ];

    // Dynamic Calculations
    const peakRatio = safeTotal > 0 ? (displayPeak / safeTotal) : 0;
    const offPeakRatio = safeTotal > 0 ? (displayOffPeak / safeTotal) : 0;

    // Assume we can save ~20% of Peak costs and ~5% of Off-Peak via efficiency
    const potentialSavingsVal = (displayPeak * 0.20) + (displayOffPeak * 0.05);
    const potentialSavingsPct = safeTotal > 0 ? Math.round((potentialSavingsVal / safeTotal) * 100) : 0;

    // Restore variables for Right Column
    const standardSavings = Math.round(safeTotal * 0.15);
    const efficiencySavings = Math.round(potentialSavingsVal);

    return (
        <Card className="col-span-1 bg-[var(--bg-surface-1)] border-[var(--border-subtle)]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-[var(--border-subtle)]">
                <CardTitle className="text-base font-bold text-[var(--text-primary)]">Cost Breakdown</CardTitle>
                <BarChart3 className="h-4 w-4 text-[var(--text-secondary)]" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">Monthly Cost <span className="text-2xl font-bold text-[var(--text-primary)] ml-1">${Math.round(safeTotal)}</span></p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="bg-amber-100 text-amber-500 rounded p-0.5">
                                <ChevronRight className="h-3 w-3" />
                            </div>
                            <span className="font-bold text-[var(--text-secondary)]">Peak Cost</span>
                            <span className="text-[var(--text-secondary)] font-medium">${Math.round(displayPeak)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="bg-emerald-100 text-emerald-500 rounded p-0.5">
                                <ChevronRight className="h-3 w-3" />
                            </div>
                            <span className="font-bold text-[var(--text-secondary)]">Off-Peak Cost</span>
                            <span className="text-[var(--text-secondary)] font-medium">${Math.round(displayOffPeak)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-[var(--text-primary)]">Peak Ratio: <span className="text-[var(--text-primary)]">{Math.round(peakRatio * 100)}%</span></span>
                        </div>
                        <div className="w-full h-3 bg-[var(--bg-surface-2)] rounded-full overflow-hidden flex">
                            <div className="h-full bg-amber-400" style={{ width: `${peakRatio * 100}%` }}></div>
                            <div className="h-full bg-blue-400" style={{ width: `${offPeakRatio * 100}%` }}></div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-xs font-bold text-[var(--text-secondary)]">Target: ${Math.round(safeTotal * 0.85)}</span>
                        </div>
                    </div>

                    <div className="bg-indigo-50/10 rounded-xl p-3 flex items-center gap-3 border border-indigo-100/20">
                        <div className="h-8 w-8 rounded-full bg-teal-400 flex items-center justify-center shadow-sm">
                            <Zap className="h-5 w-5 text-white fill-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-[var(--text-primary)]">{potentialSavingsPct}% <span className="text-xs font-normal text-[var(--text-secondary)] uppercase ml-1">Potential Savings</span></p>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col items-center justify-between">
                    <div className="h-[160px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={70}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Overlay Labels (Dynamically Calculated) */}
                        <div className="absolute top-[35%] left-[28%] text-white font-bold text-sm drop-shadow-md">
                            {Math.round((displayPeak / safeTotal) * 100)}%
                        </div>
                        <div className="absolute top-[38%] right-[28%] text-white font-bold text-sm drop-shadow-md">
                            {Math.round((displayOffPeak / safeTotal) * 100)}%
                        </div>
                    </div>

                    <div className="w-full space-y-2 pl-4 mb-2">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                            <span className="text-slate-600 font-medium">Standard Savings <span className="text-slate-400">${standardSavings}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                            <span className="text-slate-600 font-medium">Efficiency Savings <span className="text-slate-400">${efficiencySavings}</span></span>
                        </div>
                    </div>

                    {/* AI Analysis replacing static bar chart */}
                    <AIChartAnalysis
                        chartType="Cost Breakdown"
                        dataContext={{
                            total_cost: safeTotal,
                            peak_cost: displayPeak,
                            peak_ratio: peakRatio,
                            potential_savings: potentialSavingsVal
                        }}
                        className="w-full mt-0" // Tight fit
                    />
                </div>
            </CardContent>
        </Card>
    )
}
