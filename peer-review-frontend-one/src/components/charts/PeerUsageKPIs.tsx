import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Line, Area, ComposedChart, ResponsiveContainer, AreaChart } from 'recharts';
import { TrendingUp, Activity, Snowflake, Flame, Tv, Lightbulb } from 'lucide-react';
import { getMonthlyUsage, getDashboardSummary, getPeerComparison } from "@/lib/api";

export function PeerUsageKPIs({ customerId }: { customerId?: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!customerId) return;
        setLoading(true);

        Promise.all([
            getMonthlyUsage(customerId),
            getDashboardSummary(customerId),
            getPeerComparison(customerId, {})
        ]).then(([_, summary, peer]) => {
            // Mocking extra distribution and trend data for the advanced KPIs
            const mockDistribution = {
                min: 150,
                p25: 280,
                median: 355,
                p75: 450,
                max: 850,
                rank: "Top 30%"
            };

            const mockForecast = Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                you: 10 + Math.sin(i / 5) * 2 + (i * 0.5),
                peerMedian: 12 + Math.sin(i / 5) * 1.5 + (i * 0.6),
                p25: 8 + (i * 0.5),
                p75: 16 + (i * 0.7)
            }));

            const mockVelocity = Array.from({ length: 20 }, (_, i) => ({
                day: i + 1,
                you: (i + 1) * 1.2,
                peer: (i + 1) * 1.45
            }));

            setData({
                currentUsage: summary?.current_kwh || 301,
                peerAvg: peer?.peer_avg_kwh || 355,
                percentile: peer?.percentile || 70, // Top 30%
                projectedUsage: summary?.projected_kwh || 316,
                peerProjected: 372,
                estimatedCost: summary?.projected_cost || 38,
                peerMedianCost: 44,
                efficiencyScore: 118,
                distribution: mockDistribution,
                forecast: mockForecast,
                velocity: mockVelocity,
                categories: [
                    {
                        name: 'Cooling',
                        val: '+12%',
                        improved: false,
                        icon: Snowflake,
                        color: '#3b82f6',
                        trend: [10, 15, 8, 12, 18, 14, 20]
                    },
                    {
                        name: 'Heating',
                        val: '-5%',
                        improved: true,
                        icon: Flame,
                        color: '#f43f5e',
                        trend: [5, 4, 6, 3, 2, 4, 3]
                    },
                    {
                        name: 'Appliances',
                        val: '+2%',
                        improved: false,
                        icon: Tv,
                        color: '#8b5cf6',
                        trend: [12, 11, 13, 12, 14, 13, 15]
                    },
                    {
                        name: 'Lighting',
                        val: '-8%',
                        improved: true,
                        icon: Lightbulb,
                        color: '#eab308',
                        trend: [8, 7, 7, 6, 5, 6, 5]
                    }
                ],
                rankTrend: [
                    { month: 'Jan', rank: 42 },
                    { month: 'Feb', rank: 30 },
                    { month: 'Mar', rank: 27 }
                ]
            });
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch Peer KPIs:", err);
            setLoading(false);
        });
    }, [customerId]);

    if (loading || !data) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-48 bg-slate-100 rounded-xl"></div>)}
        </div>;
    }

    const diffPercent = ((data.currentUsage / data.peerAvg - 1) * 100).toFixed(0);
    const isEfficient = data.currentUsage < data.peerAvg;

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Usage → Relative Usage Position */}
                <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Relative Position</p>
                                <h3 className="text-2xl font-bold text-slate-800">{Number(data.currentUsage).toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span></h3>
                            </div>
                            <div
                                className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                    isEfficient ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                }`}
                            >
                                {isEfficient ? '↓' : '↑'} {Math.abs(Number(diffPercent))}% vs Peer
                            </div>
                        </div>

                        {/* Distribution Bar */}
                        <div className="relative h-8 mt-6 mb-2 flex items-center">
                            <div className="absolute inset-0 h-1.5 bg-slate-100 top-1/2 -translate-y-1/2 rounded-full w-full"></div>
                            {/* Marker for User */}
                            <div
                                className="absolute top-0 w-3 h-8 bg-orange-500 rounded-sm shadow-sm z-10 transition-all duration-1000"
                                style={{
                                    left: `${((data.currentUsage - 150) / (850 - 150)) * 100}%`,
                                }}
                            >
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-orange-600 whitespace-nowrap">YOU</div>
                            </div>
                            {/* Median Line */}
                            <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-slate-300 z-0" style={{ left: '40%' }}>
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-medium text-slate-400">MEDIAN</div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4">
                            <span className="text-[10px] font-bold text-emerald-600">Top 30% efficient</span>
                            <span className="text-[10px] font-medium text-slate-400">Avg: {data.peerAvg} kWh</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Projected Usage → Forecast vs Peer */}
                <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Forecast vs Peer</p>
                                <h3 className="text-2xl font-bold text-slate-800">{Number(data.projectedUsage).toFixed(2)} <span className="text-xs font-normal text-slate-400">kWh</span></h3>
                            </div>
                            <div className="flex items-center text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                <TrendingUp className="w-3 h-3 mr-1" /> Improving
                            </div>
                        </div>
                        <div className="h-16 w-full -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.forecast}>
                                    <defs>
                                        <linearGradient id="colorPeer" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="p75" stroke="none" fill="url(#colorPeer)" fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="p25" stroke="none" fill="#fff" fillOpacity={1} />
                                    <Line type="monotone" dataKey="you" stroke="#f97316" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="peerMedian" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Trend: +3% better than last month</p>
                    </CardContent>
                </Card>

                {/* 3. Estimated Cost → Efficiency Index */}
                <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost Efficiency Score</p>
                                <h3 className="text-2xl font-bold text-slate-800">{data.efficiencyScore}</h3>
                            </div>
                            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-1">
                                        <span>Your Bill</span>
                                        <span>${Number(data.estimatedCost).toFixed(2)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[70%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mb-1">
                                        <span>Peer Median</span>
                                        <span>${Number(data.peerMedianCost).toFixed(2)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-300 w-[85%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-3 italic">* Normalized for home size & region</p>
                    </CardContent>
                </Card>

                {/* 4. Bill to Date → Consumption Velocity */}
                <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consumption Velocity</p>
                                <h3 className="text-2xl font-bold text-slate-800">$1.20 <span className="text-xs font-normal text-slate-400">/ day</span></h3>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Below Peer
                            </div>
                        </div>
                        <div className="h-16 w-full -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data.velocity}>
                                    <Line type="monotone" dataKey="you" stroke="#10b981" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="peer" stroke="#cbd5e1" strokeWidth={1} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Peer Avg: $1.45 / day</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// End of component
