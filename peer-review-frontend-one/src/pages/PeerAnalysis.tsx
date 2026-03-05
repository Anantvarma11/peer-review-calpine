import { EnergyPeerHeatmap } from "@/components/charts/EnergyPeerHeatmap";
import { PeerComparisonChart } from "@/components/charts/PeerComparisonChart";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import EnhancedKPISection, { peerKPIs } from "@/components/charts/EnhancedKPIs";

interface PeerAnalysisProps {
    summary?: any;
    customerId?: string;
    loading?: boolean;
}

export default function PeerAnalysis({ summary, customerId, loading }: PeerAnalysisProps) {
    if (loading || !summary) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="mx-auto max-w-[1400px] w-full space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Peer Analysis</h1>
                <p className="text-sm text-slate-500">Compare your energy consumption patterns against similar households in your region.</p>
            </div>

            {/* Enhanced Peer KPI Overview */}
            <EnhancedKPISection kpis={peerKPIs} />

            {/* Annual Performance Heatmap */}
            <EnergyPeerHeatmap customerId={customerId} hideTrendLine />

            {/* ZIP Performance - Peer Comparison */}
            <PeerComparisonChart customerId={customerId} />
        </div>
    )
}
