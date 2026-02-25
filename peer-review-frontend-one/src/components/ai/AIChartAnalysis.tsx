import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { analyzeChartData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AIChartAnalysisProps {
    chartType: string;
    dataContext: any;
    className?: string;
    autoAnalyze?: boolean;
}

export function AIChartAnalysis({ chartType, dataContext, className, autoAnalyze = false }: AIChartAnalysisProps) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [isExpanded, setIsExpanded] = useState(autoAnalyze);

    const fetchAnalysis = async () => {
        if (!dataContext) return;
        setLoading(true);
        setError(false);
        setIsExpanded(true);
        try {
            const result = await analyzeChartData(chartType, dataContext);
            setAnalysis(result);
        } catch (e) {
            console.error("AI Analysis Failed", e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoAnalyze && dataContext && !analysis && !loading) {
            fetchAnalysis();
        }
    }, [JSON.stringify(dataContext), autoAnalyze]);

    if (!isExpanded && !loading && !analysis) {
        return (
            <div className={cn("mt-4 flex justify-end", className)}>
                <button
                    onClick={fetchAnalysis}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors border border-indigo-100 shadow-sm"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate AI Analysis
                </button>
            </div>
        )
    }

    return (
        <div className={cn("mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group animate-in fade-in slide-in-from-top-2 duration-300", className)}>
            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex items-start gap-3">
                <div className="p-2 bg-white border border-slate-200 shadow-sm text-indigo-600 rounded-lg shrink-0 mt-0.5">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-800">Smart Analysis</h4>
                        {!loading && (
                            <button
                                onClick={fetchAnalysis}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                title="Regenerate Analysis"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-2 animate-pulse mt-2">
                            <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                        </div>
                    ) : error ? (
                        <p className="text-xs text-rose-500">Analysis temporarily unavailable.</p>
                    ) : (
                        <p className="text-xs text-slate-600 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 text-justify">
                            {analysis}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
