import { Skeleton } from "@/components/ui/Skeleton"


export const PeerAnalysisSkeleton = () => {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Context Card Skeleton */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="lg:col-span-2">
                    <div className="h-[400px] bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                        <Skeleton className="flex-1 rounded-lg" />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Skeleton className="h-[280px] rounded-2xl" /> {/* Cost Breakdown */}
                </div>
            </div>

            {/* Community Insights Skeleton */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                </div>
            </div>
        </div>
    )
}
