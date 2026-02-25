import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Info } from 'lucide-react';

interface PlanComparisonChartProps {
    plans: any[]; // Using any to avoid complex type matching for now, equivalent to PlanFeatureDetail
    highlightBest?: boolean;
}

const COLORS = [
    "#10b981", // Emerald 500 (Best)
    "#6366f1", // Indigo 500
    "#8b5cf6", // Violet 500
    "#f59e0b", // Amber 500
    "#ec4899", // Pink 500
];

export const PlanComparisonChart = ({ plans, highlightBest = true }: PlanComparisonChartProps) => {

    // Transform backend cost_curve dicts into Recharts array
    // Input: plans[].cost_curve = { 500: dollars, 1000: dollars ... }
    // Output: [{ usage: 500, PlanA: $$, PlanB: $$ }, ...]
    const chartData = useMemo(() => {
        if (!plans || plans.length === 0) return [];

        // Get all usage points from the first plan (assuming all have same points)
        // If not, we'd need to collect all unique keys.
        const demoCurve = plans[0].cost_curve || {};
        const usagePoints = Object.keys(demoCurve).map(Number).sort((a, b) => a - b);

        if (usagePoints.length === 0) return [];

        return usagePoints.map(usage => {
            const point: any = { usage };
            plans.forEach(plan => {
                // Annual Cost / 12 = Monthly
                const annual = plan.cost_curve?.[usage] || 0;
                point[plan.plan_id] = Math.round(annual / 12);
            });
            return point;
        });
    }, [plans]);

    if (!plans.length) return null;

    return (
        <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-500" />
                    Projected Monthly Cost by Usage
                </CardTitle>
                <p className="text-sm text-slate-500">
                    See how plan costs change if your usage increases or decreases.
                </p>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="usage"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(val) => `${val} kWh`}
                                stroke="#94a3b8"
                                fontSize={12}
                                label={{ value: 'Monthly Usage (Annual Extrapolated)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                            />
                            <YAxis
                                tickFormatter={(val) => `$${val}`}
                                stroke="#94a3b8"
                                fontSize={12}
                                label={{ value: 'Est. Monthly Cost', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                            />
                            <Tooltip
                                formatter={(value: number, name: string) => {
                                    const planName = plans.find(p => p.plan_id === name)?.plan_name || name;
                                    return [`$${value}/mo`, planName];
                                }}
                                labelFormatter={(label) => `Usage: ${label} kWh / year equivalent`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value, _entry: any) => {
                                    const plan = plans.find(p => p.plan_id === value);
                                    return <span className="text-sm font-medium text-slate-700 ml-1">{plan?.plan_name || value}</span>;
                                }}
                            />

                            {plans.map((plan, index) => (
                                <Line
                                    key={plan.plan_id}
                                    type="monotone"
                                    dataKey={plan.plan_id}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={index === 0 && highlightBest ? 4 : 2}
                                    dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                                    activeDot={{ r: 6 }}
                                    name={plan.plan_id} // Used for lookup in tooltip/legend
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
