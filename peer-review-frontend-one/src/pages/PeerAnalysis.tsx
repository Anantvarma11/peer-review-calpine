import { useEffect, useState } from "react"
import { WeatherImpactChart } from "@/components/charts/WeatherImpactChart"
import { IntelligenceMap } from "@/components/maps/IntelligenceMap"
import { getCustomer, getWeatherForCity } from "@/lib/api"
import { TemperatureRegular, DropRegular, WeatherSnowflakeRegular, FireRegular } from '@fluentui/react-icons';
import { EnergyPeerHeatmap } from "@/components/charts/EnergyPeerHeatmap";
interface PeerAnalysisProps {
    summary?: any;
    customerId?: string;
}

export default function PeerAnalysis({ summary, customerId }: PeerAnalysisProps) {
    const userUsage = summary?.current_kwh || 850;
    const peerAvgUsage = summary?.peer_avg_kwh || 988;

    // State for weather stats
    const [avgTemp, setAvgTemp] = useState<number>(78);
    const [humidity, setHumidity] = useState<number>(65); // Mocked for now
    const [coolingDays, setCoolingDays] = useState<number>(14);
    const [heatingDays, setHeatingDays] = useState<number>(2);
    const [zipCode, setZipCode] = useState<string>("75001");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!customerId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let city = "Houston";

                // Use summary if available to avoid extra call, otherwise fetch customer
                if (summary?.Service_City) {
                    city = summary.Service_City;
                    if (summary.SERVICE_ZIP) setZipCode(String(summary.SERVICE_ZIP));
                } else {
                    // 1. Get Customer to find City & ZIP
                    const customer = await getCustomer(customerId);
                    city = customer.Service_City || "Houston";
                    if (customer.SERVICE_ZIP) {
                        setZipCode(String(customer.SERVICE_ZIP));
                    }
                }

                // 2. Get Weather for City
                const weatherData = await getWeatherForCity(city);

                if (weatherData && weatherData.length > 0) {
                    // Calculate Stats
                    let totalTemp = 0;
                    let cdd = 0;
                    let hdd = 0;

                    weatherData.forEach((day: any) => {
                        totalTemp += day.VALUE;
                        if (day.VALUE > 65) cdd++;
                        if (day.VALUE < 65) hdd++;
                    });

                    setAvgTemp(Math.round(totalTemp / weatherData.length));
                    setCoolingDays(cdd);
                    setHeatingDays(hdd);
                    setHumidity(Math.floor(Math.random() * (80 - 40 + 1)) + 40);
                }
            } catch (err) {
                console.error("Failed to load weather data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId]);

    // Calculate dynamic peer temp impact based on avg temp
    const getPeerTempImpact = () => {
        // Simple logic: If temp is extreme, impact is High
        if (avgTemp > 85 || avgTemp < 45) return { value: avgTemp + 1, label: "High" };
        if (avgTemp > 80 || avgTemp < 55) return { value: avgTemp, label: "Medium" };
        return { value: avgTemp - 1, label: "Low" };
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Peer Analysis</h1>
                <p className="text-slate-500">Analyze energy patterns and compare historical impact.</p>
            </div>

            <div id="energy-peer-heatmap" className="w-full rounded-lg transition-all duration-300">
                <EnergyPeerHeatmap hideTrendLine />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <TemperatureRegular className="text-4xl mb-2 text-rose-500" />
                    <p className="text-sm text-slate-500">Avg Temp</p>
                    <p className="text-xl font-bold text-slate-800">{avgTemp}°F</p>
                    <p className="text-[10px] text-slate-400 mt-1">Past 30 days</p>
                </div>
                <div className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <DropRegular className="text-4xl mb-2 text-blue-500" />
                    <p className="text-sm text-slate-500">Humidity</p>
                    <p className="text-xl font-bold text-slate-800">{humidity}%</p>
                    <p className="text-[10px] text-slate-400 mt-1">Avg daily</p>
                </div>
                <div className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <WeatherSnowflakeRegular className="text-4xl mb-2 text-sky-400" />
                    <p className="text-sm text-slate-500">Cooling Days</p>
                    <p className="text-xl font-bold text-slate-800">{coolingDays}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Days with AC usage</p>
                </div>
                <div className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <FireRegular className="text-4xl mb-2 text-orange-500" />
                    <p className="text-sm text-slate-500">Heating Days</p>
                    <p className="text-xl font-bold text-slate-800">{heatingDays}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Days with heating</p>
                </div>
            </div>

            <div className="w-full">
                <WeatherImpactChart />
            </div>
        </div>
    )
}
