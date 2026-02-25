import { IntelligenceMap } from "@/components/maps/IntelligenceMap"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { FlashRegular, BuildingFactoryRegular } from '@fluentui/react-icons';

export default function MapView() {
    const [activeMap, setActiveMap] = useState<'intelligence' | 'outage' | 'grid'>('intelligence');

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Geospatial Intelligence</h1>
                    <p className="text-slate-500">Interactive maps for usage, outages, and grid status.</p>
                </div>
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button
                        onClick={() => setActiveMap('intelligence')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeMap === 'intelligence' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900")}
                    >
                        Intelligence
                    </button>
                    <button
                        onClick={() => setActiveMap('outage')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeMap === 'outage' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900")}
                    >
                        Outages
                    </button>
                    <button
                        onClick={() => setActiveMap('grid')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeMap === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900")}
                    >
                        Grid Load
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                {activeMap === 'intelligence' && (
                    <div className="w-full h-full">
                        {/* We stretch the IntelligenceMap to fit */}
                        <div className="h-full w-full [&>div]:h-full [&>div>div]:h-full">
                            <IntelligenceMap />
                        </div>
                    </div>
                )}

                {activeMap === 'outage' && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                            <FlashRegular className="text-4xl text-amber-500" />
                            <h3 className="text-xl font-bold text-slate-800 mt-4">Outage Map</h3>
                            <p className="text-slate-500">Real-time outage tracking active.</p>
                            <p className="text-xs text-slate-400 mt-2">(Simulated View)</p>
                        </div>
                    </div>
                )}

                {activeMap === 'grid' && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                            <BuildingFactoryRegular className="text-4xl text-slate-500" />
                            <h3 className="text-xl font-bold text-slate-800 mt-4">Grid Load Map</h3>
                            <p className="text-slate-500">Regional grid capacity and demand.</p>
                            <p className="text-xs text-slate-400 mt-2">(Simulated View)</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
