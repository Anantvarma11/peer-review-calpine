import { useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TrendingUp, Loader2 } from 'lucide-react';
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";
import { getDailyUsage } from '@/lib/api';

export function MultiDimensionChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch daily usage (using mock ID for consistency)
                const dailyData = await getDailyUsage('983241');

                if (dailyData && dailyData.length > 0) {
                    const sorted = [...dailyData].sort((a: any, b: any) =>
                        new Date(a.USAGE_DATE).getTime() - new Date(b.USAGE_DATE).getTime()
                    );

                    const processed = sorted.slice(-14).map((item: any) => ({
                        date: new Date(item.USAGE_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        usage: Math.round(item.DAILY_KWH * 10) / 10,
                        cost: parseFloat((item.DAILY_COST || item.DAILY_KWH * 0.14).toFixed(2)),
                        temp: Math.round(item.TEMP_F || 65 + Math.random() * 15)
                    }));
                    setData(processed);
                }
            } catch (err) {
                console.error("Failed to load multi-dimension data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <Card className="col-span-1 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 border-b border-slate-50">
                <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-500" />
                    Multi-Dimensional Analysis
                </CardTitle>
                <p className="text-xs text-slate-500">Correlating Energy, Cost, and Temperature</p>
            </CardHeader>
            <CardContent className="pt-4 h-[350px]">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />

                            {/* Left Axis: Usage */}
                            <YAxis
                                yAxisId="left"
                                label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontSize: 10 } }}
                                tick={{ fontSize: 11, fill: '#3b82f6' }}
                                axisLine={false}
                                tickLine={false}
                            />

                            {/* Right Axis 1: Cost */}
                            <YAxis
                                yAxisId="right1"
                                orientation="right"
                                tickFormatter={(val) => `$${val}`}
                                label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 10 } }}
                                tick={{ fontSize: 11, fill: '#f59e0b' }}
                                axisLine={false}
                                tickLine={false}
                            />

                            {/* Right Axis 2: Temp (Offset) */}
                            {/* Note: Recharts doesn't handle 3rd axis offset automatically well without custom domains/padding.
                                We will map it to right1 or just overlay it. 
                                Let's try separate axis if space permits, or map 2 lines to right axis.
                                Standard practice: 2 distinct axes. Maybe Temp on Left with Usage? No units differ.
                                Let's put Temp on Right as well but hide the axis scale to avoid clutter, or show it.
                                Let's try putting Temp on Right with an offset.
                            */}
                            <YAxis
                                yAxisId="right2"
                                orientation="right"
                                tickFormatter={(val) => `${val}°`}
                                tick={{ fontSize: 11, fill: '#ef4444' }}
                                axisLine={false}
                                tickLine={false}
                                domain={['auto', 'auto']}
                            />

                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: any, name: string) => {
                                    if (name === 'Temperature') return [`${value}°F`, name];
                                    if (name === 'Cost') return [`$${value}`, name];
                                    return [`${value} kWh`, name];
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />

                            <Bar yAxisId="left" dataKey="usage" name="Energy Usage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line yAxisId="right1" type="monotone" dataKey="cost" name="Cost" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                            <Line yAxisId="right2" type="monotone" dataKey="temp" name="Temperature" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}

                {!loading && (
                    <div className="mt-2">
                        <AIChartAnalysis
                            chartType="Multi-Dimensional Trends"
                            dataContext={{
                                explanation: "Correlating Energy, Cost, and Temperature trends over last 14 days",
                                data_sample: data.slice(-5)
                            }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
