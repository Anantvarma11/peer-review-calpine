import { EnergyPeerHeatmap } from "@/components/charts/EnergyPeerHeatmap"
import { UsageKPIs } from "@/components/charts/UsageKPIs"

export default function MyUsage() {
    return (
        <div className="space-y-3">
            <UsageKPIs />
            <EnergyPeerHeatmap hideTabs hideHeatmap isMyUsagePage />
        </div>
    )
}
