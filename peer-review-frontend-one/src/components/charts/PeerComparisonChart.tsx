import { useState } from 'react';
import { ScatterChart, Scatter, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend, LineChart, PieChart, Pie } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, Thermometer } from 'lucide-react';
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";

interface PeerComparisonChartProps {
    myUsage?: number;
    peerAverage?: number;
    clusterType?: 'all' | 'solar' | 'non-solar';
}

export function PeerComparisonChart({ myUsage = 0, peerAverage = 0, clusterType = 'all' }: PeerComparisonChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Simulate varying data based on date range
    const getDaysInRange = () => {
        if (startDate && endDate) {
            return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        }
        return 30;
    };
    const rangeMultiplier = getDaysInRange() <= 7 ? 0.8 : getDaysInRange() >= 90 ? 1.2 : 1;
    const adjustedMyUsage = (myUsage || 1000) * rangeMultiplier;
    const adjustedPeerAvg = (peerAverage || 1000) * rangeMultiplier;

    const totalUsage = Math.round(adjustedMyUsage);
    const totalCost = parseFloat((adjustedMyUsage * 0.15).toFixed(2));

    const diff = adjustedMyUsage - adjustedPeerAvg;
    const pctDiff = adjustedPeerAvg > 0 ? (diff / adjustedPeerAvg) * 100 : 0;
    const isHigher = diff > 0;
    const absPct = Math.round(Math.abs(pctDiff) * 10) / 10;

    const getAnalysisPeriodLabel = () => {
        if (startDate && endDate) {
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        if (startDate) {
            return `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        return 'Last 30 Days';
    };

    const base = adjustedPeerAvg > 0 ? adjustedPeerAvg : 1000;

    // Individual peer scatter data
    const peerData = [
        { x: 1, y: base * 0.8, z: 200 },
        { x: 2, y: base * 1.1, z: 260 },
        { x: 3, y: base * 0.95, z: 400 },
        { x: 4, y: base * 1.2, z: 280 },
        { x: 5, y: base * 0.9, z: 500 },
        { x: 6, y: base * 1.15, z: 300 },
        { x: 7, y: base * 1.05, z: 200 },
        { x: 8, y: base * 0.85, z: 100 },
    ];

    // Combined chart data with individual peers, usage and cost
    const composedData = [
        { name: 'P1', usage: Math.round(base * 0.8), cost: Math.round(base * 0.8 * 0.12) },
        { name: 'P2', usage: Math.round(base * 1.1), cost: Math.round(base * 1.1 * 0.14) },
        { name: 'P3', usage: Math.round(base * 0.95), cost: Math.round(base * 0.95 * 0.13) },
        { name: 'You', usage: Math.round(adjustedMyUsage), cost: Math.round(adjustedMyUsage * 0.15) },
        { name: 'P4', usage: Math.round(base * 1.2), cost: Math.round(base * 1.2 * 0.15) },
        { name: 'P5', usage: Math.round(base * 0.9), cost: Math.round(base * 0.9 * 0.12) },
        { name: 'Avg', usage: Math.round(base), cost: Math.round(base * 0.13) },
    ];

    // Pie Chart Data
    const pieData = [
        { name: 'Your Usage', value: Math.round(adjustedMyUsage) },
        { name: 'Peer Average', value: Math.round(base) },
    ];

    // Weather context
    const weatherContext = { high: 92, low: 68, avg: 78 };

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={composedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: '$', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="usage" name="Usage (kWh)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? (isHigher ? '#f97316' : '#10b981') : '#94a3b8'} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                );
            case 'scatter':
                return (
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Neighbor ID"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Anonymized Neighbors', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            label={{ value: 'Usage (kWh)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine y={base} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Avg', position: 'insideTopLeft', fontSize: 10, fill: '#94a3b8' }} />
                        <Scatter name="Peers" data={peerData} fill="#94a3b8" line={{ stroke: '#cbd5e1', strokeWidth: 1 }} shape="circle" />
                        <Scatter name="You" data={[{ x: 5, y: adjustedMyUsage || base, z: 500 }]} fill={isHigher ? "#f97316" : "#10b981"} shape="circle">
                            <Cell fill={isHigher ? "#f97316" : "#10b981"} stroke="white" strokeWidth={2} />
                        </Scatter>
                    </ScatterChart>
                );
            case 'bar':
            default:
                return (
                    <ComposedChart data={composedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: '$', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar yAxisId="left" dataKey="usage" name="Usage (kWh)" radius={[4, 4, 0, 0]} maxBarSize={35}>
                            {composedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'You' ? (isHigher ? '#f97316' : '#10b981') : entry.name === 'Avg' ? '#3b82f6' : '#94a3b8'} />
                            ))}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                    </ComposedChart>
                );
        }
    };

    return (
        <>
            <DateRangeSelector
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                totalUsage={totalUsage}
                totalCost={totalCost}
                onClear={() => { setStartDate(null); setEndDate(null); }}
            />

            <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-base font-normal text-slate-500">
                            Peer Comparison
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Analysis Period: {getAnalysisPeriodLabel()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Weather Context Strip */}
                        <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            <Thermometer className="h-3 w-3" />
                            <span>H:{weatherContext.high}°</span>
                            <span>L:{weatherContext.low}°</span>
                            <span>Avg:{weatherContext.avg}°</span>
                        </div>

                        {/* Chart Type Dropdown */}
                        <div className="relative">
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value as any)}
                                className="appearance-none bg-slate-100 border-none text-xs font-medium text-slate-600 rounded-md py-1.5 pl-3 pr-8 cursor-pointer hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Graph</option>
                                <option value="pie">Pie Chart</option>
                                <option value="scatter">Scatter Plot</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>

                        <Users className="h-4 w-4 text-slate-400 ml-1" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className={`text-2xl font-bold ${isHigher ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isHigher ? '+' : '-'}{absPct}%
                        </div>
                        <div className="text-xs text-slate-500">
                            {isHigher ? 'Higher cost than peers' : 'Lower cost than peers'}
                        </div>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>

                    {/* Dynamic Legend/Context based on chart type */}
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 mb-4">
                        {chartType === 'pie' ? (
                            <>
                                <span className="flex items-center gap-1">
                                    <span className="block h-2 w-2 rounded-full bg-slate-400"></span> Peer Avg
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className={`block h-2 w-2 rounded-full ${isHigher ? 'bg-orange-500' : 'bg-emerald-500'}`}></span> You
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="flex items-center gap-1">
                                    <span className="block h-2 w-2 rounded-full bg-slate-400"></span> Peers
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="block h-2 w-2 rounded-full bg-blue-500"></span> Avg ({Math.round(base)} kWh)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className={`block h-2 w-2 rounded-full ${isHigher ? 'bg-orange-500' : 'bg-emerald-500'}`}></span> You ({Math.round(adjustedMyUsage)} kWh)
                                </span>
                            </>
                        )}
                    </div>

                    <AIChartAnalysis
                        chartType={`Peer Comparison (${chartType})`}
                        dataContext={{
                            my_usage: adjustedMyUsage,
                            peer_avg: base,
                            difference_pct: pctDiff,
                            time_range: getAnalysisPeriodLabel(),
                            cluster_type: clusterType,
                            chart_type: chartType
                        }}
                    />
                </CardContent>
            </Card>
        </>
    );
}
