import { useMemo } from 'react';
import {
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    Area,
    LabelList
} from 'recharts';

interface MyUsageChartProps {
    analysisType: 'my' | 'peer' | 'peak';
    timeframe: 'day' | 'month' | 'annual' | 'all';
    weatherImpact: boolean;
    zone: string;
    zipcode: string;
}

const CustomTooltip = ({ active, payload, label, timeframe }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDate();
        const currentYear = now.getFullYear();

        let costLabel = "Billed";
        if (timeframe === 'day') {
            const hour = parseInt(label.split(' ')[0]);
            const isPM = label.includes('PM');
            const numericHour = (isPM && hour !== 12) ? hour + 12 : (!isPM && hour === 12) ? 0 : hour;
            if (numericHour > currentHour) costLabel = "Est Cost";
            else if (numericHour === currentHour) costLabel = "Bill till Date";
        } else if (timeframe === 'month') {
            const day = parseInt(label);
            if (day > currentDay) costLabel = "Est Cost";
            else if (day === currentDay) costLabel = "Bill till Date";
        } else if (timeframe === 'annual' || timeframe === 'all') {
            const year = parseInt(label);
            if (year > currentYear) costLabel = "Est Cost";
            else if (year === currentYear) costLabel = "Bill till Date";
        }

        const usage = data.usage !== null ? `${data.usage.toFixed(2)} kWh` : 'N/A';
        const cost = data.usage !== null ? `$${(data.usage * 0.12).toFixed(2)}` : `$${(data.predicted * 0.12).toFixed(2)}`;

        return (
            <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl text-[11px] min-w-[160px]">
                <p className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 text-[12px]">{label}</p>
                <div className="space-y-2">
                    <div className="flex justify-between gap-6 items-center">
                        <span className="text-slate-600 font-medium">Actual Usage</span>
                        <span className="font-bold text-slate-900">{usage}</span>
                    </div>
                    <div className="flex justify-between gap-6 items-center">
                        <span className="text-slate-600 font-medium">Predicted</span>
                        <span className="font-bold text-purple-700">{data.predicted.toFixed(2)} kWh</span>
                    </div>
                    <div className="flex justify-between gap-6 items-center pt-2 border-t border-slate-100">
                        <span className="text-slate-600 font-medium">{costLabel}</span>
                        <span className="font-black text-indigo-700 text-[12px]">{cost}</span>
                    </div>
                    {data.temp && (
                        <div className="flex justify-between gap-6 items-center pt-2 border-t border-slate-100 text-orange-600">
                            <span className="font-medium">Temperature</span>
                            <span className="font-bold">{data.temp.toFixed(1)}°F</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export function MyUsageChart({ analysisType, timeframe, weatherImpact, zone, zipcode }: MyUsageChartProps) {

    const data = useMemo(() => {
        const result = [];
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDate();
        const currentYear = now.getFullYear();

        if (timeframe === 'day') {
            // 24 Hours
            for (let i = 0; i < 24; i++) {
                const hour = i % 12 || 12;
                const ampm = i < 12 ? 'AM' : 'PM';
                const isFuture = i > currentHour;
                result.push({
                    name: `${hour} ${ampm}`,
                    usage: isFuture ? null : 0.5 + Math.random() * 2,
                    predicted: 0.6 + Math.random() * 1.8,
                    peerUsage: 0.6 + Math.random() * 1.8,
                    temp: 65 + Math.sin((i - 6) * Math.PI / 12) * 15 + (Math.random() * 2)
                });
            }
        } else if (timeframe === 'month') {
            // 30 Days
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const isFuture = i > currentDay;
                result.push({
                    name: i.toString(),
                    usage: isFuture ? null : 15 + Math.random() * 25,
                    predicted: 18 + Math.random() * 20,
                    peerUsage: 18 + Math.random() * 20,
                    temp: 70 + Math.random() * 10
                });
            }
        } else if (timeframe === 'annual' || timeframe === 'all') {
            // Years 2020-2026
            for (let i = 2020; i <= 2026; i++) {
                const isFuture = i > currentYear;
                result.push({
                    name: i.toString(),
                    usage: isFuture ? null : 4500 + Math.random() * 2000,
                    predicted: 4800 + Math.random() * 1500,
                    peerUsage: 4800 + Math.random() * 1500,
                    temp: 72 + Math.random() * 5
                });
            }
        }

        return result;
    }, [timeframe]);

    const chartTitle = useMemo(() => {
        const typeLabel = analysisType === 'my' ? 'My Usage' : analysisType === 'peer' ? 'Peer Comparison' : 'Peak Usage';
        const timeLabel = timeframe === 'day' ? 'Today' : timeframe === 'month' ? 'This Month' : timeframe === 'annual' ? 'Annual' : 'All Time';
        return `${typeLabel} - ${timeLabel}`;
    }, [analysisType, timeframe]);

    return (
        <div className="w-full h-full flex flex-col p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-normal text-slate-800 tracking-tight">{chartTitle}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                        {analysisType === 'peer' ? `Comparing across ${zone} Zone ${zipcode ? `(${zipcode})` : ''}` : 'Personal Consumption Analysis'}
                    </p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span className="text-[10px] font-normal text-slate-500 uppercase">Usage</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-[10px] font-normal text-slate-500 uppercase">Predicted</span>
                    </div>
                    {analysisType === 'peer' && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-normal text-slate-500 uppercase">Peers</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            interval={timeframe === 'day' ? 3 : 'preserveStart'}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            hide={!weatherImpact}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#fb923c', fontSize: 10 }}
                        />
                        <Tooltip
                            content={<CustomTooltip timeframe={timeframe} />}
                            cursor={{ fill: '#f8fafc' }}
                        />

                        {analysisType === 'peer' && (
                            <Bar
                                dataKey="peerUsage"
                                fill="#f1f5f9"
                                radius={[4, 4, 0, 0]}
                                barSize={timeframe === 'day' ? 12 : 8}
                            />
                        )}

                        <Bar
                            dataKey="usage"
                            fill="#f97316"
                            radius={[4, 4, 0, 0]}
                            barSize={timeframe === 'day' ? 12 : 8}
                        />

                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#a855f7"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />

                        {weatherImpact && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="temp"
                                stroke="#fb923c"
                                strokeWidth={1}
                                dot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                            >
                                <LabelList
                                    dataKey="temp"
                                    position="top"
                                    offset={10}
                                    content={({ x, y, value }: any) => (
                                        <text x={x} y={y} dy={-4} fill="#fb923c" fontSize={9} textAnchor="middle">
                                            {typeof value === 'number' ? value.toFixed(0) : ''}°
                                        </text>
                                    )}
                                />
                            </Line>
                        )}

                        {timeframe === 'annual' && (
                            <Area
                                type="monotone"
                                dataKey="usage"
                                stroke="none"
                                fill="url(#usageGradient)"
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 italic">
                <span>* Data visualized is based on {analysisType === 'peer' ? 'aggregated peer group patterns' : 'historical smart meter readings'}.</span>
                <span className="not-italic font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded cursor-help">Analysis Insights →</span>
            </div>
        </div>
    );
}
