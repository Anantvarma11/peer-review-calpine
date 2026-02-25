import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";

export function EnergyScoreChart() {
    // This is often combined with Forecast, but let's make a standalone meter variant if needed.
    // For the specific UI requested, it fits inside the "Forecast" card (bottom section).
    // I already included it in ForecastChart.tsx for the layout match.
    // But I will create a dedicated small one just in case we need it separately.
    return (
        <Card className="col-span-full md:col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 uppercase font-bold tracking-wider">Energy Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative h-32 w-32">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                        <path
                            className="text-slate-100"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className="text-emerald-500"
                            strokeDasharray="86, 100"
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="text-3xl font-bold text-slate-900">86</span>
                        <span className="block text-xs text-emerald-600">Excellent</span>

                    </div>
                </div>

                <div className="mt-4">
                    <AIChartAnalysis
                        chartType="Energy Score"
                        dataContext={{
                            score: 86,
                            rating: "Excellent",
                            benchmark: "Top 20%"
                        }}
                        autoAnalyze={false}
                    />
                </div>
            </CardContent>
        </Card >
    )
}
