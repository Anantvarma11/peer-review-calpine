import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface DateRangeSelectorProps {
    startDate: Date | null;
    endDate: Date | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
    totalUsage?: number;
    totalCost?: number;
    onClear?: () => void;
}

export function DateRangeSelector({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    totalUsage = 0,
    totalCost = 0,
    onClear
}: DateRangeSelectorProps) {

    const formatDateRange = () => {
        if (!startDate && !endDate) return 'Select Date Range';
        if (startDate && endDate) {
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        if (startDate) {
            return `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return 'Select Date Range';
    };

    const handleClear = () => {
        onStartDateChange(null);
        onEndDateChange(null);
        onClear?.();
    };

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm mb-6">
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Date Range Picker Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700">Select Date Range</h3>
                                <p className="text-xs text-slate-500">Choose period to analyze usage</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Start Date */}
                            <div className="relative">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => onStartDateChange(date)}
                                    selectsStart
                                    startDate={startDate || undefined}
                                    endDate={endDate || undefined}
                                    maxDate={endDate || new Date()}
                                    dateFormat="MMM dd, yyyy"
                                    placeholderText="Start Date"
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-40"
                                />
                            </div>

                            <span className="text-slate-400 font-medium">→</span>

                            {/* End Date */}
                            <div className="relative">
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date: Date | null) => onEndDateChange(date)}
                                    selectsEnd
                                    startDate={startDate || undefined}
                                    endDate={endDate || undefined}
                                    minDate={startDate || undefined}
                                    maxDate={new Date()}
                                    dateFormat="MMM dd, yyyy"
                                    placeholderText="End Date"
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-40"
                                />
                            </div>

                            {(startDate || endDate) && (
                                <button
                                    onClick={handleClear}
                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                    title="Clear dates"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* KPI Display Section */}
                    {(startDate && endDate) && (
                        <div className="flex gap-4 border-l border-blue-200 pl-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-600">Total Usage</span>
                                <span className="font-bold text-slate-800 text-xl">{Math.round(totalUsage).toLocaleString()} <span className="text-sm font-normal text-slate-500">kWh</span></span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-600">Total Cost</span>
                                <span className="font-bold text-emerald-700 text-xl">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Selected Range Display */}
                {(startDate || endDate) && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                <span className="font-medium">Selected Period:</span>{' '}
                                <span className="text-blue-700 font-semibold">{formatDateRange()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
