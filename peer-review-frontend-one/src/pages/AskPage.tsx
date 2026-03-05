import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Mic, User, Bot, StopCircle, Sparkles, Volume2, VolumeX, Lightbulb } from 'lucide-react';
import { cn } from "@/lib/utils";
import { textToSpeech } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

// Web Speech API Types
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

interface Insight {
    type: 'success' | 'warning' | 'info';
    text: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    data?: any; // For charts
    chartType?: 'bar' | 'line' | 'area';
    granularity?: 'Monthly' | 'Daily' | 'Hourly';
    insight?: Insight;
    isTyping?: boolean;
    suggestions?: string[];
}

// --- MOCK ENGINE V2 ---
// Granular Data Sets
const MOCK_DB = {
    monthly: [
        { name: 'Jan', usage: 850, cost: 130 },
        { name: 'Feb', usage: 780, cost: 120 },
        { name: 'Mar', usage: 720, cost: 115 },
        { name: 'Apr', usage: 890, cost: 140 },
        { name: 'May', usage: 1100, cost: 180 },
        { name: 'Jun', usage: 1350, cost: 210 }, // Summer peak
        { name: 'Jul', usage: 1450, cost: 230 },
        { name: 'Aug', usage: 1400, cost: 225 },
        { name: 'Sep', usage: 1150, cost: 190 },
        { name: 'Oct', usage: 900, cost: 145 },
        { name: 'Nov', usage: 820, cost: 135 },
        { name: 'Dec', usage: 950, cost: 150 },
    ],
    daily: Array.from({ length: 14 }, (_, i) => ({
        name: `Day ${i + 1}`,
        usage: Math.floor(Math.random() * 25) + 15, // 15-40 kWh
        temp: Math.floor(Math.random() * 15) + 65,   // 65-80 F
    })),
    hourly: Array.from({ length: 24 }, (_, i) => {
        // Create a realistic profile: low at night, peak in evening
        const hour = i;
        let base = 0.5;
        if (hour >= 6 && hour < 9) base = 1.5; // Morning peak
        if (hour >= 17 && hour < 21) base = 2.5; // Evening peak
        if (hour >= 9 && hour < 17) base = 1.0; // Day baseline
        return {
            name: `${hour}:00`,
            usage: parseFloat((base + Math.random()).toFixed(2)),
            cost: parseFloat(((base + Math.random()) * 0.25).toFixed(2)) // mocked TOU rate
        };
    }),
    peers: [
        { name: 'You', usage: 1350, fill: '#3b82f6' },
        { name: 'Neighbors', usage: 1420, fill: '#94a3b8' },
        { name: 'Efficient', usage: 980, fill: '#10b981' },
    ]
};

