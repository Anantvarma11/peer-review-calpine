import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Grid, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { getHourlyUsage } from "@/lib/api";
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";
import { useUI } from '@/lib/do-library/context/UIContext';

interface UsageHeatmapProps {
    customerId?: string;
}

export function UsageHeatmap({ customerId }: UsageHeatmapProps) {
    const [heatmapData, setHeatmapData] = useState<{ usage: number; intensity: number }[][]>([]);
    const [loading, setLoading] = useState(false);
    const [nlgInsight, setNlgInsight] = useState("Analyzing usage patterns...");
    const { isDark } = useUI();

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const times = ['Night', 'Morn', 'Aft', 'Eve'];

    useEffect(() => {
        if (!customerId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch last 7 days of hourly data (backend default)
                const data = await getHourlyUsage(customerId);

                if (data && data.length > 0) {
                    processHeatmapData(data);
                } else {
                    setHeatmapData([]);
                    setNlgInsight("Not enough data to generate patterns.");
                }
            } catch (error) {
                console.error("Heatmap fetch error", error);
                setNlgInsight("Failed to load pattern data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId]);

    const processHeatmapData = (data: any[]) => {
        // Initialize 7x4 grid
        const grid = Array(7).fill(0).map(() => Array(4).fill(0));
        const gridCounts = Array(7).fill(0).map(() => Array(4).fill(0));

        data.forEach(item => {
            const date = new Date(item.USAGE_DATE);
            const day = date.getUTCDay(); // 0-6 Sun-Sat
            const hour = item.USAGE_HOUR;

            let timeBlock = 0; // Night
            if (hour >= 6 && hour < 12) timeBlock = 1; // Morn
            else if (hour >= 12 && hour < 18) timeBlock = 2; // Aft
            else if (hour >= 18) timeBlock = 3; // Eve

            grid[day][timeBlock] += (item.KWH || 0);
            gridCounts[day][timeBlock]++;
        });

        // Calculate Average and Max
        let maxVal = 0;
        let maxDay = 0;
        let maxTime = 0;

        const avgGrid = grid.map((row, d) => row.map((sum, t) => {
            const count = gridCounts[d][t];
            const avg = count > 0 ? sum / count : 0;
            if (avg > maxVal) {
                maxVal = avg;
                maxDay = d;
                maxTime = t;
            }
            return avg;
        }));

        // Normalize to 0-4 scale (GitHub style is 5 levels usually 0-4)
        const normalizedGrid = avgGrid.map(row => row.map(val => {
            let intensity = 0;
            if (maxVal > 0) {
                const ratio = val / maxVal;
                if (ratio > 0.8) intensity = 4;
                else if (ratio > 0.6) intensity = 3;
                else if (ratio > 0.4) intensity = 2;
                else if (ratio > 0.1) intensity = 1;
            }
            return { usage: val, intensity };
        }));

        setHeatmapData(normalizedGrid);

        // Generate NLG
        const dayName = days[maxDay];
        const fullTimeNames = ["Night (12am-6am)", "Morning (6am-12pm)", "Afternoon (12pm-6pm)", "Evening (6pm-12am)"];

        setNlgInsight(`Peak usage detected on **${dayName} ${fullTimeNames[maxTime]}**.`);
    };

    const getColor = (intensity: number) => {
        // Blue Scale: Low -> High
        switch (intensity) {
            case 0: return isDark ? 'bg-slate-800' : 'bg-slate-100'; // Empty
            case 1: return 'bg-blue-200';
            case 2: return 'bg-blue-400';
            case 3: return 'bg-blue-600';
            case 4: return 'bg-blue-800';
            default: return isDark ? 'bg-slate-800' : 'bg-slate-100';
        }
    };

    if (loading) {
        return (
            <Card className="col-span-1 border-slate-50 flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </Card>
        );
    }

    return (
        <Card className="col-span-1 bg-[var(--bg-surface-1)] shadow-sm border-[var(--border-subtle)]">
            <CardHeader className="pb-3 border-b border-[var(--border-subtle)] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Grid className="h-4 w-4 text-[var(--text-secondary)]" />
                    Usage Heatmap
                </CardTitle>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-medium border border-indigo-100">
                    <Sparkles className="h-3 w-3" />
                    <span>AI Pattern Analysis</span>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {heatmapData.length > 0 ? (
                    <>
                        <p className="text-xs text-[var(--text-secondary)] mb-4 bg-[var(--bg-surface-2)] p-2 rounded border border-[var(--border-subtle)]">
                            <span dangerouslySetInnerHTML={{ __html: nlgInsight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </p>

                        <div className="flex flex-col gap-0.5">
                            {/* Header Row */}
                            <div className="flex gap-1 ml-6 mb-1">
                                {times.map((t, i) => (
                                    <div key={i} className="flex-1 text-center text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                                        {t}
                                    </div>
                                ))}
                            </div>

                            {/* Rows */}
                            {heatmapData.map((dayRow, dayIndex) => (
                                <div key={dayIndex} className="flex items-center gap-1.5 mb-1">
                                    <span className="w-8 text-[10px] font-medium text-[var(--text-secondary)] text-right pr-2">{days[dayIndex]}</span>
                                    <div className="flex-1 flex gap-1 h-6">
                                        {dayRow.map((cell, hourIndex) => (
                                            <div
                                                key={hourIndex}
                                                className={`flex-1 rounded-sm ${getColor(cell.intensity)} transition-all hover:ring-2 hover:ring-offset-1 hover:ring-indigo-300 cursor-pointer relative group`}
                                                title={`${days[dayIndex]} ${times[hourIndex]}: ${cell.usage.toFixed(2)} kWh`}
                                            >
                                                {/* Optional Tooltip Custom Implementation if needed, but native title is robust */}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-secondary)]">Last 7 Days Activity</span>
                            <div className="flex items-center justify-end gap-2 text-[10px] text-[var(--text-secondary)]">
                                <span>Low</span>
                                <div className="flex gap-0.5">
                                    <div className="w-2 h-2 bg-slate-100 rounded-sm"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                                </div>
                                <span>High</span>
                            </div>
                        </div>

                        <div className="mt-2">
                            <AIChartAnalysis
                                chartType="Usage Patterns"
                                dataContext={{
                                    analysis_type: "heatmap_7d",
                                    max_usage_day: heatmapData.length > 0 ? days[heatmapData.reduce((maxI, row, i, arr) => row.reduce((s, c) => s + c.usage, 0) > arr[maxI].reduce((s, c) => s + c.usage, 0) ? i : maxI, 0)] : "N/A",
                                    data_summary: "User uses most energy in Evenings and Mornings." // Simplified context or pass full grid if backend can handle 28 ints
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div className="bg-slate-50 p-3 rounded-full mb-3">
                            <AlertCircle className="h-6 w-6 text-[var(--text-secondary)]" />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Data Not Available</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">
                            We couldn't generate a usage heatmap for this period. Please check back later once more data is collected.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
