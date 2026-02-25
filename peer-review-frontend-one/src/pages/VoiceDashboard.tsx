import { useState, useEffect, useRef } from 'react';
import { VoiceOrb } from '@/components/voice/VoiceOrb';
import { TranscriptionPanel } from '@/components/voice/TranscriptionPanel';
import { sendVoiceCommand, textToSpeech, getMonthlyUsage, getDailyUsage } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Volume2, VolumeX } from 'lucide-react';

interface TranscriptItem {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

export default function VoiceDashboard() {
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const recognition = useRef<any>(null);

    // Data State
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartConfig, setChartConfig] = useState<{ type: 'bar' | 'line', title: string, metric: string }>({
        type: 'bar',
        title: 'Monthly Usage',
        metric: 'kwh'
    });

    // --- Init ---
    useEffect(() => {
        // Load initial data
        loadInitialData();

        // Setup Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onstart = () => setVoiceState('listening');

            recognition.current.onresult = async (event: any) => {
                const text = event.results[0][0].transcript;
                setIsListening(false);
                await handleVoiceCommand(text);
            };

            recognition.current.onend = () => {
                if (voiceState === 'listening') setIsListening(false);
            };

            // Handle errors
            recognition.current.onerror = (event: any) => {
                console.error("Speech Error", event.error);
                setIsListening(false);
                setVoiceState('idle');
            };
        }
    }, []);

    // Sync State
    useEffect(() => {
        if (!isListening && voiceState === 'listening') setVoiceState('idle');
    }, [isListening]);

    const loadInitialData = async () => {
        try {
            const data = await getMonthlyUsage('mock_1'); // Default ID
            setChartData(data.map((d: any) => ({
                name: new Date(d.BILLING_MONTH).toLocaleDateString('en-US', { month: 'short' }),
                value: d.MONTHLY_KWH
            })));
        } catch (e) { console.error("Load Data Error", e); }
    };

    const toggleMic = () => {
        if (isListening) {
            recognition.current?.stop();
            setIsListening(false);
            setVoiceState('idle');
        } else {
            try {
                recognition.current?.start();
                setIsListening(true);
            } catch (e) { console.error(e); }
        }
    };

    const handleVoiceCommand = async (text: string) => {
        setVoiceState('processing');

        // Add User Transcript
        const userMsg: TranscriptItem = { id: Date.now().toString(), role: 'user', text: text, timestamp: new Date() };
        setTranscript(prev => [...prev, userMsg]);

        try {
            // Call Backend
            const result = await sendVoiceCommand(text, chartConfig.title);

            // Add Assistant Transcript
            const aiMsg: TranscriptItem = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: result.response_text,
                timestamp: new Date()
            };
            setTranscript(prev => [...prev, aiMsg]);

            // Handle Action
            if (result.action === 'UPDATE_CHART') {
                await updateChart(result.parameters);
            } else if (result.action === 'NAVIGATE') {
                // Navigation logic here if needed
            }

            // Speak Response
            setVoiceState('speaking');
            if (isVoiceEnabled) {
                const audioBlob = await textToSpeech(result.response_text);
                if (audioBlob) {
                    const audio = new Audio(URL.createObjectURL(audioBlob));
                    audio.onended = () => setVoiceState('idle');
                    await audio.play();
                } else {
                    setTimeout(() => setVoiceState('idle'), 2000);
                }
            } else {
                setTimeout(() => setVoiceState('idle'), 2000); // Simulate speaking time
            }

        } catch (e) {
            console.error("Command Failed", e);
            setVoiceState('idle');
            // Add Error Transcript
            setTranscript(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: "I'm having trouble connecting. Please try again.", timestamp: new Date() }]);
        }
    };

    const updateChart = async (params: any) => {
        try {
            let data = [];
            let title = chartConfig.title;
            let type = chartConfig.type;
            let metric = params.metric || chartConfig.metric;

            if (metric === 'cost') {
                title = 'Monthly Cost';
                const res = await getMonthlyUsage('mock_1');
                data = res.map((d: any) => ({ name: new Date(d.BILLING_MONTH).toLocaleDateString('en-US', { month: 'short' }), value: d.MONTHLY_COST }));
                type = 'bar'; // Cost usually bar
            } else if (params.timeRange === '30d' || params.granularity === 'daily') {
                title = 'Daily Usage (Last 30 Days)';
                const res = await getDailyUsage('mock_1');
                data = res.map((d: any) => ({ name: new Date(d.USAGE_DATE).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: d.DAILY_KWH }));
                type = 'line';
            } else {
                // Default KWH
                title = 'Monthly Usage';
                const res = await getMonthlyUsage('mock_1');
                data = res.map((d: any) => ({ name: new Date(d.BILLING_MONTH).toLocaleDateString('en-US', { month: 'short' }), value: d.MONTHLY_KWH }));
                type = 'bar';
            }

            if (params.chartType) type = params.chartType;

            setChartData(data);
            setChartConfig({ title, type, metric });

        } catch (e) { console.error("Update Chart Error", e); }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm flex-none z-10">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Voice Analyst
                </h1>
                <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                    {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">

                {/* Left: Chart Area */}
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                    <Card className="flex-1 shadow-sm border-slate-200 flex flex-col min-h-0">
                        <CardHeader className="flex-none pb-2">
                            <CardTitle className="text-slate-700">{chartConfig.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 relative">
                            {/* Container requires explicit height in flex layout usually, absolute inset trick helps recharts */}
                            <div className="absolute inset-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartConfig.type === 'bar' ? (
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Voice Interaction */}
                <div className="w-full md:w-[400px] flex flex-col gap-6 flex-none h-full min-h-0">
                    {/* Orb Container */}
                    <Card className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-sm relative overflow-hidden min-h-[300px]">
                        <div className="absolute top-4 right-4 z-10">
                            {/* Status Indicator */}
                            <span className={`inline-flex h-3 w-3 rounded-full transition-colors duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        </div>

                        <div onClick={toggleMic} className="cursor-pointer hover:scale-105 transition-transform duration-300 active:scale-95">
                            <VoiceOrb state={voiceState} />
                        </div>
                    </Card>

                    {/* Transcript Panel */}
                    <Card className="h-[300px] shadow-sm border-slate-200 flex flex-col flex-none">
                        <CardHeader className="py-3 px-4 border-b bg-white flex-none">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Live Transcript</CardTitle>
                        </CardHeader>
                        <div className="flex-1 overflow-hidden p-0 bg-slate-50/50">
                            <TranscriptionPanel items={transcript} className="h-full border-none bg-transparent" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
