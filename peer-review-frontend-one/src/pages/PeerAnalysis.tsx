import { useEffect, useState } from 'react';
import { IntelligenceMap } from "@/components/maps/IntelligenceMap"
import { getCustomer, getWeatherForCity } from "@/lib/api"

interface PeerAnalysisProps {
    summary: any;
    loading?: boolean;
    customerId?: string;
}

interface Peer {
    id: string;
    zip: string;
    zone: string;
    areaSize: string;
    builtYear: number;
    avgUsage: string;
}

export default function PeerAnalysis({ summary, customerId }: PeerAnalysisProps) {
    const userUsage = summary?.current_kwh || 850;
    const peerAvgUsage = summary?.peer_avg_kwh || 988;

    const [avgTemp, setAvgTemp] = useState<number>(78);
    const [zipCode, setZipCode] = useState<string>("75001");
    const [selectedZone, setSelectedZone] = useState<string>("Zone A");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [peers, setPeers] = useState<Peer[]>([]);
    const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

    const handlePeersLoad = (mapPeers: any[]) => {
        const formattedPeers: Peer[] = mapPeers.map(p => ({
            id: String(p.id),
            zip: p.zip,
            zone: p.zone,
            areaSize: p.areaSize,
            builtYear: p.builtYear,
            avgUsage: `${p.usage} kWh`
        }));
        setPeers(formattedPeers);
    };

    useEffect(() => {
        if (!customerId) return;

        const fetchData = async () => {
            try {
                let city = "Houston";

                if (summary?.Service_City) {
                    city = summary.Service_City;
                    if (summary.SERVICE_ZIP) setZipCode(String(summary.SERVICE_ZIP));
                } else {
                    const customer = await getCustomer(customerId);
                    city = customer.Service_City || "Houston";
                    if (customer.SERVICE_ZIP) {
                        setZipCode(String(customer.SERVICE_ZIP));
                    }
                }

                const weatherData = await getWeatherForCity(city);

                if (weatherData && weatherData.length > 0) {
                    let totalTemp = 0;
                    weatherData.forEach((day: any) => {
                        totalTemp += day.VALUE;
                    });
                    // Convert C to F: (C * 9/5) + 32
                    const avgC = totalTemp / weatherData.length;
                    setAvgTemp(Math.round((avgC * 9 / 5) + 32));
                }
            } catch (err) {
                console.error("Failed to load weather data", err);
            }
        };

        fetchData();
    }, [customerId, summary]);

    const getPeerTempImpact = () => {
        // Updated thresholds for Fahrenheit
        if (avgTemp > 95 || avgTemp < 40) return { value: avgTemp + 1, label: "High" };
        if (avgTemp > 85 || avgTemp < 55) return { value: avgTemp, label: "Medium" };
        return { value: avgTemp - 1, label: "Low" };
    };

    const filteredPeers = peers.filter(peer =>
        (peer.zone === selectedZone || selectedZone === "All Zones") &&
        (peer.zip.includes(searchQuery) || peer.zone.toLowerCase().includes(searchQuery.toLowerCase()) || peer.id.includes(searchQuery))
    );

    return (
        <div className="absolute inset-0 overflow-hidden">
            <IntelligenceMap
                userUsage={userUsage}
                zipCode={zipCode}
                peerAvgUsage={peerAvgUsage}
                peerTempImpact={getPeerTempImpact()}
                hideHeader={true}
                onPeersLoad={handlePeersLoad}
                selectedPeerId={selectedPeerId}
                onPeerSelect={setSelectedPeerId}
            />

            {/* Side Container */}
            <div className="absolute left-3 top-3 bottom-3 w-[360px] z-[400] pointer-events-none">
                <div className="h-full w-full bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] shadow-2xl rounded-xl p-3 flex flex-col pointer-events-auto overflow-hidden opacity-100">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.1em]">Peer Analysis</h3>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>

                    {/* Controls Row */}
                    <div className="flex gap-2 mb-4">
                        {/* Zone Dropdown */}
                        <div className="relative group flex-shrink-0">
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="appearance-none bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none hover:border-[var(--text-accent)] transition-all cursor-pointer pr-8"
                            >
                                <option>Zone A</option>
                                <option>Zone B</option>
                                <option>Zone C</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)] group-hover:text-[var(--text-accent)] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Enter PIN Code or locality"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] outline-none hover:border-[var(--text-accent)] focus:border-[var(--text-accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                            />
                        </div>
                    </div>

                    {/* Peer List */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {filteredPeers.map((peer) => (
                            <div
                                key={peer.id}
                                onClick={() => setSelectedPeerId(peer.id)}
                                className={`p-3 rounded-xl border transition-all group cursor-pointer active:scale-[0.98] ${selectedPeerId === peer.id
                                    ? 'bg-indigo-50 border-indigo-500/50 shadow-sm shadow-indigo-100'
                                    : 'bg-[var(--bg-surface-1)] border-[var(--border-subtle)] hover:border-indigo-500/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 px-1.5 bg-[var(--bg-surface-2)] rounded-md border border-[var(--border-subtle)]">
                                            <span className="text-[11px] font-bold text-[var(--text-secondary)]">ZIP</span>
                                        </div>
                                        <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{peer.zip}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{peer.zone}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-t border-[var(--border-subtle)] pt-2 mt-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">Area Size</p>
                                        <p className="text-[10px] font-bold text-[var(--text-secondary)]">{peer.areaSize}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">Built Year</p>
                                        <p className="text-[10px] font-bold text-[var(--text-secondary)]">{peer.builtYear}</p>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight text-right">Avg Usage</p>
                                        <p className="text-[10px] font-bold text-emerald-600">{peer.avgUsage}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredPeers.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-xs text-[var(--text-tertiary)] italic">No locality found matching your criteria.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <p className="text-[9px] text-[var(--text-tertiary)] font-medium">Standard US Energy Telemetry</p>
                        <span className="text-[9px] text-[var(--text-tertiary)] opacity-60">Verified {new Date().getFullYear()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
