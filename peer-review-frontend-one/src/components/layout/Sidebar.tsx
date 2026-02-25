import { Home, BarChart3, Users, TrendingUp, Zap, GitCompareArrows, LifeBuoy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate } from "react-router-dom"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { name: "Home", icon: Home, path: "/" },
        { name: "My Usage", icon: BarChart3, path: "/usage" },
        { name: "Peer Analysis", icon: Users, path: "/peer" },
        { name: "Weather Impact", icon: TrendingUp, path: "/weather" },
        { name: "Recommendations", icon: Zap, path: "/recommendation" },
        { name: "Compare Plans", icon: GitCompareArrows, path: "/compare-plans" },
        { name: "Support", icon: LifeBuoy, path: "/support" },
    ]

    return (
        <>
            <div className={cn("pb-12 w-64 border-r border-slate-200 min-h-screen bg-white hidden md:block", className)}>
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <div className="flex items-center justify-between px-4 mb-8">
                            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                                {/* Logo placeholder */}
                                <div className="h-8 w-8 bg-primary-500 rounded mr-2 flex items-center justify-center text-white font-bold">
                                    EI
                                </div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                    Energy<br />Intelligence
                                </h2>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={cn(
                                            "w-full flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100",
                                            isActive ? "bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-800" : "text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
