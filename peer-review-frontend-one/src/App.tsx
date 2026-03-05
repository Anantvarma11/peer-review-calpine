import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from "@/pages/Login"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { SupportHub } from "@/components/chat/SupportHub"
import { AIResponseOverlay } from "@/components/ai/AIResponseOverlay"
import { getDashboardSummary, getCustomerList } from "@/lib/api"
import { Loader2 } from 'lucide-react'

// Lazy Load Pages
const Home = lazy(() => import("@/pages/Home"))
const PeerAnalysis = lazy(() => import("@/pages/PeerAnalysis"))
const WeatherImpact = lazy(() => import("@/pages/WeatherImpact"))
const WeatherImpact2 = lazy(() => import("@/pages/WeatherImpact2"))

const ComparePlans = lazy(() => import("@/pages/ComparePlans"))
const ManagePlan = lazy(() => import("@/pages/ManagePlan"))
const AskPage = lazy(() => import("@/pages/AskPage"))
const SupportPage = lazy(() => import("@/pages/SupportPage"))

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [customerId, setCustomerId] = useState<string>("");
    const [customerList, setCustomerList] = useState<{ id: string, name: string }[]>([]);
    const [hasRecentData, setHasRecentData] = useState(false);

    const loadCustomers = (search?: string) => {
        getCustomerList(search, hasRecentData).then(users => {
            setCustomerList(users);
            // Set default to first real user if not set and no search active (to avoid jumping around)
            if (users.length > 0 && !customerId && !search) {
                setCustomerId(users[0].id);
            }
        }).catch(err => console.error("Failed to load users", err));
    }

    useEffect(() => {
        // Reload customers when filter changes
        loadCustomers();
    }, [hasRecentData]);

    useEffect(() => {
        // Fetch users on load (or after auth)
        if (isAuthenticated) {
            loadCustomers();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && customerId) {
            setLoading(true);
            getDashboardSummary(customerId)
                .then(data => setSummary(data))
                .catch(err => console.error("Summary fetch failed", err))
                .finally(() => setLoading(false));
        }
    }, [isAuthenticated, customerId]);

    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <Router>
            <DashboardLayout
                selectedId={customerId}
                onCustomerChange={setCustomerId}
                customerList={customerList}
                onSearch={loadCustomers}
                onFilterChange={setHasRecentData}
                hasRecentData={hasRecentData}
            >
                <Suspense fallback={
                    <div className="flex h-[50vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Home summary={summary} loading={loading} customerId={customerId} />} />
                        <Route path="/usage" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/peer" element={<PeerAnalysis summary={summary} loading={loading} customerId={customerId} />} />
                        <Route path="/weather" element={<WeatherImpact customerId={customerId} summary={summary} />} />
                        <Route path="/weather-2" element={<WeatherImpact2 customerId={customerId} />} />

                        <Route path="/compare-plans" element={<ComparePlans customerId={customerId} />} />
                        <Route path="/manage-plan" element={<ManagePlan customerId={customerId} />} />
                        <Route path="/ask" element={<AskPage />} />
                        <Route path="/support" element={<SupportPage customerId={customerId} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </DashboardLayout>

            <SupportHub customerId={customerId} />
            <AIResponseOverlay />
        </Router>
    )
}

export default App
