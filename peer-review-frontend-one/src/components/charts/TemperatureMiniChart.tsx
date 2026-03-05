import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Area
} from 'recharts';

interface TemperatureMiniChartProps {
    data: any[];
    timeframe: 'day' | 'month' | 'annual' | 'all';
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm p-2 border border-slate-200 shadow-xl rounded-xl text-[10px]">
                <p className="font-bold text-slate-900 mb-1">{label}</p>
                <div className="flex items-center gap-2 text-orange-600">
                    <span className="font-medium">Temp:</span>
                    <span className="font-black">{payload[0].value.toFixed(1)}°F</span>
                </div>
            </div>
        );
    }
    return null;
};

export function TemperatureMiniChart({ data, timeframe }: TemperatureMiniChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 8 }}
                    interval={timeframe === 'day' ? 5 : 'preserveStart'}
                    hide
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 8 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="none"
                    fill="url(#tempGradient)"
                />
                <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
