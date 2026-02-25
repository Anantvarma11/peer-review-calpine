import { useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface TranscriptItem {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

interface TranscriptionPanelProps {
    items: TranscriptItem[];
    className?: string;
}

export function TranscriptionPanel({ items, className }: TranscriptionPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div className={cn("flex flex-col gap-4 p-4 overflow-y-auto max-h-[300px] bg-slate-50/50 rounded-xl border border-slate-100", className)}>
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        "flex gap-3 max-w-[90%]",
                        item.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                >
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                        item.role === 'user' ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-emerald-600"
                    )}>
                        {item.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                            item.role === 'user'
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                        )}>
                            {item.text}
                        </div>
                        <span className="text-[10px] text-slate-400 px-1">
                            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
