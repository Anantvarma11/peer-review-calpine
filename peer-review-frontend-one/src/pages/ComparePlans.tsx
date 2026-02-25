import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { getDetailedRecommendation } from "@/lib/api";
import { PlanComparisonChart } from "@/components/charts/PlanComparisonChart";
import {
    ArrowLeft, CheckCircle2, XCircle, Star, Shield, Leaf, Zap,
    TrendingDown, BarChart3, Clock, Sparkles, Award, Check, X,
    Info, ChevronDown, ChevronUp, Sun, MapPin, Gauge
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
    cost_curve?: Record<number, number>;
}

interface ComparePlansProps {
    customerId?: string;
}

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

const tagColors: Record<string, string> = {
    "Cheapest": "bg-emerald-100 text-emerald-700",
    "EV Friendly": "bg-amber-100 text-amber-700",
    "Stable": "bg-blue-100 text-blue-700",
    "Balanced": "bg-slate-100 text-slate-700",
    "Greenest": "bg-green-100 text-green-700",
    "Green": "bg-green-100 text-green-700",
    "Solar": "bg-yellow-100 text-yellow-700",
    "Flexible": "bg-purple-100 text-purple-700",
    "No Contract": "bg-teal-100 text-teal-700",
    "Smart": "bg-indigo-100 text-indigo-700",
};

const featureLabels: Record<string, { label: string; icon: typeof Zap }> = {
    rate_type: { label: "Rate Type", icon: BarChart3 },
    contract_months: { label: "Contract Length", icon: Clock },
    cancellation_fee: { label: "Cancellation Fee", icon: Shield },
    renewable_pct: { label: "Renewable Energy", icon: Leaf },
    best_for: { label: "Best For", icon: Star },
    smart_thermostat_discount: { label: "Smart Thermostat Discount", icon: Sparkles },
    autopay_discount: { label: "Autopay Discount", icon: CheckCircle2 },
    usage_credits: { label: "Usage Credits", icon: Award },
};

