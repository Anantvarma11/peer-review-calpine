import { cn } from "@/lib/utils";
import { Mic, Volume2, Loader2 } from "lucide-react";

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOrbProps {
    state: VoiceState;
    className?: string;
}

export function VoiceOrb({ state, className }: VoiceOrbProps) {
    return (
        <div className={cn("relative flex items-center justify-center w-64 h-64", className)}>

            {/* Ambient Glow */}
            <div className={cn(
                "absolute inset-0 rounded-full blur-3xl transition-all duration-1000",
                state === 'idle' && "bg-slate-200/50 scale-75",
                state === 'listening' && "bg-red-200/50 scale-100",
                state === 'processing' && "bg-indigo-200/50 scale-90 animate-pulse",
                state === 'speaking' && "bg-emerald-200/50 scale-110"
            )} />

            {/* Core Orb */}
            <div className={cn(
                "relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 border border-white/20 backdrop-blur-md",
                state === 'idle' && "bg-gradient-to-br from-slate-100 to-slate-200 scale-100",
                state === 'listening' && "bg-gradient-to-br from-red-500 to-orange-500 scale-110 shadow-red-500/30",
                state === 'processing' && "bg-gradient-to-br from-indigo-500 to-purple-600 scale-100 animate-spin-slow shadow-indigo-500/30",
                state === 'speaking' && "bg-gradient-to-br from-emerald-400 to-teal-500 scale-125 shadow-emerald-500/40"
            )}>
                {/* Icon */}
                <div className="text-white transition-all duration-300">
                    {state === 'idle' && <Mic className="w-10 h-10 text-slate-400" />}
                    {state === 'listening' && <Mic className="w-12 h-12 text-white animate-pulse" />}
                    {state === 'processing' && <Loader2 className="w-10 h-10 text-white animate-spin" />}
                    {state === 'speaking' && <Volume2 className="w-12 h-12 text-white animate-bounce" />}
                </div>

                {/* Rings (Listening) */}
                {state === 'listening' && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
                        <div className="absolute -inset-4 rounded-full border border-red-500/20 animate-pulse" />
                    </>
                )}

                {/* Waves (Speaking) */}
                {state === 'speaking' && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-[ping_2s_infinite]" />
                        <div className="absolute -inset-8 rounded-full border-2 border-emerald-500/10 animate-[ping_3s_infinite]" />
                    </>
                )}
            </div>

            {/* Status Label */}
            <div className="absolute -bottom-12 font-medium text-slate-500 text-sm tracking-widest uppercase">
                {state === 'listening' ? 'Listening...' :
                    state === 'processing' ? 'Thinking...' :
                        state === 'speaking' ? 'Speaking...' :
                            'Tap to Speak'}
            </div>
        </div>
    );
}
