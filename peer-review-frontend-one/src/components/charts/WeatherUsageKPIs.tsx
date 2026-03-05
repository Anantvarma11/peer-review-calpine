import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
    TrendingUp,
    Activity,
    Zap,
    CloudSun,
    Target,
    Info,
    ArrowUpRight,
    ThermometerSun
} from 'lucide-react';
import { SimpleTooltip } from "@/components/ui/SimpleTooltip";
import {
    XAxis,
    YAxis,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

interface WeatherKPIProps {
    customerId?: string;
}

export function WeatherUsageKPIs({ customerId }: WeatherKPIProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!customerId) return;
        setLoading(true);

        // Simulation of advanced weather analytics
        setTimeout(() => {
            setData({
                actualUsage: 301.25,
                weatherAdjusted: 276.40,
                weatherImpact: 24.85,
                weatherContributionPct: 32,
                cdd: 142,
                cddVsAvg: 18,
                peakHeatwaveDays: 4,
                sensitivityIndex: 2.35, // kWh/°C
                baseload: 180,
                weatherLoad: 121,
                peakMultiplier: 1.8,
                efficiencyScore: 0.92,
                forecast7Day: 18.5,
                forecastTempAvg: 3, // +3°C
                baseloadTrend: [
                    { day: 1, base: 6.0, weather: 4.0 },
                    { day: 2, base: 6.0, weather: 5.2 },
                    { day: 3, base: 6.1, weather: 3.1 },
                    { day: 4, base: 6.0, weather: 4.8 },
                    { day: 5, base: 6.0, weather: 6.5 },
                    { day: 6, base: 5.9, weather: 7.2 },
                    { day: 7, base: 6.0, weather: 5.8 }
                ]
            });
            setLoading(false);
        }, 800);
    }, [customerId]);

    if (loading || !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse bg-slate-50 border-none h-32"></Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Layer: Executive View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Weather Contribution % */}
                <Card className="bg-indigo-50 border border-indigo-100 shadow-sm text-slate-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Zap size={80} className="text-indigo-600" />
                    </div>
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/80">Weather Contribution</p>
                            <SimpleTooltip content="Percentage of total energy consumption directly attributable to outdoor weather conditions (HVAC Load).">
                                <Info className="w-3.5 h-3.5 text-indigo-400 cursor-help" />
                            </SimpleTooltip>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black text-indigo-700">{data.weatherContributionPct}%</h3>
                            <span className="text-sm font-bold text-indigo-600/70">headline impact</span>
                        </div>
                        <p className="text-[11px] mt-4 font-medium text-slate-600">
                            Weather-driven usage: <span className="font-extrabold text-indigo-600">{data.weatherLoad} kWh</span>
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Weather-Adjusted Usage (WAU) */}
                <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weather-Adjusted Usage</p>
                                <h3 className="text-2xl font-black text-slate-800">{data.weatherAdjusted} <span className="text-xs font-normal text-slate-400">kWh</span></h3>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Target size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span>Actual: {data.actualUsage} kWh</span>
                            <span className="text-rose-500">({data.weatherImpact > 0 ? '+' : ''}{data.weatherImpact} impact)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${(data.weatherAdjusted / data.actualUsage) * 100}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Temperature Sensitivity */}
                <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sensitivity Index</p>
                                <h3 className="text-2xl font-black text-slate-800">+{data.sensitivityIndex} <span className="text-xs font-normal text-slate-400">kWh / °C</span></h3>
                            </div>
                            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                <Activity size={20} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            How your usage reacts to temperature change. <br />
                            <span className="text-rose-500 font-bold">High sensitivity</span> → Inefficient insulation.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Diagnostic Layer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 4. HDD / CDD */}
                <Card className="bg-slate-50/50 border border-slate-100 shadow-none">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <ThermometerSun size={18} className="text-orange-500" />
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Current Month</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">CDD (Cooling Intensity)</p>
                        <h4 className="text-xl font-black text-slate-800">{data.cdd}</h4>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
                            <ArrowUpRight size={12} className="text-rose-500" />
                            <span className="text-rose-500">+{data.cddVsAvg}% vs normal</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Baseload vs Weather Load */}
                <Card className="bg-slate-50/50 border border-slate-100 shadow-none">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <Zap size={18} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Load Split</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Baseload</p>
                                <p className="text-sm font-black text-slate-700">{data.baseload} kWh</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Weather</p>
                                <p className="text-sm font-black text-indigo-600">{data.weatherLoad} kWh</p>
                            </div>
                        </div>
                        <div className="h-2 w-full mt-2 -mx-1 w-[calc(100%+8px)]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[data.baseloadTrend[0]]} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="day" hide />
                                    <Bar dataKey="base" stackId="a" fill="#94a3b8" radius={[2, 0, 0, 2]} />
                                    <Bar dataKey="weather" stackId="a" fill="#6366f1" radius={[0, 2, 2, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Peak Temperature Impact */}
                <Card className="bg-slate-50/50 border border-slate-100 shadow-none">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <TrendingUp size={18} className="text-rose-500" />
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Extreme Stress</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Peak Load Multiplier</p>
                        <h4 className="text-xl font-black text-slate-800">{data.peakMultiplier}×</h4>
                        <p className="text-[9px] text-slate-400 mt-1">Usage on hottest day vs normal day. High multiplier shows poor thermal response.</p>
                    </CardContent>
                </Card>

                {/* 7. Forecast Impact */}
                <Card className="bg-amber-50 border border-amber-100 shadow-sm text-slate-800">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <CloudSun size={18} className="text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Forward Insight</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase text-amber-700/60">Next 7 Days Forecast</p>
                        <h4 className="text-xl font-black text-slate-800">{data.forecast7Day > 0 ? '+' : ''}{data.forecast7Day} kWh</h4>
                        <p className="text-[9px] mt-1 text-slate-600">
                            Based on predicted <span className="text-amber-600 font-bold">+{data.forecastTempAvg}°C</span> increase.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
