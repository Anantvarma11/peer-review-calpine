import { Map, Marker, Overlay } from "pigeon-maps";
import { Card, CardContent } from "@/components/ui/Card";
import { MapPin, Sun, CloudSun, X, Info, Search, ChevronDown } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

// Color based on efficiency: Green = efficient, Purple = average, Pink/Red = high usage
const getColorByUsage = (usage: number) => {
    if (usage < 800) return '#10b981'; // Green - very efficient
    if (usage < 950) return '#8b5cf6'; // Purple - average
    if (usage < 1100) return '#f59e0b'; // Amber - above average
    return '#ef4444'; // Red - high usage
};

// Multi-ZIP data: each zip has its own center, neighbors, and peer stats
interface ZipData {
    zip: string;
    label: string;
    center: [number, number];
    peerAvg: number;
    peerCount: number;
    neighbors: { id: number; lat: number; lng: number; usage: number; label: string; color: string; areaSize: string; builtYear: number; zip: string; zone: string; history: { month: string; user: number; peer: number }[] }[];
}

const buildHighlights = (baseUser: number, basePeer: number) => {
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    return months.map((m) => ({
        month: m,
        user: Math.round(baseUser * (0.8 + Math.random() * 0.4)),
        peer: Math.round(basePeer * (0.8 + Math.random() * 0.4))
    }));
};

