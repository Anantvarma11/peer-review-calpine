import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { getDetailedRecommendation } from "@/lib/api";
import {
    Zap, TrendingDown, Lightbulb, ArrowRight, Star, Shield,
    Leaf, Clock, ChevronRight, Sparkles, BarChart3, Target,
    CheckCircle2, XCircle, Award, GitCompareArrows, Sun
} from "lucide-react";

interface PlanFeatureDetail {
    plan_id: string;
    plan_name: string;
    description: string;
    tags: string[];
    annual_cost: number;
    annual_savings: number;
    score: number;
    features: Record<string, any>;
    rates: Record<string, any>;
    pros: string[];
    cons: string[];
    reason?: string;
}

interface AIInsight {
    icon: string;
    title: string;
    description: string;
    category: string;
    priority: number;
}

interface SavingsProjection {
    month: string;
    current_plan_cost: number;
    best_plan_cost: number;
    savings: number;
}

interface DetailedRecommendationData {
    customer_id: string;
    best_plan: PlanFeatureDetail;
    all_plans: PlanFeatureDetail[];
    ai_insights: AIInsight[];
    savings_projections: SavingsProjection[];
    usage_pattern: Record<string, any>;
    has_solar: boolean; // Added
    explanation?: string;
}

interface RecommendationPageProps {
    customerId?: string;
}

const categoryColors: Record<string, { bg: string; border: string; icon: string }> = {
    savings: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    usage: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    seasonal: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    behavioral: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
};

const tagIcons: Record<string, typeof Zap> = {
    "Cheapest": TrendingDown,
    "EV Friendly": Zap,
    "Stable": Shield,
    "Balanced": BarChart3,
    "Greenest": Leaf,
    "Green": Leaf,
    "Solar": Sun,
    "Flexible": Clock,
    "No Contract": CheckCircle2,
    "Smart": Sparkles,
};

