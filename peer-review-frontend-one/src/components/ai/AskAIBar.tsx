import { useState, useRef, useEffect } from 'react';
import { Mic, Paperclip, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAI } from '@/context/AIContext';

interface AskAIBarProps {
    className?: string;
    onExpand?: (expanded: boolean) => void;
    customerId?: string;
}

export function AskAIBar({ className, onExpand, customerId }: AskAIBarProps) {
    const { askAI } = useAI();
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognition = useRef<any>(null);
    const navigate = useNavigate();

    // Voice Setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.lang = 'en-US';

            recognition.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                handleSearch(transcript);
                setIsListening(false);
            };

            recognition.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognition.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognition.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error("Mic Error", e);
            }
        }
    };

    const handleSearch = (textOverride?: string) => {
        const text = textOverride || query;
        if (!text.trim()) return;

        // If on Dashboard (has customerId) -> Use Overlay
        if (customerId) {
            askAI(text, customerId);
        } else {
            // Fallback -> Navigate to Ask Page
            navigate('/ask', { state: { initialQuery: text } });
        }

        setQuery('');
        inputRef.current?.blur();
    };

    const handleFocus = () => {
        setIsFocused(true);
        onExpand?.(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Delay collapsing to allow clicks
        setTimeout(() => onExpand?.(false), 200);
    };

    return (
        <div className={cn(
            "relative flex items-center transition-all duration-300 ease-in-out",
            isFocused ? "w-full" : "w-full",
            className
        )}>
            {/* Main Bar */}
            <div className={cn(
                "flex items-center w-full h-12 bg-slate-100 rounded-full border border-slate-200 transition-shadow",
                isFocused ? "bg-white shadow-lg ring-2 ring-indigo-100 border-indigo-200" : "hover:border-slate-300"
            )}>

                {/* Attachment Icon */}
                <button className="pl-4 pr-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Paperclip className="h-5 w-5" />
                </button>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="What's on your mind?"
                    className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 placeholder:text-slate-500 text-sm"
                />

                {/* Right Actions */}
                <div className="flex items-center pr-2 gap-1">
                    {/* Auto Badge / Sparkles */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm mr-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-xs font-medium text-slate-600">Auto</span>
                    </div>

                    {/* Mic Button */}
                    <button
                        onClick={toggleListening}
                        className={cn(
                            "p-2 rounded-full transition-all duration-300 flex items-center justify-center",
                            isListening ? "bg-red-500 text-white shadow-md animate-pulse" : "bg-black text-white hover:bg-slate-800"
                        )}
                    >
                        {isListening ? (
                            <div className="h-4 w-4 bg-white rounded-sm animate-pulse" /> // Stop Icon look
                        ) : (
                            // Waveform look
                            <Mic className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AskAIBar;
