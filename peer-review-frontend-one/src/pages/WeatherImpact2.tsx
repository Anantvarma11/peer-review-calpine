import { useState, useEffect } from 'react';
import { getCustomer } from "@/lib/api";
import { Info } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/SimpleTooltip';
import { WeatherCharts } from '@/components/charts/WeatherCharts';
import EnhancedKPISection, { weatherKPIs } from '@/components/charts/EnhancedKPIs';

interface WeatherImpact2Props {
    customerId?: string;
}

export default function WeatherImpact2({ customerId }: WeatherImpact2Props) {
    const [city, setCity] = useState("Houston");

    useEffect(() => {
        if (customerId) {
            getCustomer(customerId).then(customer => {
                if (customer?.Service_City) {
                    setCity(customer.Service_City);
                }
            });
        }
    }, [customerId]);

    return (
        <div className="space-y-8 max-w-[1440px] mx-auto w-full pt-2 px-4">
            {/* Header Content - Now Outside */}
            <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Weather Impact Analytics</h2>
                    <SimpleTooltip content="Advanced analytics quantifying the direct energy response to local weather conditions.">
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                    </SimpleTooltip>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Isolating climate-driven load from behavioral consumption in <span className="text-slate-900 font-bold">{city}</span>. Use these metrics to identify insulation gaps and HVAC inefficiencies.
                </p>
            </div>

            {/* Enhanced Weather Impact KPIs - Now Outside */}
            <EnhancedKPISection kpis={weatherKPIs} />

            {/* Advanced Weather Correlation Charts - Remains in Container */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <WeatherCharts customerId={customerId} />
            </div>
        </div>
    );
}
