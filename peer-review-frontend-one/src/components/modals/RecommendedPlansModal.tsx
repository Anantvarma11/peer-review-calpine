

import { Check, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Since I haven't confirmed a shared Dialog component exists (AIInsightsPanel used custom), 
// and I didn't see one in components/ui list (only Card, Button), I will create a self-contained one 
// or simpler, I'll use the same custom overlay pattern if a library isn't available.
// BUT, I should check if I can just make a nice simple modal component.
// For now, I'll assume I need to build the modal structure myself if I don't find one.
// Wait, I saw components/ui/Card.tsx. I'll stick to the custom overlay pattern for consistency with AIInsightsPanel 
// unless I see a Dialog in the file list I missed. I missed nothing, only Card and Button.

// Mock Data for the modal (aligned with RecommendationPage)
const RECOMMENDED_PLAN = {
    name: "Reliant Conservation 24",
    provider: "Reliant",
    rate: "12.4¢",
    term: "24 months",
    savings: "$450",
    match: "98%",
    features: ["100% Renewable", "Free Nights", "Paperless Discount"]
};

interface RecommendedPlansModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RecommendedPlansModal({ isOpen, onClose }: RecommendedPlansModalProps) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Your Perfect Energy Match</h2>
                            <p className="text-indigo-100 text-sm">Based on your usage history and efficiency score</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap className="h-48 w-48 text-white transform rotate-12" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-slate-50">
                    <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-sm overflow-hidden relative">
                        {/* Best Badge */}
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            Top Recommendation
                        </div>

                        <div className="p-6 md:flex gap-6 items-center">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                                        R
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{RECOMMENDED_PLAN.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span>{RECOMMENDED_PLAN.provider}</span>
                                            <span>•</span>
                                            <span>{RECOMMENDED_PLAN.term}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {RECOMMENDED_PLAN.features.map((feat, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                            <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                            {feat}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-6 md:mt-0 flex flex-col gap-4 min-w-[140px]">
                                <div className="text-center p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                                    <p className="text-xs text-indigo-600 font-semibold uppercase">Est. Annual Savings</p>
                                    <p className="text-2xl font-bold text-indigo-700">{RECOMMENDED_PLAN.savings}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-slate-800">{RECOMMENDED_PLAN.rate}</p>
                                    <p className="text-xs text-slate-500">per kWh</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={() => {
                                navigate('/recommendation');
                                onClose();
                            }}
                            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
                        >
                            View Full Analysis <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Since I need to create the file first then reference it, I'll name it simply.
// I will place it in components/modals/RecommendedPlansModal.tsx
