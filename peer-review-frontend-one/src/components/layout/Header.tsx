import { Bell, Settings, LayoutDashboard, Activity, Users, CloudRain, Lightbulb, Scale, HelpCircle } from "lucide-react"
import { CustomerSelector } from "@/components/ui/CustomerSelector"
import { useLocation } from "react-router-dom"

interface HeaderProps {
    selectedId: string;
    onCustomerChange: (id: string) => void;
    customerList?: { id: string, name: string }[];
    onFilterChange: (hasData: boolean) => void;
    hasRecentData: boolean;
    onSearch?: (term: string) => void;
}

export function Header({ selectedId, onCustomerChange, customerList = [], onFilterChange, hasRecentData, onSearch = () => { } }: HeaderProps) {
    const location = useLocation();

    const getPageContext = () => {
        const path = location.pathname;
        if (path.includes('dashboard')) return { title: 'Energy Dashboard', icon: <LayoutDashboard className="h-6 w-6" /> };
        if (path.includes('usage')) return { title: 'My Usage', icon: <Activity className="h-6 w-6" /> };
        if (path.includes('peer')) return { title: 'Peer Analysis', icon: <Users className="h-6 w-6" /> };
        if (path.includes('weather')) return { title: 'Weather Impact', icon: <CloudRain className="h-6 w-6" /> };
        if (path.includes('recommendation')) return { title: 'Plan Recommendations', icon: <Lightbulb className="h-6 w-6" /> };
        if (path.includes('compare-plans')) return { title: 'Compare Plans', icon: <Scale className="h-6 w-6" /> };
        if (path.includes('support')) return { title: 'Support Context', icon: <HelpCircle className="h-6 w-6" /> };
        return { title: 'Energy Intelligence', icon: <LayoutDashboard className="h-6 w-6" /> };
    };

    const { title, icon } = getPageContext();

    return (
        <header className="h-16 border-b border-[var(--border-subtle)] bg-transparent px-6 flex items-center justify-between sticky top-0 z-10 gap-x-4">

            {/* Left Side: Page Title & Icon */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center p-2 bg-[var(--bg-surface-1)] rounded-lg text-indigo-600 shadow-sm border border-[var(--border-subtle)]">
                    {icon}
                </div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{title}</h1>
            </div>

            {/* Right Side: Customer Selector, Notifications, Settings */}
            <div className="flex items-center space-x-2 shrink-0">
                <div className="flex items-center pr-4 mr-2 border-r border-slate-200">
                    <CustomerSelector
                        selectedId={selectedId}
                        onCustomerChange={onCustomerChange}
                        customerList={customerList}
                        isLoading={customerList.length === 0}
                        onSearch={onSearch}
                        onFilterChange={onFilterChange}
                        hasRecentData={hasRecentData}
                    />
                </div>

                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="h-5 w-5" />
                </button>
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <Settings className="h-5 w-5" />
                </button>
            </div>
        </header>
    )
}
