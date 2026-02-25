import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";

const forecastData = [
    { name: 'W1', lastYear: 200, forecast: 240 },
    { name: 'W2', lastYear: 220, forecast: 230 },
    { name: 'W3', lastYear: 250, forecast: 280 },
    { name: 'W4', lastYear: 270, forecast: 290 },
];

export function ForecastChart() {
    return (
        <Card className="col-span-1 lg:col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-normal text-slate-500">Forecast & Score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                fontSize={12}
                                stroke="#94a3b8"
                                label={{ value: 'Timeline', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                            />
                            <YAxis
                                fontSize={12}
                                stroke="#94a3b8"
                                label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', offset: 0, fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip />
                            <Area type="monotone" dataKey="forecast" stroke="#10b981" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2} />
                            <Area type="monotone" dataKey="lastYear" stroke="#cbd5e1" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <div className="text-xl font-bold text-slate-900">+1.26<span className="text-sm font-normal text-slate-500"> MWh</span></div>
                        <div className="text-xs text-slate-500">Forecast Usage</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-slate-900">+$196</div>
                        <div className="text-xs text-slate-500">Forecast Cost</div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
                    <div className="relative h-12 w-12 flex items-center justify-center rounded-full border-4 border-blue-500/20">
                        <span className="text-sm font-bold text-blue-600">86</span>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-900">Energy Score</div>
                        <div className="text-xs text-slate-500">Top 20% of efficient homes</div>
                    </div>
                </div>


                <div className="mt-4">
                    <AIChartAnalysis
                        chartType="Forecast & Score"
                        dataContext={{
                            forecast_kwh: 240 + 230 + 280 + 290,
                            last_year_kwh: 200 + 220 + 250 + 270,
                            score: 86,
                            trend: "Increasing"
                        }}
                    />
                </div>
            </CardContent>
        </Card >
    )
}
