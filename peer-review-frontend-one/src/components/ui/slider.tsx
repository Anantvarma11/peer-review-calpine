import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number[]
    min: number
    max: number
    step?: number
    onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, min, max, step = 1, onValueChange, ...props }, ref) => {

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onValueChange) {
                onValueChange([parseFloat(e.target.value)])
            }
        }

        // Calculate percentage for background gradient
        const percent = ((value[0] - min) / (max - min)) * 100;

        return (
            <div className="relative w-full h-6 flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={handleChange}
                    className={cn(
                        "w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600",
                        className
                    )}
                    style={{
                        background: `linear-gradient(to right, #4f46e5 ${percent}%, #e2e8f0 ${percent}%)`
                    }}
                    ref={ref}
                    {...props}
                />
            </div>

        )
    }
)
Slider.displayName = "Slider"

export { Slider }
