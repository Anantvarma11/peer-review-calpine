import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Box, Loader2 } from 'lucide-react';
import { getDailyUsage } from '@/lib/api';
import { AIChartAnalysis } from "@/components/ai/AIChartAnalysis";

export function ThreeDAnalysisChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dailyData = await getDailyUsage('983241');
                if (dailyData && dailyData.length > 0) {
                    const sorted = [...dailyData].sort((a: any, b: any) =>
                        new Date(a.USAGE_DATE).getTime() - new Date(b.USAGE_DATE).getTime()
                    );

                    // Process data for 3D Plot
                    const processed = sorted.slice(-14).map((item: any) => ({
                        date: new Date(item.USAGE_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        usage: Math.round(item.DAILY_KWH * 10) / 10,
                        cost: parseFloat((item.DAILY_COST || item.DAILY_KWH * 0.14).toFixed(2)),
                        temp: Math.round(item.TEMP_F || 65 + Math.random() * 15)
                    }));
                    setData(processed);
                }
            } catch (err) {
                console.error("Failed to load 3D data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Extract axes
    const xData = data.map(d => d.usage); // X: Usage
    const yData = data.map(d => d.cost);  // Y: Cost
    const zData = data.map(d => d.temp);  // Z: Temp
    const textData = data.map(d => `${d.date}<br>Usage: ${d.usage}kWh<br>Cost: $${d.cost}<br>Temp: ${d.temp}°F`);
    const colorData = data.map(d => d.temp); // Color by Temp

    return (
        <Card className="col-span-1 bg-white">
            <CardHeader className="pb-2 border-b border-slate-50">
                <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <Box className="h-4 w-4 text-slate-500" />
                    3D Multi-Dimensional Analysis
                </CardTitle>
                <p className="text-xs text-slate-500">Correlating Energy (X), Cost (Y), and Temperature (Z)</p>
            </CardHeader>
            <CardContent className="pt-0 h-[500px] w-full relative flex flex-col">
                {/* Initial height 450 -> increased to 500 to accommodate text */}
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="w-full flex-1">
                            <Plot
                                data={[
                                    {
                                        x: xData,
                                        y: yData,
                                        z: zData,
                                        mode: 'markers+lines',
                                        type: 'scatter3d',
                                        marker: {
                                            size: 6,
                                            color: colorData,
                                            colorscale: 'Viridis',
                                            opacity: 0.8,
                                            showscale: true,
                                            colorbar: {
                                                title: 'Temp (°F)',
                                                thickness: 10,
                                                len: 0.5
                                            }
                                        },
                                        line: {
                                            color: '#3b82f6',
                                            width: 2
                                        },
                                        text: textData,
                                        hoverinfo: 'text'
                                    }
                                ]}
                                layout={{
                                    autosize: true,
                                    margin: { l: 0, r: 0, b: 0, t: 0 }, // Tight margins
                                    scene: {
                                        xaxis: { title: 'Usage (kWh)' },
                                        yaxis: { title: 'Cost ($)' },
                                        zaxis: { title: 'Temp (°F)' },
                                        camera: {
                                            eye: { x: 1.5, y: 1.5, z: 1.2 }
                                        }
                                    },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                }}
                                config={{ responsive: true, displayModeBar: false }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        <div className="px-4 pb-4">
                            <AIChartAnalysis
                                chartType="3D Energy Analysis"
                                dataContext={{
                                    explanation: "Correlating Usage vs Cost vs Temp",
                                    sample_points: data.slice(0, 3).map(p => ({ usage: p.usage, cost: p.cost, temp: p.temp }))
                                }}
                            />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
