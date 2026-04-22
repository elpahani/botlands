import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        className={`
          w-full
          bg-bg-primary
          ${error ? 'border-accent-danger' : 'border-border-medium'}
          border
          rounded-lg
          px-4
          py-2
          text-text-primary
          text-base
          outline-none
          transition-fast
          focus:border-accent-primary
          focus:ring-1
          focus:ring-accent-primary
          placeholder:text-text-tertiary
        `}
        {...props}
      />
      {error && (
        <span className="block mt-1 text-xs text-accent-danger">{error}</span>
      )}
    </div>
  );
};
