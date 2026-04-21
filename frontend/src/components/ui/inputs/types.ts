export type InputType = 'text' | 'number' | 'slider' | 'select' | 'textarea' | 'boolean';

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface InputConfig {
    name: string;          // Уникальный идентификатор поля (передается на бэкенд)
    label: string;         // Человекочитаемое название
    type: InputType;       // Тип поля (определяет какой компонент будет отрендерен)
    placeholder?: string;  // Плейсхолдер для текстовых полей
    description?: string;  // Подсказка под полем
    defaultValue?: any;    // Значение по умолчанию
    required?: boolean;    // Обязательное ли поле
    
    // Специфичные настройки для number / slider
    min?: number;
    max?: number;
    step?: number;
    
    // Специфичные настройки для select
    options?: SelectOption[];
}

export interface DynamicInputProps {
    config: InputConfig;
    value: any;
    onChange: (name: string, value: any) => void;
}
