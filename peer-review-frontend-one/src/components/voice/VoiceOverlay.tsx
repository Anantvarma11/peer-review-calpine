import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendVoiceCommand, textToSpeech } from '@/lib/api';
import { X, Volume2, VolumeX } from 'lucide-react';
import { MicRegular, ChatRegular } from '@fluentui/react-icons';
import { cn } from '@/lib/utils';

interface VoiceOverlayProps {
    onChartUpdate?: (params: any) => void;
    currentPage?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceOverlay({ onChartUpdate, currentPage = 'dashboard', isOpen, onClose }: VoiceOverlayProps) {
    const navigate = useNavigate();
    const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    // Keep only the last message for the floating bar
    const [lastMessage, setLastMessage] = useState<string>("Listening...");
    const recognition = useRef<any>(null);

    // Initial Setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = true; // Enable typing effect
            recognition.current.lang = 'en-US';

            recognition.current.onstart = () => {
                setVoiceState('listening');
                setLastMessage("Listening...");
            };

            recognition.current.onresult = async (event: any) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const text = event.results[i][0].transcript;
                        setLastMessage(text);
                        await handleVoiceCommand(text);
                    } else {
                        interim += event.results[i][0].transcript;
                        setLastMessage(interim);
                    }
                }
            };

            recognition.current.onend = () => {
                // If we are just 'listening' and it ends without result, we might want to close or go idle
                // For now, let's just stay open but idle? Or auto-close if silence?
                // User asked for "Google Meet Stop Sharing bar" style - which persists until closed?
                // But recognition stops.
                if (voiceState === 'listening') {
                    // Didn't catch anything?
                    // setVoiceState('idle'); 
                }
            };

            recognition.current.onerror = (event: any) => {
                console.error("Speech Error", event.error);
                setVoiceState('idle');
                setLastMessage("Error listening. Try again.");
            };
        }
    }, []);

    // Sync Props with Recognition
    useEffect(() => {
        if (isOpen) {
            try {
                recognition.current?.start();
            } catch (e) {
                // Already started
            }
        } else {
            recognition.current?.stop();
            setVoiceState('idle');
        }
    }, [isOpen]);

    const handleVoiceCommand = async (text: string) => {
        setVoiceState('processing');

        try {
            const result = await sendVoiceCommand(text, currentPage);
            setLastMessage(result.response_text);

            // 1. Navigation
            if (result.action === 'NAVIGATE' && result.parameters?.route) {
                navigate(result.parameters.route);
            }

            // 2. Scroll & Highlight
            if (result.action === 'SCROLL_TO' && result.parameters?.target_id) {
                // Wait for navigation if needed? Timeout?
                setTimeout(() => {
                    const element = document.getElementById(result.parameters.target_id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Visual pulse effect
                        element.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2', 'transition-all', 'duration-500');
                        setTimeout(() => {
                            element.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2');
                        }, 2500);
                    }
                }, 100); // Small delay to allow react render/nav
            }

            // 3. Chart/Component Update
            if (result.action === 'UPDATE_CHART' && onChartUpdate) {
                onChartUpdate(result);
            }

            // Speak Response & Handle Conversation Loop
            setVoiceState('speaking');
            if (isVoiceEnabled) {
                const audioBlob = await textToSpeech(result.response_text);
                if (audioBlob) {
                    const audio = new Audio(URL.createObjectURL(audioBlob));
                    audio.onended = () => {
                        if (result.should_continue) {
                            setVoiceState('listening');
                            try { recognition.current?.start(); } catch (e) { }
                        } else {
                            setVoiceState('idle');
                        }
                    };
                    await audio.play();
                } else {
                    // Fallback
                    setTimeout(() => {
                        if (result.should_continue) {
                            setVoiceState('listening');
                            try { recognition.current?.start(); } catch (e) { }
                        } else {
                            setVoiceState('idle');
                        }
                    }, 2000);
                }
            } else {
                setTimeout(() => {
                    if (result.should_continue) {
                        setVoiceState('listening');
                        try { recognition.current?.start(); } catch (e) { }
                    } else {
                        setVoiceState('idle');
                    }
                }, 2000);
            }

        } catch (e) {
            setLastMessage("Connection failed.");
            setVoiceState('idle');
        }
    };

    const [inputMode, setInputMode] = useState<'voice' | 'chat'>('voice');
    const [chatInput, setChatInput] = useState('');

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const query = chatInput.trim();
        setChatInput('');
        setLastMessage(query);
        await handleVoiceCommand(query);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[380px] max-w-[600px] border border-slate-700/50">
                {/* Mode Toggle - Voice / Chat */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                        <button
                            onClick={() => { setInputMode('voice'); recognition.current?.start(); }}
                            className={`px-3 py-1 flex items-center gap-1.5 rounded-md text-xs font-medium transition-all ${inputMode === 'voice' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <MicRegular fontSize={14} /> Voice
                        </button>
                        <button
                            onClick={() => { setInputMode('chat'); recognition.current?.stop(); }}
                            className={`px-3 py-1 flex items-center gap-1.5 rounded-md text-xs font-medium transition-all ${inputMode === 'chat' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ChatRegular fontSize={14} /> Chat
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            recognition.current?.stop();
                            onClose();
                        }}
                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-slate-400"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Voice Mode UI */}
                {inputMode === 'voice' && (
                    <div className="flex items-center gap-4 px-2">
                        {/* Mini Orb Visualizer */}
                        <div className="shrink-0 relative flex items-center justify-center w-10 h-10">
                            <div className={cn(
                                "absolute inset-0 rounded-full opacity-50 blur-md transition-all",
                                voiceState === 'listening' ? "bg-red-500 animate-pulse" :
                                    voiceState === 'processing' ? "bg-indigo-500 animate-pulse" :
                                        voiceState === 'speaking' ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                            )} />
                            <div className={cn(
                                "relative w-full h-full rounded-full flex items-center justify-center border border-white/10 transition-all",
                                voiceState === 'listening' ? "bg-gradient-to-br from-red-500 to-orange-600" :
                                    voiceState === 'processing' ? "bg-gradient-to-br from-indigo-500 to-purple-600 animate-spin" :
                                        voiceState === 'speaking' ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-slate-700"
                            )}>
                                {voiceState === 'listening' ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white animate-ping" />
                                ) : (
                                    <div className="w-3 h-3 rounded-full bg-white" />
                                )}
                            </div>
                        </div>

                        {/* Text Area */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={cn(
                                "text-sm font-medium truncate transition-colors",
                                voiceState === 'listening' ? "text-slate-300" : "text-white"
                            )}>
                                {lastMessage}
                            </p>
                            {voiceState === 'processing' && (
                                <p className="text-xs text-indigo-400 animate-pulse">Thinking...</p>
                            )}
                        </div>

                        {/* Voice Controls */}
                        <button
                            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                            title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
                        >
                            {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                    </div>
                )}

                {/* Chat Mode UI */}
                {inputMode === 'chat' && (
                    <form onSubmit={handleChatSubmit} className="flex items-center gap-2 px-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || voiceState === 'processing'}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {voiceState === 'processing' ? 'Thinking...' : 'Send'}
                        </button>
                    </form>
                )}

                {/* Response Area for Chat Mode */}
                {inputMode === 'chat' && lastMessage !== 'Listening...' && (
                    <div className="px-2 py-2 bg-slate-800/50 rounded-lg max-h-32 overflow-y-auto">
                        <p className="text-sm text-slate-300">{lastMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