const buildZipData = (userZip: string): ZipData[] => {
    const zipNum = parseInt(userZip) || 75001;
    return [
        {
            zip: String(zipNum),
            label: "Your ZIP",
            center: [30.2672, -97.7431],
            peerAvg: 988,
            peerCount: 15,
            neighbors: [
                // Zone A (8 Pins)
                { id: 1, lat: 30.2695, lng: -97.7455, usage: 720, label: '123 Oak St', areaSize: '1,850 sq ft', builtYear: 2015, zip: '75001', zone: 'Zone A', history: buildHighlights(720, 988) },
                { id: 2, lat: 30.2692, lng: -97.7440, usage: 983, label: '127 Oak St', areaSize: '2,100 sq ft', builtYear: 2010, zip: '75002', zone: 'Zone A', history: buildHighlights(983, 988) },
                { id: 3, lat: 30.2690, lng: -97.7425, usage: 850, label: '131 Oak St', areaSize: '1,650 sq ft', builtYear: 2018, zip: '75003', zone: 'Zone A', history: buildHighlights(850, 988) },
                { id: 4, lat: 30.2688, lng: -97.7410, usage: 1150, label: '135 Oak St', areaSize: '2,800 sq ft', builtYear: 2005, zip: '75004', zone: 'Zone A', history: buildHighlights(1150, 988) },
                { id: 5, lat: 30.2705, lng: -97.7465, usage: 690, label: '10 Ivy Ct', areaSize: '1,500 sq ft', builtYear: 2019, zip: '75005', zone: 'Zone A', history: buildHighlights(690, 988) },
                { id: 6, lat: 30.2702, lng: -97.7450, usage: 1250, label: '14 Ivy Ct', areaSize: '2,900 sq ft', builtYear: 2003, zip: '75006', zone: 'Zone A', history: buildHighlights(1250, 988) },
                { id: 7, lat: 30.2708, lng: -97.7435, usage: 820, label: '18 Ivy Ct', areaSize: '1,820 sq ft', builtYear: 2014, zip: '75007', zone: 'Zone A', history: buildHighlights(820, 988) },
                { id: 8, lat: 30.2712, lng: -97.7420, usage: 940, label: '22 Ivy Ct', areaSize: '2,150 sq ft', builtYear: 2011, zip: '75008', zone: 'Zone A', history: buildHighlights(940, 988) },

                // Zone B (8 Pins)
                { id: 9, lat: 30.2678, lng: -97.7460, usage: 890, label: '200 Maple Ave', areaSize: '1,920 sq ft', builtYear: 2020, zip: '75101', zone: 'Zone B', history: buildHighlights(890, 988) },
                { id: 10, lat: 30.2675, lng: -97.7445, usage: 1450, label: '204 Maple Ave', areaSize: '3,200 sq ft', builtYear: 1998, zip: '75102', zone: 'Zone B', history: buildHighlights(1450, 988) },
                { id: 11, lat: 30.2672, lng: -97.7430, usage: 780, label: '208 Maple Ave', areaSize: '1,550 sq ft', builtYear: 2012, zip: '75103', zone: 'Zone B', history: buildHighlights(780, 988) },
                { id: 12, lat: 30.2670, lng: -97.7415, usage: 920, label: '212 Maple Ave', areaSize: '2,050 sq ft', builtYear: 2016, zip: '75104', zone: 'Zone B', history: buildHighlights(920, 988) },
                { id: 13, lat: 30.2665, lng: -97.7470, usage: 1080, label: '300 Pine Rd', areaSize: '2,400 sq ft', builtYear: 2008, zip: '75105', zone: 'Zone B', history: buildHighlights(1080, 988) },
                { id: 14, lat: 30.2662, lng: -97.7455, usage: 830, label: '304 Pine Rd', areaSize: '1,780 sq ft', builtYear: 2014, zip: '75106', zone: 'Zone B', history: buildHighlights(830, 988) },
                { id: 15, lat: 30.2658, lng: -97.7440, usage: 950, label: '308 Pine Rd', areaSize: '2,150 sq ft', builtYear: 2011, zip: '75107', zone: 'Zone B', history: buildHighlights(950, 988) },
                { id: 16, lat: 30.2655, lng: -97.7425, usage: 1210, label: '312 Pine Rd', areaSize: '2,850 sq ft', builtYear: 2004, zip: '75108', zone: 'Zone B', history: buildHighlights(1210, 988) },

                // Zone C (8 Pins)
                { id: 17, lat: 30.2645, lng: -97.7485, usage: 710, label: '15 Cedar Ln', areaSize: '1,500 sq ft', builtYear: 2018, zip: '75201', zone: 'Zone C', history: buildHighlights(710, 988) },
                { id: 18, lat: 30.2642, lng: -97.7470, usage: 1380, label: '22 Cedar Ln', areaSize: '3,100 sq ft', builtYear: 1995, zip: '75202', zone: 'Zone C', history: buildHighlights(1380, 988) },
                { id: 19, lat: 30.2638, lng: -97.7455, usage: 910, label: '18 Birch Way', areaSize: '2,000 sq ft', builtYear: 2007, zip: '75203', zone: 'Zone C', history: buildHighlights(910, 988) },
                { id: 20, lat: 30.2635, lng: -97.7440, usage: 840, label: '25 Birch Way', areaSize: '1,800 sq ft', builtYear: 2012, zip: '75204', zone: 'Zone C', history: buildHighlights(840, 988) },
                { id: 21, lat: 30.2630, lng: -97.7425, usage: 1120, label: '32 Birch Way', areaSize: '2,550 sq ft', builtYear: 2001, zip: '75205', zone: 'Zone C', history: buildHighlights(1120, 988) },
                { id: 22, lat: 30.2628, lng: -97.7410, usage: 1050, label: '40 Birch Way', areaSize: '2,350 sq ft', builtYear: 2009, zip: '75206', zone: 'Zone C', history: buildHighlights(1050, 988) },
                { id: 23, lat: 30.2625, lng: -97.7395, usage: 760, label: '48 Birch Way', areaSize: '1,680 sq ft', builtYear: 2015, zip: '75207', zone: 'Zone C', history: buildHighlights(760, 988) },
                { id: 24, lat: 30.2622, lng: -97.7380, usage: 990, label: '56 Birch Way', areaSize: '2,250 sq ft', builtYear: 2006, zip: '75208', zone: 'Zone C', history: buildHighlights(990, 988) },
            ].map(n => ({ ...n, color: getColorByUsage(n.usage) }))
        },
        {
            zip: String(zipNum + 1),
            label: "Nearby",
            center: [30.2720, -97.7380],
            peerAvg: 1020,
            peerCount: 12,
            neighbors: [
                { id: 101, lat: 30.2735, lng: -97.7395, usage: 810, label: '45 Willow Dr', areaSize: '1,750 sq ft', builtYear: 2013, history: buildHighlights(810, 1020) },
                { id: 102, lat: 30.2730, lng: -97.7380, usage: 1120, label: '49 Willow Dr', areaSize: '2,450 sq ft', builtYear: 2006, history: buildHighlights(1120, 1020) },
                { id: 103, lat: 30.2725, lng: -97.7365, usage: 960, label: '53 Willow Dr', areaSize: '2,000 sq ft', builtYear: 2011, history: buildHighlights(960, 1020) },
                { id: 104, lat: 30.2718, lng: -97.7400, usage: 1340, label: '100 Ash Blvd', areaSize: '3,000 sq ft', builtYear: 1990, history: buildHighlights(1340, 1020) },
                { id: 105, lat: 30.2715, lng: -97.7385, usage: 750, label: '104 Ash Blvd', areaSize: '1,600 sq ft', builtYear: 2017, history: buildHighlights(750, 1020) },
                { id: 106, lat: 30.2710, lng: -97.7370, usage: 890, label: '108 Ash Blvd', areaSize: '1,900 sq ft', builtYear: 2014, history: buildHighlights(890, 1020) },
                { id: 107, lat: 30.2705, lng: -97.7395, usage: 1050, label: '200 Spruce Ave', areaSize: '2,300 sq ft', builtYear: 2009, history: buildHighlights(1050, 1020) },
                { id: 108, lat: 30.2700, lng: -97.7380, usage: 920, label: '204 Spruce Ave', areaSize: '2,100 sq ft', builtYear: 2012, history: buildHighlights(920, 1020) },
                { id: 109, lat: 30.2695, lng: -97.7365, usage: 1180, label: '208 Spruce Ave', areaSize: '2,700 sq ft', builtYear: 2004, history: buildHighlights(1180, 1020) },
                { id: 110, lat: 30.2740, lng: -97.7410, usage: 690, label: '10 Ivy Ct', areaSize: '1,500 sq ft', builtYear: 2019, history: buildHighlights(690, 1020) },
                { id: 111, lat: 30.2690, lng: -97.7355, usage: 1400, label: '25 Fern Way', areaSize: '3,300 sq ft', builtYear: 1992, history: buildHighlights(1400, 1020) },
                { id: 112, lat: 30.2745, lng: -97.7360, usage: 870, label: '30 Holly Ln', areaSize: '1,850 sq ft', builtYear: 2015, history: buildHighlights(870, 1020) },
            ].map(n => ({ ...n, color: getColorByUsage(n.usage) }))
        },
        {
            zip: String(zipNum + 2),
            label: "Nearby",
            center: [30.2620, -97.7480],
            peerAvg: 945,
            peerCount: 10,
            neighbors: [
                { id: 201, lat: 30.2635, lng: -97.7495, usage: 780, label: '60 Poplar St', areaSize: '1,650 sq ft', builtYear: 2010, history: buildHighlights(780, 945) },
                { id: 202, lat: 30.2630, lng: -97.7480, usage: 1090, label: '64 Poplar St', areaSize: '2,400 sq ft', builtYear: 2003, history: buildHighlights(1090, 945) },
                { id: 203, lat: 30.2625, lng: -97.7465, usage: 860, label: '68 Poplar St', areaSize: '1,900 sq ft', builtYear: 2014, history: buildHighlights(860, 945) },
                { id: 204, lat: 30.2618, lng: -97.7500, usage: 1250, label: '150 Larch Rd', areaSize: '2,850 sq ft', builtYear: 1999, history: buildHighlights(1250, 945) },
                { id: 205, lat: 30.2615, lng: -97.7485, usage: 710, label: '154 Larch Rd', areaSize: '1,500 sq ft', builtYear: 2018, history: buildHighlights(710, 945) },
                { id: 206, lat: 30.2610, lng: -97.7470, usage: 980, label: '158 Larch Rd', areaSize: '2,200 sq ft', builtYear: 2007, history: buildHighlights(980, 945) },
                { id: 207, lat: 30.2605, lng: -97.7495, usage: 840, label: '250 Juniper Ave', areaSize: '1,800 sq ft', builtYear: 2012, history: buildHighlights(840, 945) },
                { id: 208, lat: 30.2640, lng: -97.7510, usage: 1150, label: '12 Aspen Ct', areaSize: '2,600 sq ft', builtYear: 2001, history: buildHighlights(1150, 945) },
                { id: 209, lat: 30.2600, lng: -97.7460, usage: 920, label: '18 Redwood Way', areaSize: '2,100 sq ft', builtYear: 2009, history: buildHighlights(920, 945) },
                { id: 210, lat: 30.2645, lng: -97.7470, usage: 870, label: '22 Sequoia Ln', areaSize: '1,950 sq ft', builtYear: 2011, history: buildHighlights(870, 945) },
            ].map(n => ({ ...n, color: getColorByUsage(n.usage) }))
        }
    ];
};

