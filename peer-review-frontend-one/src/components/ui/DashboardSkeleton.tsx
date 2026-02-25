import { Skeleton } from "@/components/ui/Skeleton"
import { Card, CardContent } from "@/components/ui/Card"

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40 rounded-lg" />
            </div>

            {/* Top Stats Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-white border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 wide) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Chart */}
                    <div className="h-[400px] bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-32" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20 rounded-md" />
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="flex-1 rounded-lg" />
                    </div>

                    {/* Secondary Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-[300px] rounded-2xl" />
                        <Skeleton className="h-[300px] rounded-2xl" />
                    </div>

                    {/* 3D Chart Skeleton */}
                    <Skeleton className="h-[350px] rounded-2xl" />

                    {/* Map Skeleton */}
                    <Skeleton className="h-[350px] rounded-2xl" />
                </div>

                {/* Right Column (1 wide) */}
                <div className="space-y-6">
                    <Skeleton className="h-[280px] rounded-2xl" /> {/* Cost Breakdown Card */}
                    <Skeleton className="h-[400px] rounded-2xl" /> {/* AI Insights */}
                    <Skeleton className="h-[300px] rounded-2xl" /> {/* Heatmap */}
                </div>
            </div>
        </div>
    )
}
