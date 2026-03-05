import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Line,
    Area,
    ComposedChart,
    XAxis,
    YAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    Tooltip,
    CartesianGrid,
    ScatterChart,
    Scatter,
    ZAxis,
    Legend,
    AreaChart
} from 'recharts';
import { Info } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/SimpleTooltip';

interface WeatherChartsProps {
    customerId?: string;
}

export function WeatherCharts({ customerId: _customerId }: WeatherChartsProps) {
    // Mock data for the 5 charts
    const timeSeriesData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        usage: 2 + Math.random() * 5 + (i > 17 || i < 8 ? 2 : 0),
        temp: 20 + Math.sin(i / 10) * 10 + Math.random() * 2,
        baseload: 2.1,
        weatherLoad: 1.5 + Math.random() * 3,
        cdd: i > 12 ? Math.random() * 5 : 0,
        hdd: i < 8 ? Math.random() * 3 : 0,
    })), []);

    const regressionData = useMemo(() => Array.from({ length: 50 }, (_, _i) => {
        const temp = 15 + Math.random() * 25;
        // Linear relationship with some noise: usage = 0.2 * temp + 2 + noise
        const usage = 0.15 * temp + 1.5 + (Math.random() - 0.5) * 3;
        return { temp: parseFloat(temp.toFixed(1)), usage: parseFloat(usage.toFixed(2)) };
    }), []);

    const forecastData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        actual: i < 1 ? 25 : null,
        projected: 22 + Math.random() * 10,
        temp: 28 + Math.random() * 5
    })), []);

    return (
        <div className="space-y-6 mt-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">Weather Correlation Analysis</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Temperature vs Usage Dual-axis */}
                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Temperature vs Usage</h4>
                                <SimpleTooltip content="Correlation between hourly temperature and real-time energy demand.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </SimpleTooltip>
                            </div>
                            <div className="flex gap-3 text-[9px] font-bold uppercase">
                                <span className="text-orange-500">Temp (°C)</span>
                                <span className="text-indigo-500">Usage (kWh)</span>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#f97316' }} />
                                    <Tooltip />
                                    <Area yAxisId="left" type="monotone" dataKey="usage" fill="#6366f1" fillOpacity={0.1} stroke="#6366f1" strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. HDD/CDD Daily Bar */}
                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Heating & Cooling Intensity</h4>
                                <SimpleTooltip content="Degree days quantify the demand for heating (HDD) or cooling (CDD) based on outdoor temperature.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </SimpleTooltip>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <Bar dataKey="cdd" name="Cooling Degree Days" fill="#f97316" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="hdd" name="Heating Degree Days" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Baseload vs Weather Load Stacked Area */}
                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Load Decomposition</h4>
                                <SimpleTooltip content="Separates fixed always-on usage (Baseload) from weather-dependent HVAC usage.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </SimpleTooltip>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="baseload" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                                    <Area type="monotone" dataKey="weatherLoad" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Sensitivity Regression Scatter */}
                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Temperature Sensitivity (Regression)</h4>
                                <SimpleTooltip content="Each dot represents a day's usage vs its average temperature. The slope indicates thermal efficiency.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </SimpleTooltip>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" dataKey="temp" name="Temperature" unit="°C" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis type="number" dataKey="usage" name="Usage" unit="kWh" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <ZAxis type="number" range={[40, 40]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Daily Pattern" data={regressionData} fill="#f97316" fillOpacity={0.5} />
                                    {/* Trendline simulation */}
                                    <Line
                                        type="linear"
                                        data={[{ temp: 15, usage: 4 }, { temp: 40, usage: 10 }]}
                                        dataKey="usage"
                                        stroke="#1e293b"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        legendType="none"
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Forecast Weather Impact Projection */}
                <Card className="bg-white border-none shadow-sm lg:col-span-2">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">7-Day Forward Weather Impact Projection</h4>
                                <SimpleTooltip content="Predicts future energy consumption based on upcoming weather forecasts.">
                                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                                </SimpleTooltip>
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={forecastData}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '8px', color: '#0f172a', fontSize: '12px' }} />
                                    <Bar dataKey="projected" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={40} fillOpacity={0.8} />
                                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