const generateResponseV2 = (input: string): {
    text: string,
    data?: any,
    chartType?: 'bar' | 'line' | 'area',
    granularity?: 'Monthly' | 'Daily' | 'Hourly',
    insight?: Insight,
    suggestions?: string[]
} => {
    const lower = input.toLowerCase();

    // 1. HOURLY BREAKDOWN
    if (lower.includes('hour') || lower.includes('today') || lower.includes('profile')) {
        return {
            text: "Here is your hourly energy profile for today. Notice the spike around **6 PM**, which coincides with peak Time-of-Use rates.",
            data: MOCK_DB.hourly,
            chartType: 'area', // Area looks good for continuous profile
            granularity: 'Hourly',
            insight: { type: 'warning', text: "Peak usage at 6 PM costs 2x more." },
            suggestions: ['Show daily view', 'How to reduce peak usage?']
        };
    }

    // 2. DAILY TREND / WEATHER
    if (lower.includes('day') || lower.includes('daily') || lower.includes('weather') || lower.includes('temp')) {
        return {
            text: "Charts show your daily usage over the last 2 weeks against temperature. Your consumption strictly follows the heatwave trend.",
            data: MOCK_DB.daily,
            chartType: 'line', // Dual axis line is handled by component
            granularity: 'Daily',
            insight: { type: 'info', text: "1°F rise adds ~2% to your bill." },
            suggestions: ['Show monthly cost', 'Forecast for next week']
        };
    }

    // 3. PEER COMPARISON
    if (lower.includes('peer') || lower.includes('neighbor') || lower.includes('compare')) {
        return {
            text: "You are more efficient than the average neighbor, but higher than the top 20% 'Efficient' homes. There's potential to save another **$25/mo**.",
            data: MOCK_DB.peers,
            chartType: 'bar',
            granularity: 'Monthly',
            insight: { type: 'success', text: "Better than 65% of neighbors!" },
            suggestions: ['How do efficient homes save?', 'Show my hourly usage']
        };
    }

    // 4. MONTHLY / COST (Default for "Usage" or "Cost")
    if (lower.includes('month') || lower.includes('cost') || lower.includes('bill') || lower.includes('usage') || lower.includes('trend')) {
        return {
            text: "Here is your 12-month usage trend. Summer months (Jun-Aug) are your highest spend periods due to cooling.",
            data: MOCK_DB.monthly,
            chartType: 'bar',
            granularity: 'Monthly',
            insight: { type: 'warning', text: "Summer bills are 40% higher than average." },
            suggestions: ['Compare with neighbors', 'Show hourly breakdown']
        };
    }

    // 5. DEFAULT CONVERSATIONAL
    return {
        text: "I can help with that! I can crunch numbers for **Hourly**, **Daily**, or **Monthly** periods. What granularity do you need?",
        suggestions: ['Show Hourly Profile', 'Show Daily Trend', 'Show Monthly Bill']
    };
};

