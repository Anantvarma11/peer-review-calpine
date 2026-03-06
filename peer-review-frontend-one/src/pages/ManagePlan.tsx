import React from 'react';
import ManagePlanKPIs from '@/components/charts/ManagePlanKPIs';

interface ManagePlanProps {
    customerId?: string;
}

const ManagePlan: React.FC<ManagePlanProps> = () => {
    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Manage Plan</h1>

            {/* Manage Plan KPI Cards with Charts */}
            <ManagePlanKPIs />
        </div>
    );
};

export default ManagePlan;
