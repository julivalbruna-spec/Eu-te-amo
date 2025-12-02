import React from 'react';
import { RotateCcw } from 'react-feather';

interface SliderInputProps {
    label: string;
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    placeholder?: string;
    onReset?: () => void;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min, max, step = 1, unit = '', placeholder, onReset }) => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = e.target.value === '' ? undefined : Number(e.target.value);
        onChange(numValue);
    };
    
    const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if(onReset) {
            onReset();
        } else {
            onChange(undefined);
        }
    }

    const displayValue = value === undefined ? '' : value;

    return (
        <div>
            <label className="text-sm text-gray-400 block mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value ?? min} // Slider needs a concrete value
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="relative w-28">
                    <input
                        type="number"
                        value={displayValue}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        min={min}
                        max={max}
                        step={step}
                        className="w-full bg-black border border-[#27272a] rounded-lg p-2 text-center text-sm pr-6"
                    />
                    {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{unit}</span>}
                </div>
                
                <button onClick={handleReset} title="Resetar para o padrão" className="text-gray-500 hover:text-white">
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
    );
};

export default SliderInput;
