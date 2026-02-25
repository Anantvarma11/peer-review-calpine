import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Loader2, Navigation } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Web Speech API Types
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export function VoiceAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; customerId?: string }) {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; type?: 'text' | 'chart' | 'nav' }[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const recognition = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSend(transcript);
            };

            recognition.current.onerror = (event: any) => {
                console.error("Speech Recognition Error", event.error);
                setIsListening(false);
            };

            recognition.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognition.current?.stop();
            setIsListening(false);
        } else {
            recognition.current?.start();
            setIsListening(true);
            setInputValue("Listening...");
        }
    };

    const handleSend = async (text: string) => {
        if (!text || text === "Listening...") return;

        // Add User Message
        const userMsg = { role: 'user' as const, content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            // Mock API or Real API Call
            // const response = await fetch(`/api/ai/${customerId}/chat`, { method: 'POST', body: JSON.stringify({ message: text }) ... });

            // Simulating Navigation Logic based on keywords for now until backend is ready
            let aiResponseText = "";
            let messageType: 'text' | 'chart' | 'nav' = 'text';

            if (text.toLowerCase().includes("usage")) {
                aiResponseText = "Navigating to your Usage Dashboard. Here you can see your consumption breakdown.";
                messageType = 'nav';
                setTimeout(() => navigate('/usage'), 1500);
            } else if (text.toLowerCase().includes("peer") || text.toLowerCase().includes("compare")) {
                aiResponseText = "Opening Peer Analysis. You are currently 12% more efficient than your neighbors.";
                messageType = 'nav';
                setTimeout(() => navigate('/peer'), 1500);
            } else if (text.toLowerCase().includes("weather")) {
                aiResponseText = "Checking Weather Impact. High temperatures this week are increasing your cooling costs.";
                messageType = 'nav';
                setTimeout(() => navigate('/weather'), 1500);
            } else {
                // Fallback to calling the backend API if implemented
                // For now, simple mock echo
                aiResponseText = `I heard: "${text}". I can help you navigate to Usage, Peer Analysis, or Weather insights.`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: aiResponseText, type: messageType }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble connecting to the brain." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 max-h-[600px] h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Mic className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">AskCal Assistant</h3>
                        <p className="text-[10px] text-indigo-100">Voice-enabled Intelligence</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 text-sm mt-20">
                        <Mic className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Tap the microphone to start talking</p>
                        <p className="text-xs mt-1">Try "Take me to Peer Analysis"</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            msg.role === 'user'
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
                        )}>
                            {msg.content}
                            {msg.type === 'nav' && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] opacity-75 font-mono uppercase tracking-wider">
                                    <Navigation className="h-3 w-3" /> Redirecting...
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 rounded-b-xl">
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleListening}
                        className={cn(
                            "p-3 rounded-full transition-all duration-300 shadow-sm",
                            isListening
                                ? "bg-red-500 text-white animate-pulse ring-4 ring-red-100"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Type or speak..."}
                            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                        />
                        <button
                            onClick={() => handleSend(inputValue)}
                            className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            disabled={!inputValue || inputValue === "Listening..."}
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