// Get dynamic dates
const getRecentDates = () => {
    return { today: "Dec 22", yesterday: "Dec 21" };
};

const MiniComparisonChart = ({ data }: { data: any[] }) => {
    const maxVal = Math.max(...data.flatMap(d => [d.user, d.peer]), 1);
    const H = 40;
    const W = 260;
    const barW = 12;
    const gap = 20;

    return (
        <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Last 6 Months Usage</span>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-[9px] text-slate-400 font-medium">You</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-[9px] text-slate-400 font-medium">Peers</span>
                    </div>
                </div>
            </div>
            <svg width={W} height={H + 20} className="overflow-visible">
                {data.map((d, i) => {
                    const x = i * (barW * 2 + gap);
                    const hUser = (d.user / maxVal) * H;
                    const hPeer = (d.peer / maxVal) * H;

                    return (
                        <g key={i}>
                            {/* Peer Bar (Grey) */}
                            <rect
                                x={x}
                                y={H - hPeer}
                                width={barW}
                                height={hPeer}
                                fill="#94a3b8"
                                rx={2}
                                className="transition-all duration-300"
                            />
                            {/* User Bar (Orange) */}
                            <rect
                                x={x + barW + 2}
                                y={H - hUser}
                                width={barW}
                                height={hUser}
                                fill="#f97316"
                                rx={2}
                                className="transition-all duration-300"
                            />
                            {/* Month Label */}
                            <text
                                x={x + barW}
                                y={H + 12}
                                textAnchor="middle"
                                className="text-[9px] fill-slate-400 font-medium"
                            >
                                {d.month}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

interface IntelligenceMapProps {
    userUsage?: number;
    zipCode?: string | number;
    peerAvgUsage?: number;
    peerTempImpact?: { value: number, label: string };
    hideHeader?: boolean;
    onPeersLoad?: (peers: any[]) => void;
    selectedPeerId?: string | null;
    onPeerSelect?: (id: string | null) => void;
}

export function IntelligenceMap({
    userUsage = 850,
    zipCode = "75001",
    peerAvgUsage = 988,
    peerTempImpact = { value: 79, label: "Low" },
    hideHeader = false,
    onPeersLoad,
    selectedPeerId = null,
    onPeerSelect
}: IntelligenceMapProps) {
    const zipData = useMemo(() => buildZipData(String(zipCode)), [zipCode]);
    const [activeZipIndex, setActiveZipIndex] = useState(0);

    // Sync internal selection with prop if provided
    const [localSelectedId, setLocalSelectedId] = useState<number | null>(null);
    const selectedId = selectedPeerId !== null ? Number(selectedPeerId) : localSelectedId;

    const handleSelect = (id: number | null) => {
        if (id === 0 && activeZipIndex !== 0) return; // Don't select user pin if not in user zip
        if (onPeerSelect) onPeerSelect(id !== null ? String(id) : null);
        else setLocalSelectedId(id);
    };

    useEffect(() => {
        if (onPeersLoad) {
            onPeersLoad(zipData[activeZipIndex].neighbors);
        }
    }, [activeZipIndex, zipData, onPeersLoad]);

    const [zipSearch, setZipSearch] = useState('');
    const [isZipDropdownOpen, setIsZipDropdownOpen] = useState(false);
    const zipDropdownRef = useRef<HTMLDivElement>(null);
    const dates = getRecentDates();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (zipDropdownRef.current && !zipDropdownRef.current.contains(e.target as Node)) {
                setIsZipDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredZips = useMemo(() => {
        if (!zipSearch.trim()) return zipData;
        return zipData.filter(zd => zd.zip.includes(zipSearch.trim()));
    }, [zipData, zipSearch]);

    const activeZip = zipData[activeZipIndex];
    const finalPeerAvg = activeZipIndex === 0 ? peerAvgUsage : activeZip.peerAvg;
    const peerCount = activeZip.peerCount;
    const userVsPeerPct = Math.round(((userUsage - finalPeerAvg) / finalPeerAvg) * 100);
    const isUserHigher = userVsPeerPct > 0;

    return (
        <Card className={`bg-white overflow-hidden relative shadow-sm h-full w-full flex flex-col ${hideHeader ? 'border-none rounded-none' : 'border border-slate-200'}`}>
            {!hideHeader && (
                <div className="p-4 border-b border-slate-100 bg-white z-10 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-400" /> ZIP {activeZip.zip} Peer Map
                            </h3>
                            <p className="text-xs text-slate-400">{peerCount} homes in this area</p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-100 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> You
                            </span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-100 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> &lt;800
                            </span>
                            <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full border border-violet-100 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-violet-500"></span> 800-950
                            </span>
                            <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-100 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> 950-1100
                            </span>
                            <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full border border-red-100 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> &gt;1100 kWh
                            </span>
                        </div>
                    </div>

                    {/* ZIP Search & Dropdown */}
                    {!hideHeader && (
                        <div className="relative" ref={zipDropdownRef}>
                            <div
                                className={`flex items-center gap-2.5 bg-white border-2 rounded-xl px-3.5 py-2 cursor-pointer transition-all duration-200 shadow-sm ${isZipDropdownOpen
                                    ? 'border-indigo-400 shadow-indigo-100 shadow-md'
                                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                    }`}
                                onClick={() => setIsZipDropdownOpen(!isZipDropdownOpen)}
                            >
                                <div className={`p-1 rounded-lg transition-colors ${isZipDropdownOpen ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                    <Search className={`h-3.5 w-3.5 transition-colors ${isZipDropdownOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
                                </div>
                                <input
                                    type="text"
                                    placeholder={`Search ZIP — ${activeZip.zip}${activeZipIndex === 0 ? ' (You)' : ''}`}
                                    value={zipSearch}
                                    onChange={(e) => { setZipSearch(e.target.value); setIsZipDropdownOpen(true); }}
                                    onClick={(e) => { e.stopPropagation(); setIsZipDropdownOpen(true); }}
                                    className="bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-[160px] font-medium"
                                />
                                <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isZipDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                            </div>

                            {isZipDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                    {/* Dropdown Header */}
                                    <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Select Zipcode</p>
                                    </div>

                                    <div className="max-h-56 overflow-y-auto py-1">
                                        {filteredZips.length > 0 ? (
                                            filteredZips.map((zd, i) => {
                                                const originalIdx = zipData.findIndex(z => z.zip === zd.zip);
                                                const isActive = originalIdx === activeZipIndex;
                                                const isUserZip = originalIdx === 0;
                                                // Simple usage bar based on peer avg relative to 1200 max
                                                const barPct = Math.min((zd.peerAvg / 1200) * 100, 100);
                                                return (
                                                    <div key={zd.zip}>
                                                        <button
                                                            onClick={() => {
                                                                setActiveZipIndex(originalIdx);
                                                                handleSelect(null);
                                                                setZipSearch('');
                                                                setIsZipDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-150 group ${isActive
                                                                ? 'bg-indigo-50/80'
                                                                : 'hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {/* Icon */}
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive
                                                                ? 'bg-indigo-600 shadow-sm shadow-indigo-200'
                                                                : isUserZip
                                                                    ? 'bg-indigo-100 group-hover:bg-indigo-200'
                                                                    : 'bg-slate-100 group-hover:bg-slate-200'
                                                                }`}>
                                                                <MapPin className={`h-4 w-4 ${isActive ? 'text-white' : isUserZip ? 'text-indigo-500' : 'text-slate-400'
                                                                    }`} />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                                        {zd.zip}
                                                                    </span>
                                                                    {isUserZip && (
                                                                        <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Your ZIP</span>
                                                                    )}
                                                                    {!isUserZip && (
                                                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">Nearby</span>
                                                                    )}
                                                                </div>
                                                                {/* Mini usage bar */}
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${isActive ? 'bg-indigo-500' : 'bg-slate-300'
                                                                                }`}
                                                                            style={{ width: `${barPct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{zd.peerAvg} kWh avg</span>
                                                                </div>
                                                            </div>

                                                            {/* Peer count badge */}
                                                            <div className={`text-right flex-shrink-0 px-2 py-1 rounded-lg ${isActive ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                                                                <span className={`text-[11px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{zd.peerCount}</span>
                                                                <p className="text-[9px] text-slate-400">peers</p>
                                                            </div>
                                                        </button>
                                                        {i < filteredZips.length - 1 && <div className="mx-4 border-b border-slate-100" />}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="px-4 py-6 text-center">
                                                <Search className="h-5 w-5 text-slate-300 mx-auto mb-2" />
                                                <p className="text-xs text-slate-400 font-medium">No matching ZIP codes</p>
                                                <p className="text-[10px] text-slate-300 mt-0.5">Try a different search term</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            <CardContent className="flex-1 p-0 relative isolate bg-slate-50">
                <div style={{ height: '100%', width: '100%', minHeight: '350px' }} className="bg-slate-100 flex-1 flex">
                    <Map
                        height={hideHeader ? undefined : 350}
                        center={activeZip.center}
                        defaultZoom={15}
                        key={activeZip.zip}
                    >
                        {/* User Marker - only in user's zip */}
                        {activeZipIndex === 0 && (
                            <Marker
                                width={35}
                                anchor={activeZip.center}
                                color="#4f46e5"
                                onClick={() => handleSelect(0)}
                            />
                        )}

                        {activeZip.neighbors.map(n => (
                            <Marker
                                key={n.id}
                                width={30}
                                anchor={[n.lat, n.lng]}
                                color={n.color}
                                onClick={() => handleSelect(n.id)}
                            />
                        ))}

                        {/* Selected ZIP Info Card Overlay */}
                        {selectedId !== null && (
                            <Overlay anchor={activeZip.center} offset={[120, 170]}>
                                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-4 w-[300px] relative">
                                    <button
                                        onClick={() => handleSelect(null)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                        <h4 className="font-bold text-slate-800 text-lg">ZIP {activeZip.zip}</h4>
                                        {activeZipIndex !== 0 && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Nearby</span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {/* Your Usage */}
                                        <div className="flex justify-between items-center bg-indigo-50 rounded-lg p-2 -mx-1">
                                            <span className="text-sm font-semibold text-indigo-700">Your Usage</span>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-indigo-900">{Math.round(userUsage)} kWh</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-2 ${isUserHigher ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {isUserHigher ? '+' : ''}{userVsPeerPct}% vs peers
                                                </span>
                                            </div>
                                        </div>

                                        {/* Peer Usage with Tooltip */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-slate-500">Peer Usage</span>
                                                <div className="relative group">
                                                    <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-800 text-white text-[10px] leading-relaxed rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                        <p><strong>Definition:</strong> Average daily usage of comparable homes (1.5k-2.5k sq ft) in ZIP {activeZip.zip} for Dec 21-22.</p>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-slate-900">{finalPeerAvg} kWh</span>
                                            </div>
                                        </div>

                                        {/* Peer Temp Impact with Tooltip */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-slate-500">Peer Temp Impact</span>
                                                <div className="relative group">
                                                    <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-800 text-white text-[10px] leading-relaxed rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                        <p><strong>Definition:</strong> Average outdoor temperature impact on HVAC efficiency across all peers in this ZIP code.</p>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-slate-900">{peerTempImpact.value}°F</span>
                                                <span className={`text-xs ml-1 ${peerTempImpact.label === 'High' ? 'text-rose-500' : 'text-emerald-500'}`}>({peerTempImpact.label})</span>
                                            </div>
                                        </div>

                                        {/* 6-Month Comparison Chart */}
                                        {selectedId !== 0 && (
                                            <MiniComparisonChart
                                                data={activeZip.neighbors.find(n => n.id === selectedId)?.history || []}
                                            />
                                        )}
                                        {selectedId === 0 && (
                                            <MiniComparisonChart
                                                data={buildHighlights(userUsage, finalPeerAvg)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </Overlay>
                        )}
                    </Map>
                </div>

                {/* Weather Widget (Top Left Absolute) - Dynamic Dates */}
                {!hideHeader && (
                    <div className="absolute top-4 left-4 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex gap-6 z-[500]">
                        <div className="text-center">
                            <div className="flex justify-center mb-1">
                                <CloudSun className="h-8 w-8 text-sky-500" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800">58°</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dates.yesterday}</div>
                        </div>
                        <div className="w-px bg-slate-100"></div>
                        <div className="text-center">
                            <div className="flex justify-center mb-1">
                                <Sun className="h-8 w-8 text-orange-400" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800">62°</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dates.today}</div>
                        </div>
                    </div>
                )}

                {/* Heat Legend (Bottom Left Absolute) */}
                {!hideHeader && (
                    <div className="absolute bottom-6 left-6 bg-white rounded-full shadow-lg border border-slate-100 px-4 py-2 flex items-center gap-3 z-[500]">
                        <span className="text-xs font-bold text-slate-600">Low</span>
                        <div className="w-32 h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
                        <span className="text-xs font-bold text-slate-600">High</span>
                    </div>
                )}

            </CardContent>
        </Card >
    )
}
