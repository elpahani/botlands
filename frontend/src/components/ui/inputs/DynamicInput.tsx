import type { DynamicInputProps } from './types.js';
import { TextInput, NumberInput, SliderInput, SelectInput, BooleanInput, TextareaInput } from './Library.js';

export function DynamicInput({ config, value, onChange }: DynamicInputProps) {
    switch (config.type) {
        case 'text':
            return <TextInput config={config} value={value} onChange={onChange} />;
        case 'number':
            return <NumberInput config={config} value={value} onChange={onChange} />;
        case 'slider':
            return <SliderInput config={config} value={value} onChange={onChange} />;
        case 'select':
            return <SelectInput config={config} value={value} onChange={onChange} />;
        case 'boolean':
            return <BooleanInput config={config} value={value} onChange={onChange} />;
        case 'textarea':
            return <TextareaInput config={config} value={value} onChange={onChange} />;
        default:
            return <TextInput config={config} value={value} onChange={onChange} />;
    }
}
