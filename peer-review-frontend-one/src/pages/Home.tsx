import { useState } from 'react';
import { EnergyPeerHeatmap } from "@/components/charts/EnergyPeerHeatmap"
import { UsageKPIs } from '@/components/charts/UsageKPIs';
import { TopOverviewCharts } from '@/components/charts/TopOverviewCharts';

import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';

import { RecommendedPlansModal } from '@/components/modals/RecommendedPlansModal';



interface HomeProps {
    summary: any;
    loading: boolean;
    customerId: string;
}

export default function Home({ summary, loading, customerId }: HomeProps) {
    const [isRecModalOpen, setIsRecModalOpen] = useState(false);


    if (loading || !summary) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-3">






            {/* Usage KPI Cards */}
            <UsageKPIs customerId={customerId} />

            {/* Top Overview Charts (Consumption Drill-down) */}
            <TopOverviewCharts customerId={customerId} isMyUsagePage={true} />


            {/* Usage History (Annual bars) + Sidebar */}
            <div className="mt-4">
                <EnergyPeerHeatmap hideTabs hideHeatmap isMyUsagePage customerId={customerId} />
            </div>

            {/* Modals */}
            <RecommendedPlansModal
                isOpen={isRecModalOpen}
                onClose={() => setIsRecModalOpen(false)}
            />
        </div>
    );
}
