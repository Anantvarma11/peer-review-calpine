import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Check, User } from "lucide-react"
import { Skeleton } from "@/components/ui/Skeleton"

interface CustomerSelectorProps {
    selectedId: string;
    onCustomerChange: (id: string) => void;
    customerList: { id: string, name: string }[];
    isLoading?: boolean;
    onSearch: (term: string) => void;
    onFilterChange: (hasData: boolean) => void;
    hasRecentData: boolean;
}

export function CustomerSelector({ selectedId, onCustomerChange, customerList, isLoading = false, onSearch, onFilterChange, hasRecentData }: CustomerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Explicit search function - called by button click
    const handleSearch = () => {
        onSearch(searchTerm);
    };

    // Also search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const selectedCustomer = customerList.find(c => c.id === selectedId);

    // We now use the list directly as it's filtered server-side
    const filteredCustomers = customerList;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors w-64 justify-between"
            >
                <div className="flex items-center gap-2 truncate">
                    <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="flex flex-col items-start truncate">
                        <span className="text-sm font-medium text-slate-700 truncate block max-w-[140px]">
                            {selectedCustomer ? selectedCustomer.name : "Select Customer"}
                        </span>
                        {selectedCustomer && (
                            <span className="text-[10px] text-slate-500">ID: {selectedCustomer.id}</span>
                        )}
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                        {/* Filter Toggle */}
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={hasRecentData}
                                onChange={(e) => onFilterChange(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-600">Has 2024-2026 Data</span>
                        </label>
                    </div>

                    {/* Customer List */}
                    <div className="max-h-64 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading ? (
                            <div className="space-y-1 p-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-2">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="space-y-1 flex-1">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-2 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <button
                                    key={customer.id}
                                    onClick={() => {
                                        onCustomerChange(customer.id);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${selectedId === customer.id
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${selectedId === customer.id ? 'bg-indigo-200' : 'bg-slate-100'
                                            }`}>
                                            <span className="text-xs font-bold">
                                                {customer.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-medium truncate">{customer.name}</p>
                                            <p className={`text-xs ${selectedId === customer.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                ({customer.id})
                                            </p>
                                        </div>
                                    </div>
                                    {selectedId === customer.id && (
                                        <Check className="h-4 w-4 text-indigo-600 flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No customers found.
                            </div>
                        )}
                    </div>

                    {/* Limit / Footer Info */}
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                        Showing {filteredCustomers.length} results
                    </div>
                </div>
            )}
        </div>
    )
}