const ComparePlans = ({ customerId = "983241" }: ComparePlansProps) => {
    const navigate = useNavigate();
    const [rawPlans, setRawPlans] = useState<PlanFeatureDetail[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    // Filters
    const [solarEnabled, setSolarEnabled] = useState(false);
    const [filterZip, setFilterZip] = useState("77001");
    const [filterUsage, setFilterUsage] = useState(12000); // Annual kWh
    const [showTop5, setShowTop5] = useState(true);

    useEffect(() => {
        setLoading(true);
        getDetailedRecommendation(customerId)
            .then((res: any) => {
                setRawPlans(res.all_plans || []);

                // Check solar status
                const hasSolar = res.has_solar || false;
                if (hasSolar) setSolarEnabled(true);

                // Default selection logic handled in useEffect below to react to solarEnabled
                if (!selectedIds.length) {
                    const defaultSelected = (res.all_plans || []).slice(0, 3).map((p: any) => p.plan_id);
                    setSelectedIds(defaultSelected);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [customerId]);

    // Helper to get cost at specific usage
    const getEstimatedCost = (plan: PlanFeatureDetail, usage: number) => {
        if (!plan.cost_curve) return plan.annual_cost; // Fallback

        const points = Object.keys(plan.cost_curve).map(Number).sort((a, b) => a - b);
        if (points.includes(usage)) return plan.cost_curve[usage];

        // Linear Interpolation
        // Find lower and upper bounds
        let lower = points[0];
        let upper = points[points.length - 1];

        for (let i = 0; i < points.length; i++) {
            if (points[i] <= usage) lower = points[i];
            if (points[i] > usage) {
                upper = points[i];
                break;
            }
        }

        if (lower === upper) return plan.cost_curve[lower];

        const costLower = plan.cost_curve[lower];
        const costUpper = plan.cost_curve[upper];

        const ratio = (usage - lower) / (upper - lower);
        return costLower + (costUpper - costLower) * ratio;
    };

    // Process & Filter Plans
    const visiblePlans = useMemo(() => {
        let processed = [...rawPlans];

        // 1. Calculate dynamic cost based on filterUsage
        //    And attach it temporarily for sorting
        processed = processed.map(p => {
            // Hack: we don't want to mutate p.annual_cost permenantly for display unless we want "Est. Cost" to update
            // The user request implies "highlighting why we suggested the best plan". 
            // Updating the displayed cost to match the slider makes sense.
            const dynamicCost = getEstimatedCost(p, filterUsage);
            return { ...p, annual_cost: dynamicCost };
        });

        // 2. Sort by Cost (Cheapest First)
        processed.sort((a, b) => a.annual_cost - b.annual_cost);

        // 3. Solar Priority (Optional, keeping existing logic if desired, or just simple sort)
        if (solarEnabled) {
            processed.sort((a, b) => {
                const aSolar = a.tags.includes("Solar");
                const bSolar = b.tags.includes("Solar");
                if (aSolar && !bSolar) return -1;
                if (!aSolar && bSolar) return 1;
                return a.annual_cost - b.annual_cost; // Secondary sort
            });
        }

        // 4. Top 5 Limit
        if (showTop5) {
            processed = processed.slice(0, 5);
        }

        return processed;
    }, [rawPlans, filterUsage, solarEnabled, showTop5]);

    // Handle initial selection when plans load or top 5 changes
    useEffect(() => {
        if (visiblePlans.length > 0) {
            // Select top 3 of the *visible* plans by default if nothing selected
            // Or if sorting changed drastically, maybe we want to keep selection?
            // Let's keep selection if it exists in visible, otherwise re-select top 3
            const visibleIds = visiblePlans.map(p => p.plan_id);
            const stillValidDivs = selectedIds.filter(id => visibleIds.includes(id));

            if (stillValidDivs.length === 0) {
                setSelectedIds(visibleIds.slice(0, 3));
            }
        }
    }, [visiblePlans]);

    const togglePlan = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.length > 1 ? prev.filter(x => x !== id) : prev; // minimum 1
            }
            if (prev.length >= 4) return prev; // max 4
            return [...prev, id];
        });
    };

    const selectedPlans = visiblePlans.filter(p => selectedIds.includes(p.plan_id));
    // Sort selected plans to match visiblePlans order (Rank 1, 2, 3...)
    selectedPlans.sort((a, b) => visiblePlans.indexOf(a) - visiblePlans.indexOf(b));

    const maxCost = Math.max(...visiblePlans.map(p => p.annual_cost), 1);
    const bestPlanId = visiblePlans[0]?.plan_id;

    const featureKeys = showAllFeatures
        ? Object.keys(featureLabels)
        : ["rate_type", "contract_months", "cancellation_fee", "renewable_pct", "best_for"];

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-10 w-64 bg-slate-200 rounded-lg" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl" />)}
                </div>
                <div className="h-96 bg-slate-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/recommendation')}
                        className="text-slate-500 hover:text-slate-700 p-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            Compare Plans
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Find the best plan for your specific usage profile
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== FILTER BAR ===== */}
            <Card className="border shadow-sm bg-white">
                <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                        {/* Location */}
                        <div className="flex flex-col gap-2 w-full lg:w-auto min-w-[200px]">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                Location (Zip)
                            </label>
                            <Input
                                value={filterZip}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterZip(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Usage Slider */}
                        <div className="flex flex-col gap-3 w-full max-w-md">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Gauge className="h-4 w-4 text-slate-500" />
                                    Annual Usage
                                </label>
                                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    {filterUsage.toLocaleString()} kWh
                                </span>
                            </div>
                            <Slider
                                value={[filterUsage]}
                                min={500}
                                max={20000}
                                step={500}
                                onValueChange={(val: number[]) => setFilterUsage(val[0])}
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Low (500)</span>
                                <span>High (20k)</span>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center gap-6 lg:ml-auto">
                            <div className="flex items-center gap-2">
                                <Switch checked={showTop5} onCheckedChange={setShowTop5} />
                                <label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={() => setShowTop5(!showTop5)}>
                                    Champions Only (Top 5)
                                </label>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden lg:block" />
                            <div className="flex items-center gap-2">
                                <Switch checked={solarEnabled} onCheckedChange={setSolarEnabled} />
                                <label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={() => setSolarEnabled(!solarEnabled)}>
                                    Solar Plans
                                </label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* ===== PLAN SELECTION GRID ===== */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">Available Plans</h2>
                        <span className="text-sm text-slate-500">{visiblePlans.length} plans match criteria</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-3">
                        {visiblePlans.map(plan => {
                            const isSelected = selectedIds.includes(plan.plan_id);
                            const isBest = plan.plan_id === bestPlanId;
                            return (
                                <button
                                    key={plan.plan_id}
                                    onClick={() => togglePlan(plan.plan_id)}
                                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 ${isSelected
                                        ? isBest
                                            ? "border-emerald-400 bg-emerald-50/50 shadow-lg shadow-emerald-100"
                                            : "border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-100"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                                        }`}
                                >
                                    {isBest && (
                                        <span className="absolute -top-2.5 left-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 rounded-full z-10">
                                            Champion
                                        </span>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {plan.plan_name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{plan.description}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                            ? isBest ? "bg-emerald-500 border-emerald-500" : "bg-indigo-500 border-indigo-500"
                                            : "border-slate-300"
                                            }`}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-end gap-2">
                                        <span className="text-lg font-bold text-slate-800">${(plan.annual_cost / 12).toFixed(0)}</span>
                                        <span className="text-xs text-slate-400 pb-0.5">/mo</span>
                                    </div>
                                    <div className="mt-1 text-[10px] text-slate-400">
                                        est. based on {filterUsage.toLocaleString()} kWh
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {plan.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tagColors[tag] || 'bg-slate-100 text-slate-600'}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ===== COST CURVE CHART ===== */}
                <div className="space-y-4">
                    <PlanComparisonChart plans={selectedPlans} highlightBest={true} />
                </div>
            </div>

            {/* ===== COST COMPARISON VISUAL ===== */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-emerald-500" />
                        Annual Cost Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {selectedPlans.map((plan, idx) => {
                            const isBest = plan.plan_id === bestPlanId;
                            const pct = (plan.annual_cost / maxCost) * 100;
                            const barColors = isBest
                                ? "from-emerald-400 to-teal-500"
                                : idx === 1 ? "from-indigo-400 to-blue-500"
                                    : idx === 2 ? "from-violet-400 to-purple-500"
                                        : "from-amber-400 to-orange-500";
                            return (
                                <div key={plan.plan_id} className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-800">{plan.plan_name}</span>
                                            {isBest && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                    RECOMMENDED
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-slate-800">${plan.annual_cost.toLocaleString()}</span>
                                            <span className="text-xs text-slate-400 ml-1">/yr</span>
                                            {plan.annual_savings > 0 && (
                                                <span className="text-xs font-medium text-emerald-600 ml-2">
                                                    (saves ${plan.annual_savings.toLocaleString()})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${barColors} rounded-lg transition-all duration-700 flex items-center justify-end pr-3`}
                                            style={{ width: `${pct}%` }}
                                        >
                                            <span className="text-xs font-semibold text-white/90">
                                                ${(plan.annual_cost / 12).toFixed(0)}/mo
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ===== FEATURE COMPARISON MATRIX ===== */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        Feature Comparison
                    </CardTitle>
                    <Button
                        variant="ghost"
                        onClick={() => setShowAllFeatures(!showAllFeatures)}
                        className="text-sm text-indigo-600 hover:bg-indigo-50"
                    >
                        {showAllFeatures ? "Show Less" : "Show All Features"}
                        {showAllFeatures ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 w-48">Feature</th>
                                {selectedPlans.map(plan => (
                                    <th key={plan.plan_id} className="text-center py-3 px-4 min-w-[160px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-semibold text-slate-800">{plan.plan_name}</span>
                                            {plan.plan_id === bestPlanId && (
                                                <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
                                                    BEST
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Score Row */}
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <td className="py-3 px-4 text-sm font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-amber-500" />
                                        Match Score
                                    </div>
                                </td>
                                {selectedPlans.map(plan => (
                                    <td key={plan.plan_id} className="py-3 px-4 text-center">
                                        <div className="inline-flex items-center gap-1.5">
                                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${plan.score >= 95 ? 'bg-emerald-500' : plan.score >= 90 ? 'bg-blue-500' : plan.score >= 85 ? 'bg-yellow-500' : 'bg-slate-400'}`}
                                                    style={{ width: `${plan.score}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{plan.score}</span>
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Monthly Cost Row */}
                            <tr className="border-b border-slate-100">
                                <td className="py-3 px-4 text-sm font-medium text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                                        Est. Monthly Cost
                                    </div>
                                </td>
                                {selectedPlans.map(plan => (
                                    <td key={plan.plan_id} className="py-3 px-4 text-center">
                                        <span className="text-lg font-bold text-slate-800">${(plan.annual_cost / 12).toFixed(0)}</span>
                                    </td>
                                ))}
                            </tr>

                            {/* Feature Rows */}
                            {featureKeys.map((key, i) => {
                                const { label, icon: FeatureIcon } = featureLabels[key] || { label: key, icon: Info };
                                return (
                                    <tr key={key} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                                        <td className="py-3 px-4 text-sm font-medium text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <FeatureIcon className="h-4 w-4 text-slate-400" />
                                                {label}
                                            </div>
                                        </td>
                                        {selectedPlans.map(plan => {
                                            const value = plan.features?.[key];
                                            let display: React.ReactNode;

                                            if (typeof value === "boolean") {
                                                display = value
                                                    ? <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                                                    : <X className="h-5 w-5 text-slate-300 mx-auto" />;
                                            } else if (key === "contract_months") {
                                                display = value === 0
                                                    ? <span className="text-sm font-medium text-emerald-600">No Contract</span>
                                                    : <span className="text-sm text-slate-700">{value} months</span>;
                                            } else if (key === "cancellation_fee") {
                                                display = value === 0
                                                    ? <span className="text-sm font-medium text-emerald-600">$0</span>
                                                    : <span className="text-sm text-slate-700">${value}</span>;
                                            } else if (key === "renewable_pct") {
                                                display = (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${value}%` }} />
                                                        </div>
                                                        <span className="text-xs text-slate-600">{value}%</span>
                                                    </div>
                                                );
                                            } else {
                                                display = <span className="text-sm text-slate-700">{String(value || "—")}</span>;
                                            }

                                            return (
                                                <td key={plan.plan_id} className="py-3 px-4 text-center">
                                                    {display}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* ===== PROS & CONS ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedPlans.map(plan => {
                    const isBest = plan.plan_id === bestPlanId;
                    return (
                        <Card
                            key={plan.plan_id}
                            className={`overflow-hidden ${isBest ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-100/50' : 'shadow-sm'}`}
                        >
                            <div className={`p-4 ${isBest ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-slate-700 to-slate-800'} text-white`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-base">{plan.plan_name}</h3>
                                        <p className="text-xs text-white/70 mt-0.5">{plan.description}</p>
                                    </div>
                                    {isBest && <Award className="h-5 w-5 text-amber-300 flex-shrink-0" />}
                                </div>
                                <div className="flex items-end gap-1 mt-3">
                                    <span className="text-2xl font-bold">${(plan.annual_cost / 12).toFixed(0)}</span>
                                    <span className="text-sm text-white/60 pb-0.5">/mo</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {plan.tags.map(tag => {
                                        const TagIcon = tagIcons[tag] || Star;
                                        return (
                                            <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-white/80">
                                                <TagIcon className="h-2.5 w-2.5" />
                                                {tag}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-emerald-600 mb-2 tracking-wider">Pros</h4>
                                    <div className="space-y-1.5">
                                        {plan.pros.map((pro, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-xs text-slate-700 leading-relaxed">{pro}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-red-500 mb-2 tracking-wider">Cons</h4>
                                    <div className="space-y-1.5">
                                        {plan.cons.map((con, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-xs text-slate-500 leading-relaxed">{con}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => alert(`Plan "${plan.plan_name}" selected! (Integration pending)`)}
                                    className={`w-full mt-2 text-sm ${isBest
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-200/50'
                                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                                        }`}
                                >
                                    {isBest ? "Switch to This Plan" : "Select Plan"}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ComparePlans;
