import { useEffect, useState } from 'react';
import { useAI } from '@/context/AIContext';
import { X, Sparkles } from 'lucide-react';
import { DataUsageRegular, EyeRegular } from '@fluentui/react-icons';
import { cn } from '@/lib/utils';
import { textToSpeech } from '@/lib/api';

export function AIResponseOverlay() {
    const { isOpen, isThinking, lastResponse, clearResponse } = useAI();
    const [displayedText, setDisplayedText] = useState('');

    // Auto-typing effect
    useEffect(() => {
        if (lastResponse?.text) {
            setDisplayedText('');
            let i = 0;
            const text = lastResponse.text;
            const interval = setInterval(() => {
                setDisplayedText(text.substring(0, i + 1));
                i++;
                if (i > text.length) clearInterval(interval);
            }, 20); // Speed of typing

            // Speak it
            textToSpeech(text).then(blob => {
                if (blob) {
                    const audio = new Audio(URL.createObjectURL(blob));
                    audio.play().catch(e => console.log("Audio play failed (interaction needed)", e));
                }
            });

            return () => clearInterval(interval);
        } else if (isThinking) {
            setDisplayedText("Thinking...");
        }
    }, [lastResponse, isThinking]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 w-full max-w-2xl px-4 pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 flex gap-4 pointer-events-auto items-start">

                {/* AI Avatar / Status Indicator */}
                <div className="shrink-0 pt-1">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isThinking ? "bg-indigo-600 animate-pulse" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    )}>
                        {isThinking ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-white" />
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-lg leading-snug font-medium text-slate-100">
                            {displayedText}
                            {isThinking && <span className="animate-pulse">|</span>}
                        </p>
                    </div>

                    {/* Action Feedback */}
                    {lastResponse?.action && lastResponse.action.type !== 'NONE' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded inline-flex">
                            {lastResponse.action.type === 'UPDATE_CHART' && <span className="flex items-center gap-1"><DataUsageRegular fontSize={16} /> Updating Chart...</span>}
                            {lastResponse.action.type === 'SCROLL_TO' && <span className="flex items-center gap-1"><EyeRegular fontSize={16} /> Scrolling to section...</span>}
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={clearResponse}
                    className="shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