export default function AskPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            content: "Hello! I'm your Energy Intelligence Analyst. I can help visualize your data.\n\nTry asking for **Hourly**, **Daily**, or **Monthly** trends.",
            timestamp: new Date(),
            suggestions: ['Show Hourly Profile', 'Compare with Neighbors', 'Show Monthly Cost']
        }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true); // Toggle for TTS

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognition = useRef<any>(null);
    const location = useLocation();

    // Handle Initial Query from Header
    useEffect(() => {
        const state = location.state as { initialQuery?: string };
        if (state?.initialQuery) {
            handleSend(state.initialQuery);
            // Clear state so it doesn't re-trigger on refresh (though location.state persists, careful)
            window.history.replaceState({}, document.title);
        }
    }, []);

    // Initial Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isProcessing]);

    // TTS Function (uses api.ts base URL so it works on Vercel + Render backend)
    const speakText = async (text: string) => {
        if (!isVoiceEnabled) return;

        try {
            // Remove markdown for speech
            const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');

            const blob = await textToSpeech(cleanText);
            if (blob) {
                const audio = new Audio(URL.createObjectURL(blob));
                audio.play();
                return;
            }
            throw new Error("Backend TTS failed");
        } catch (e) {
            // Fallback to Browser TTS
            console.log("Using Browser TTS Fallback");
            const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/\*/g, ''));
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
            if (preferred) utterance.voice = preferred;
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // --- Message Handling ---
    const handleSend = useCallback(async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        // User Msg
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        // AI Logic
        setTimeout(() => {
            const aiResponse = generateResponseV2(textToSend);
            const streamMsgId = (Date.now() + 1).toString();
            let currentText = "";
            const fullText = aiResponse.text;

            // Stream UI
            setMessages(prev => [...prev, {
                id: streamMsgId,
                role: 'assistant',
                content: "",
                timestamp: new Date(),
                isTyping: true
            }]);

            let charIndex = 0;
            const typingInterval = setInterval(() => {
                currentText += fullText.charAt(charIndex);
                charIndex++;

                setMessages(prev => prev.map(m =>
                    m.id === streamMsgId ? { ...m, content: currentText } : m
                ));

                if (charIndex >= fullText.length) {
                    clearInterval(typingInterval);
                    // Finalize
                    setMessages(prev => prev.map(m =>
                        m.id === streamMsgId ? {
                            ...m,
                            isTyping: false,
                            ...aiResponse
                        } : m
                    ));
                    setIsProcessing(false);
                    speakText(fullText); // Trigger Voice
                }
            }, 10);
        }, 800);
    }, [input, isVoiceEnabled]);

    // --- Voice Input Config ---
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript);
            };

            recognition.current.onend = () => setIsListening(false);
        }
    }, [handleSend]);

    const toggleListening = () => {
        if (isListening) {
            recognition.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognition.current?.start();
                setIsListening(true);
            } catch (e) {
                console.log("Mic Error", e);
            }
        }
    };

    // --- Render Charts ---
    const renderChart = (msg: Message) => {
        if (!msg.data) return null;

        return (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{msg.granularity || 'Data'} View</h3>
                    {msg.insight && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border",
                            msg.insight.type === 'warning' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                msg.insight.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                            <Lightbulb className="h-3 w-3" />
                            {msg.insight.text}
                        </div>
                    )}
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {msg.chartType === 'area' ? (
                            // Hourly / Profile View
                            <AreaChart data={msg.data}>
                                <defs>
                                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} interval={3} />
                                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="usage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsage)" name="kWh" />
                            </AreaChart>
                        ) : msg.chartType === 'line' ? (
                            // Daily View
                            <LineChart data={msg.data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                                <YAxis yAxisId="left" fontSize={10} tick={{ fill: '#94a3b8' }} />
                                <YAxis yAxisId="right" orientation="right" fontSize={10} tick={{ fill: '#ef4444' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Line yAxisId="left" type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} name="kWh" />
                                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp" />
                            </LineChart>
                        ) : (
                            // Monthly / Bar View
                            <BarChart data={msg.data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#94a3b8' }} />
                                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Usage" />
                                {msg.data[0].cost && <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} name="Cost" />}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
            {/* Header */}
            <div className="flex-none px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Energy Intelligence</h1>
                        <p className="text-xs text-slate-500 font-medium">Voice Enabled • Data Engine V2</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={cn(
                        "p-2 rounded-full transition-colors",
                        isVoiceEnabled ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                    )}
                    title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
                >
                    {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                <div className="max-w-[1440px] w-full mx-auto space-y-8 pb-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={cn(
                                "flex-none h-10 w-10 rounded-full flex items-center justify-center shadow-sm text-white",
                                msg.role === 'assistant' ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-slate-400"
                            )}>
                                {msg.role === 'assistant' ? <Bot className="h-6 w-6" /> : <User className="h-6 w-6" />}
                            </div>

                            <div className={cn("flex-1 space-y-2 max-w-[85%]", msg.role === 'user' ? "text-right" : "")}>
                                <div className={cn(
                                    "inline-block px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm text-left",
                                    msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>

                                {msg.data && renderChart(msg)}

                                {msg.suggestions && !msg.isTyping && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(s)}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isProcessing && !messages.some(m => m.isTyping) && (
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input */}
            <div className="flex-none p-6 bg-white border-t border-slate-200">
                <div className="max-w-[1440px] w-full mx-auto relative">
                    <div className={cn(
                        "absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 transition duration-300 blur",
                        isListening ? "animate-pulse opacity-50" : "opacity-0"
                    )}></div>
                    <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-slate-200">
                        <button
                            onClick={toggleListening}
                            className={cn(
                                "flex-none p-4 mx-1 rounded-xl transition-all",
                                isListening ? "bg-red-50 text-red-500" : "text-slate-400 hover:text-indigo-600"
                            )}
                        >
                            {isListening ? <StopCircle className="h-6 w-6 animate-pulse" /> : <Mic className="h-6 w-6" />}
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Ask about hourly, daily, or monthly data..."
                            className="flex-1 py-4 bg-transparent border-none focus:ring-0 text-slate-700 resize-none min-h-[60px]"
                            rows={1}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="flex-none p-3 m-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-95"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
