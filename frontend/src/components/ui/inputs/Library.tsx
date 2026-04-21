import type { InputConfig } from './types.js';

export function TextInput({ config, value, onChange }: { config: InputConfig, value: any, onChange: (n: string, v: any) => void }) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{config.label}</label>
            <input 
                type="text" 
                value={value || ''}
                onChange={e => onChange(config.name, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-shadow"
                placeholder={config.placeholder || `Enter ${config.label}...`}
                required={config.required}
            />
            {config.description && <p className="text-[10px] text-slate-500 mt-1">{config.description}</p>}
        </div>
    );
}

export function NumberInput({ config, value, onChange }: { config: InputConfig, value: any, onChange: (n: string, v: any) => void }) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{config.label}</label>
            <input 
                type="number" 
                value={value || ''}
                onChange={e => onChange(config.name, parseFloat(e.target.value))}
                min={config.min}
                max={config.max}
                step={config.step}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-shadow"
                placeholder={config.placeholder || `Enter ${config.label}...`}
                required={config.required}
            />
            {config.description && <p className="text-[10px] text-slate-500 mt-1">{config.description}</p>}
        </div>
    );
}

export function SliderInput({ config, value, onChange }: { config: InputConfig, value: any, onChange: (n: string, v: any) => void }) {
    const val = value ?? config.min ?? 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">{config.label}</label>
                <span className="text-xs font-mono bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded">{val}</span>
            </div>
            <input 
                type="range" 
                value={val}
                onChange={e => onChange(config.name, parseFloat(e.target.value))}
                min={config.min ?? 0}
                max={config.max ?? 100}
                step={config.step ?? 1}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            {config.description && <p className="text-[10px] text-slate-500 mt-1">{config.description}</p>}
        </div>
    );
}

export function SelectInput({ config, value, onChange }: { config: InputConfig, value: any, onChange: (n: string, v: any) => void }) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{config.label}</label>
            <select 
                value={value || ''}
                onChange={e => onChange(config.name, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-shadow"
                required={config.required}
            >
                <option value="" disabled>Select {config.label}</option>
                {config.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {config.description && <p className="text-[10px] text-slate-500 mt-1">{config.description}</p>}
        </div>
    );
}

export function BooleanInput({ config, value, onChange }: { config: InputConfig, value: any, onChange: (n: string, v: any) => void }) {
    const val = value ?? config.defaultValue ?? false;
    return (
        <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                checked={val}
                onChange={e => onChange(config.name, e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <div>
                <label className="text-xs font-bold text-slate-700 cursor-pointer">{config.label}</label>
                {config.description && <p className="text-[10px] text-slate-500">{config.description}</p>}
            </div>
        </div>
    );
}

export function TextareaInput({ config, value, onChange }: { config: InputConfig, value: any, onChange: (n: string, v: any) => void }) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{config.label}</label>
            <textarea 
                value={value || ''}
                onChange={e => onChange(config.name, e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-shadow resize-y"
                placeholder={config.placeholder || `Enter ${config.label}...`}
                required={config.required}
            />
            {config.description && <p className="text-[10px] text-slate-500 mt-1">{config.description}</p>}
        </div>
    );
}
