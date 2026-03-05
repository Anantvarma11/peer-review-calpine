import { useState } from 'react';

interface SimpleTooltipProps {
    content: string;
    children: React.ReactNode;
}

export function SimpleTooltip({ content, children }: SimpleTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[10px] leading-relaxed rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 w-max max-width-[200px] text-center border border-slate-700/50 backdrop-blur-sm" style={{ maxWidth: '200px', width: 'max-content' }}>
                    {content}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
            )}
        </div>
    );
}
