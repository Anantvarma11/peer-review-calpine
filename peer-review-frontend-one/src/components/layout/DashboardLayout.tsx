import { LeftNav } from "../../lib/do-library/components/layout/LeftNav.tsx"
import { RightSection } from "../../lib/do-library/components/layout/RightSection.tsx"
import { Header } from "./Header"

interface DashboardLayoutProps {
    children: React.ReactNode;
    selectedId?: string;
    onCustomerChange?: (id: string) => void;
    customerList?: { id: string, name: string }[];
    onSearch?: (term: string) => void;
    onFilterChange: (hasData: boolean) => void;
    hasRecentData: boolean;
}

export function DashboardLayout({ children, selectedId = "983241", onCustomerChange = () => { }, customerList = [], onSearch, onFilterChange, hasRecentData }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen bg-[var(--bg-surface-3)] overflow-hidden">
            <LeftNav />
            <RightSection
                header={
                    <Header
                        selectedId={selectedId}
                        onCustomerChange={onCustomerChange}
                        customerList={customerList}
                        onSearch={onSearch}
                        onFilterChange={onFilterChange}
                        hasRecentData={hasRecentData}
                    />
                }
            >
                <div className="max-w-[1440px] mx-auto px-6 py-4">
                    {children}
                </div>
            </RightSection>
        </div>
    )
}