const RecommendationPage = ({ customerId = "983241" }: RecommendationPageProps) => {
    const navigate = useNavigate();
    const [data, setData] = useState<DetailedRecommendationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [animatedSavings, setAnimatedSavings] = useState(0);
    const [solarEnabled, setSolarEnabled] = useState(false);

    useEffect(() => {
        setLoading(true);
        getDetailedRecommendation(customerId)
            .then(res => {
                setData(res);
                setError(null);
                // Auto-enable solar if customer has solar
                if (res.has_solar) {
                    setSolarEnabled(true);
                }
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load recommendations.");
            })
            .finally(() => setLoading(false));
    }, [customerId]);

    // Determine displayed plans based on toggle
    const solarPlan = data?.all_plans?.find(p => p.tags.includes("Solar"));
    const best_plan = (solarEnabled && solarPlan) ? solarPlan : (data?.best_plan || null);

    // Filter alternatives
    const displayedAlternatives = (data?.all_plans || [])
        .filter(p => p.plan_id !== best_plan?.plan_id)
        .filter(p => solarEnabled ? true : !p.tags.includes("Solar"))
        .sort((a, b) => {
            if (solarEnabled) {
                const aGreen = a.tags.includes("Green") || a.tags.includes("Greenest");
                const bGreen = b.tags.includes("Green") || b.tags.includes("Greenest");
                if (aGreen && !bGreen) return -1;
                if (!aGreen && bGreen) return 1;
            }
            return a.annual_cost - b.annual_cost;
        })
        .slice(0, 3);

    // Animated savings counter
    useEffect(() => {
        if (!best_plan) return;
        const target = best_plan.annual_savings;
        const duration = 1500;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setAnimatedSavings(target);
                clearInterval(timer);
            } else {
                setAnimatedSavings(Math.round(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [best_plan]);

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-10 w-80 bg-slate-200 rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 bg-slate-100 rounded-2xl" />
                    <div className="h-64 bg-slate-100 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (error || !data || !best_plan) {
        return (
            <div className="p-6 flex items-center justify-center h-96">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load</h3>
                        <p className="text-slate-500">{error || "Something went wrong."}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { ai_insights, savings_projections, usage_pattern } = data;
    const maxProjectionCost = Math.max(...savings_projections.map(p => p.current_plan_cost));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        AI-Powered Recommendations
                    </h1>
                    <p className="text-slate-500 mt-1">Personalized plan analysis based on your usage patterns</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Solar Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setSolarEnabled(false)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!solarEnabled ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setSolarEnabled(true)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${solarEnabled ? 'bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200' : 'text-slate-500 hover:text-amber-600'}`}
                        >
                            <Sun className="h-3.5 w-3.5" />
                            Solar
                        </button>
                    </div>

                    <Button
                        onClick={() => navigate('/compare-plans')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                    >
                        <GitCompareArrows className="h-4 w-4" />
                        Compare All Plans
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ===== HERO SECTION: Best Plan + Score Ring ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Best Plan Card */}
                <Card className={`lg:col-span-2 overflow-hidden border-0 shadow-xl text-white relative transition-colors duration-500 ${solarEnabled ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900'}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full" />
                    <CardContent className="p-8 relative">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="h-5 w-5 text-amber-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                                        {solarEnabled ? 'Best Solar Plan' : 'Best Plan For You'}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold mb-1">{best_plan.plan_name}</h2>
                                <p className="text-slate-300 text-sm">{best_plan.description}</p>
                            </div>
                            {/* Confidence Score Ring */}
                            <div className="relative flex-shrink-0">
                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke="url(#scoreGradient)" strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(best_plan.score / 100) * 264} 264`}
                                        style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                                    />
                                    <defs>
                                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#34d399" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-2xl font-bold">{best_plan.score}</span>
                                        <span className="text-xs block text-slate-400">Score</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Savings Counter */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-xs text-slate-400 mb-1">Annual Savings</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    ${animatedSavings.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-xs text-slate-400 mb-1">Annual Cost</p>
                                <p className="text-2xl font-bold">${best_plan.annual_cost.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-xs text-slate-400 mb-1">Monthly Avg</p>
                                <p className="text-2xl font-bold">${(best_plan.annual_cost / 12).toFixed(0)}</p>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {best_plan.tags.map(tag => {
                                const TagIcon = tagIcons[tag] || Star;
                                return (
                                    <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/10">
                                        <TagIcon className="h-3 w-3" />
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>

                        {/* AI Explanation */}
                        {data.explanation && (
                            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                                <Sparkles className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-300 leading-relaxed">{data.explanation}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Usage Pattern Card */}
                <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <Target className="h-4 w-4 text-indigo-500" />
                            Your Usage Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Peak vs Off-Peak Donut */}
                        <div className="relative flex items-center justify-center">
                            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#6366f1" strokeWidth="12"
                                    strokeDasharray={`${(usage_pattern.peak_ratio / 100) * 239} 239`} strokeLinecap="round" />
                                <circle cx="50" cy="50" r="38" fill="none" stroke="#34d399" strokeWidth="12"
                                    strokeDasharray={`${(usage_pattern.offpeak_ratio / 100) * 239} 239`} strokeLinecap="round"
                                    strokeDashoffset={`-${(usage_pattern.peak_ratio / 100) * 239}`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-xl font-bold text-slate-800">{usage_pattern.estimated_monthly}</span>
                                    <span className="text-xs block text-slate-500">kWh/mo</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                    <span className="text-sm text-slate-600">Peak Usage</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{usage_pattern.peak_ratio}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-slate-600">Off-Peak Usage</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{usage_pattern.offpeak_ratio}%</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Total Annual</span>
                                    <span className="font-semibold text-slate-800">{usage_pattern.total_kwh?.toLocaleString()} kWh</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ===== AI INSIGHTS PANEL ===== */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h2 className="text-xl font-bold text-slate-900">AI-Powered Insights</h2>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{ai_insights.length} tips</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ai_insights.map((insight, idx) => {
                        const colors = categoryColors[insight.category] || categoryColors.savings;
                        return (
                            <Card key={idx} className={`border ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 mb-1">{insight.title}</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                                            <span className={`inline-block mt-2 text-xs font-medium capitalize px-2 py-0.5 rounded-full ${colors.bg} ${colors.icon}`}>
                                                {insight.category}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* ===== SAVINGS TIMELINE ===== */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-emerald-500" />
                        Monthly Savings Projection
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                        Current plan vs. {best_plan.plan_name} — estimated monthly savings
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {savings_projections.map((proj, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-xs font-medium text-slate-500 w-8">{proj.month}</span>
                                <div className="flex-1 relative">
                                    {/* Current plan bar */}
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-1">
                                        <div
                                            className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full transition-all duration-700"
                                            style={{ width: `${(proj.current_plan_cost / maxProjectionCost) * 100}%` }}
                                        />
                                    </div>
                                    {/* Best plan bar */}
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                                            style={{ width: `${(proj.best_plan_cost / maxProjectionCost) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right w-20">
                                    <span className="text-xs font-bold text-emerald-600">
                                        +${proj.savings.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center gap-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-2 rounded-full bg-gradient-to-r from-slate-300 to-slate-400" />
                                Current Plan
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                                {best_plan.plan_name}
                            </div>
                            <div className="ml-auto font-semibold text-emerald-600">
                                Total Savings: ${best_plan.annual_savings.toLocaleString()}/yr
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== ALTERNATIVE PLANS (Quick Compare) ===== */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-xl font-bold text-slate-900">Top Alternatives</h2>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/compare-plans')}
                        className="text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                        View All {(data?.all_plans || []).length} Plans <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedAlternatives.map((plan) => (
                        <Card key={plan.plan_id} className="border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                            onClick={() => navigate('/compare-plans')}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                            {plan.plan_name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-800">${(plan.annual_cost / 12).toFixed(0)}</p>
                                        <p className="text-xs text-slate-400">/month</p>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {plan.tags.map(tag => {
                                        const TagIcon = tagIcons[tag] || Star;
                                        return (
                                            <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                                <TagIcon className="h-3 w-3" />
                                                {tag}
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* Pros/Cons */}
                                <div className="space-y-1.5">
                                    {plan.pros.slice(0, 2).map((pro, i) => (
                                        <div key={i} className="flex items-start gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-600">{pro}</span>
                                        </div>
                                    ))}
                                    {plan.cons.slice(0, 1).map((con, i) => (
                                        <div key={i} className="flex items-start gap-1.5">
                                            <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-500">{con}</span>
                                        </div>
                                    ))}
                                </div>

                                {plan.annual_savings > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Annual savings</span>
                                        <span className="text-sm font-bold text-emerald-600">${plan.annual_savings.toLocaleString()}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecommendationPage;
