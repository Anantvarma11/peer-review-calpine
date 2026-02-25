import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Sparkles, Zap, TrendingDown, Thermometer, AlertCircle, Volume2, StopCircle, RefreshCw, Wind } from "lucide-react";
import React, { useState, useEffect } from "react";
import { LightbulbRegular } from '@fluentui/react-icons';
import api from "@/lib/api";

interface Insight {
    insight_type: string;
    severity: string;
    title: string;
    message: string;
    actionable_item?: string;
    related_metric?: string;
}

interface AIInsightsPanelProps {
    customerId?: string; // If provided, fetches data
    category?: 'general' | 'usage' | 'peer' | 'weather'; // Default: general
    compact?: boolean; // For smaller views
    variant?: 'card' | 'plain'; // 'card' (default) has shadow/border, 'plain' is just the list
    hideHeader?: boolean;
}

// @ts-ignore
export function AIInsightsPanel({ customerId = "983241", category = 'general', compact = false, variant: _variant = 'card', hideHeader: _hideHeader = false }: AIInsightsPanelProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [currentSlide, setCurrentSlide] = useState<0 | 1>(0);

    useEffect(() => {
        fetchInsights();
    }, [category, customerId, currentSlide]); // Refetch when slide changes if we want lazy loading, but better to just fetch based on slide intent

    const fetchInsights = async () => {
        setLoading(true);
        try {
            // Determine category based on slide if the prop category is 'general'
            // If prop is specific (e.g. 'usage'), stick to it.
            // If prop is 'general', slide 0 = 'general' (mixed), slide 1 = 'deep'
            let targetCategory: string = category;
            if (category === 'general') {
                targetCategory = currentSlide === 0 ? 'general' : 'deep';
            }

            // Correct endpoint is /ai/insights/{customerId}
            const res = await api.get(`/ai/insights/${customerId}`, { params: { category: targetCategory as any } });
            if (res.data && res.data.insights) {
                setInsights(res.data.insights);
            }
        } catch (err) {
            console.error("Failed to fetch AI insights", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const toggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const textToRead = insights.map(i => `${i.title}. ${i.message}`).join(" ");
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };



    const getTitle = () => {
        if (category === 'general' && currentSlide === 1) return "Deep Intelligence Analysis";
        switch (category) {
            case 'weather': return "Weather Intelligence";
            case 'peer': return "Community Insights";
            case 'usage': return "Usage Analytics";
            default: return "AI Energy Assistant";
        }
    }

    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

    const getTheme = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('weather') || t.includes('temp')) return { color: 'amber', glow: '245, 158, 11', icon: <Thermometer className="h-5 w-5" /> };
        if (t.includes('peer')) return { color: 'emerald', glow: '16, 185, 129', icon: <TrendingDown className="h-5 w-5" /> };
        if (t.includes('anomaly') || t.includes('alert')) return { color: 'rose', glow: '244, 63, 94', icon: <AlertCircle className="h-5 w-5" /> };
        if (t.includes('deep')) return { color: 'violet', glow: '139, 92, 246', icon: <Sparkles className="h-5 w-5" /> };
        return { color: 'blue', glow: '59, 130, 246', icon: <Zap className="h-5 w-5" /> };
    }

    return (
        <>
            <Card className={`col-span-1 bg-white shadow-sm border-indigo-50 flex flex-col ${compact ? 'h-full' : ''}`}>
                <CardHeader className="pb-3 border-b border-slate-50 flex-none bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 rounded-md">
                                {category === 'weather' ? <Wind className="h-4 w-4 text-indigo-600" /> : <Sparkles className="h-4 w-4 text-indigo-600" />}
                            </div>
                            <CardTitle className="text-base font-bold text-slate-800">{getTitle()}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Slide Toggles for General Category */}
                            {category === 'general' && (
                                <div className="flex bg-slate-100 rounded-full p-0.5 mr-2">
                                    <button
                                        onClick={() => setCurrentSlide(0)}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${currentSlide === 0 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}
                                    >
                                        Summary
                                    </button>
                                    <button
                                        onClick={() => setCurrentSlide(1)}
                                        className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${currentSlide === 1 ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-purple-500'}`}
                                    >
                                        Deep Dive
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={fetchInsights}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-indigo-600"
                                title="Refresh"
                            >
                                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={toggleSpeech}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-indigo-600"
                                title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                            >
                                {isSpeaking ? <StopCircle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 flex-1 overflow-y-auto min-h-[200px] relative">
                    {loading ? (
                        <div className="space-y-4 animate-pulse pt-2">
                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-full bg-slate-200 rounded"></div>
                                        <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-full bg-slate-200 rounded"></div>
                                        <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : insights.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No insights available.</div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* 
                                SPLIT RENDER LOGIC:
                                1. General Dashboard View (Summary Slide): Shows categorized 3-section layout.
                                2. Specific Views (Usage/Peer/Weather Pages) OR Deep Dive: Shows flat list of all insights.
                            */}

                            {category === 'general' && currentSlide === 0 ? (
                                // --- GENERAL DASHBOARD 3-SECTION LAYOUT ---
                                [
                                    { title: 'My Usage', type: 'usage', icon: <Zap className="h-4 w-4 text-blue-600" /> },
                                    { title: 'Peer Comparison', type: 'peer', icon: <TrendingDown className="h-4 w-4 text-emerald-600" /> },
                                    { title: 'Weather Impact', type: 'weather', icon: <Thermometer className="h-4 w-4 text-amber-600" /> }
                                ].map((section) => {
                                    // Find insight matching this section's type with flexible keywords
                                    const insight = insights.find(i => {
                                        const type = i.insight_type?.toLowerCase() || '';
                                        if (section.type === 'usage') return type.includes('usage') || type.includes('anomaly') || type.includes('consumption');
                                        if (section.type === 'peer') return type.includes('peer') || type.includes('compar') || type.includes('communit') || type.includes('rank');
                                        if (section.type === 'weather') return type.includes('weather') || type.includes('temp') || type.includes('season') || type.includes('impact');
                                        return type.includes(section.type);
                                    });

                                    const theme = insight ? getTheme(insight.insight_type || 'general') : { color: 'slate', glow: '200,200,200', icon: section.icon };

                                    return (
                                        <div key={section.title} className="space-y-1.5">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                {section.icon}
                                                {section.title}
                                            </h5>
                                            <div
                                                onClick={() => insight && setSelectedInsight(insight)}
                                                className={`group relative p-3 rounded-lg border bg-white ${insight ? 'hover:bg-slate-50 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01]' : 'opacity-70 cursor-not-allowed bg-slate-50'} transition-all`}
                                                style={{ borderColor: insight ? `rgba(${theme.glow}, 0.3)` : 'transparent' }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{insight ? insight.title : "No data available"}</h4>
                                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{insight ? insight.message : `No specific ${section.title.toLowerCase()} insight found at this time.`}</p>
                                                    </div>
                                                    {insight && (
                                                        <div className={`mt-1 text-${theme.color}-600 bg-${theme.color}-50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                            <Sparkles className="h-3.5 w-3.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // --- SPECIFIC CATEGORY / DEEP DIVE FLAT LIST ---
                                insights.map((insight, idx) => {
                                    const theme = getTheme(insight.insight_type || category);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedInsight(insight)}
                                            className={`group relative p-3 rounded-lg border bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] overflow-hidden border-l-4`}
                                            style={{ borderColor: `rgba(${theme.glow}, 0.6)` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full bg-${theme.color}-50 text-${theme.color}-600`}>
                                                    {theme.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-slate-800 truncate">{insight.title}</h4>
                                                    <p className="text-xs text-slate-500 truncate">{insight.message}</p>
                                                </div>
                                                <div className={`text-${theme.color}-500 text-xs font-medium px-2 py-0.5 bg-${theme.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                    View
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Render Deep Dive items generically if in deep slide */}
                            {currentSlide === 1 && insights.filter(i => i.insight_type?.includes('deep')).map((insight, idx) => {
                                const theme = getTheme(insight.insight_type || 'deep');
                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div
                                            onClick={() => setSelectedInsight(insight)}
                                            className={`group relative p-3 rounded-lg border-l-4 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01]`}
                                            style={{ borderColor: `rgba(${theme.glow}, 0.6)` }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full bg-${theme.color}-50 text-${theme.color}-600`}>
                                                    {theme.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{insight.title}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-2">{insight.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card >

            {/* Glowing Detailed Popup Modal */}
            {
                selectedInsight && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedInsight(null)}>
                        <div
                            className="bg-white rounded-2xl p-0 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                            style={{
                                boxShadow: `0 0 40px -10px rgba(${getTheme(selectedInsight.insight_type || category).glow}, 0.6)`
                            }}
                        >
                            {/* Header with Color and Glow */}
                            <div className={`p-6 pb-8 bg-gradient-to-br from-${getTheme(selectedInsight.insight_type || category).color}-50 to-white relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                                    <div className={`w-32 h-32 rounded-full bg-${getTheme(selectedInsight.insight_type || category).color}-400 blur-2xl`}></div>
                                </div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className={`p-3 rounded-2xl bg-white shadow-lg mb-4 text-${getTheme(selectedInsight.insight_type || category).color}-600 ring-4 ring-${getTheme(selectedInsight.insight_type || category).color}-50`}>
                                        {React.cloneElement(getTheme(selectedInsight.insight_type || category).icon as React.ReactElement, { className: "h-8 w-8" })}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedInsight.title}</h3>
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-${getTheme(selectedInsight.insight_type || category).color}-100 text-${getTheme(selectedInsight.insight_type || category).color}-700`}>
                                        {selectedInsight.severity} Priority
                                    </div>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-6 pt-2 space-y-4">
                                <p className="text-slate-600 leading-relaxed text-center">
                                    {selectedInsight.message}
                                </p>

                                {selectedInsight.actionable_item && (
                                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                                        <div className="mt-0.5 text-yellow-500"><LightbulbRegular fontSize={16} /></div>
                                        <div className="text-sm">
                                            <span className="block font-semibold text-slate-800 mb-0.5">Recommendation</span>
                                            <span className="text-slate-600">{selectedInsight.actionable_item}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div className="pt-4 flex justify-center">
                                    <button
                                        onClick={() => setSelectedInsight(null)}
                                        className={`px-8 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-${getTheme(selectedInsight.insight_type || category).color}-500/30 hover:shadow-${getTheme(selectedInsight.insight_type || category).color}-500/50 hover:-translate-y-0.5 transition-all bg-gradient-to-r from-${getTheme(selectedInsight.insight_type || category).color}-600 to-${getTheme(selectedInsight.insight_type || category).color}-500`}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

