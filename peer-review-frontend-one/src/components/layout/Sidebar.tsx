import { Home, BarChart3, Users, TrendingUp, Zap, GitCompareArrows, LifeBuoy, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "react-router-dom"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const navGroups = [
        {
            title: "Insights",
            items: [
                { name: "Home", icon: Home, path: "/" },
                { name: "My Usage", icon: BarChart3, path: "/usage" },
                { name: "Peer Analysis", icon: Users, path: "/peer" },
                { name: "Weather Impact", icon: TrendingUp, path: "/weather-2" },
                { name: "Map", icon: TrendingUp, path: "/weather" },
            ]
        },
        {
            title: "Actions",
            items: [
                { name: "Manage Plan", icon: Settings, path: "/manage-plan" },
                { name: "Recommendations", icon: Zap, path: "/recommendation" },
                { name: "Compare Plans", icon: GitCompareArrows, path: "/compare-plans" },
            ]
        },
        {
            title: "Support",
            items: [
                { name: "Support", icon: LifeBuoy, path: "/support" },
            ]
        }
    ]

    return (
        <>
            <div className={cn("pb-12 w-64 border-r border-slate-200 min-h-screen bg-white hidden md:block", className)}>
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <div className="flex items-center justify-between px-4 mb-8">
                            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                                {/* Logo placeholder */}
                                <div className="h-8 w-8 bg-blue-600 rounded mr-2 flex items-center justify-center text-white font-bold">
                                    EI
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                                    Energy<br />Intelligence
                                </h1>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {navGroups.map((group) => (
                                <div key={group.title} className="space-y-1">
                                    <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        {group.title}
                                    </h3>
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <button
                                                key={item.name}
                                                onClick={() => navigate(item.path)}
                                                className={cn(
                                                    "w-full flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100",
                                                    isActive ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "text-slate-600 hover:text-slate-900"
                                                )}
                                            >
                                                <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")} />
                                                {item.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
