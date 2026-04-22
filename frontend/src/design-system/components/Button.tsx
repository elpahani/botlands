import React from 'react';

/**
 * Button Component
 * Pure Tailwind — uses CSS variables via @theme, no JS theme logic
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  // Base styles — all via Tailwind classes using CSS variables
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold cursor-pointer transition-fast border-none';
  
  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-5 py-2.5 text-base rounded-lg',
    lg: 'px-7 py-3.5 text-lg rounded-xl',
  };
  
  // Color variants — all use CSS variables from @theme
  const variantClasses = {
    primary: 'bg-accent-primary text-text-inverse shadow-md hover:brightness-110 active:brightness-90',
    secondary: 'bg-bg-elevated text-text-primary border border-border-medium hover:bg-bg-tertiary active:bg-bg-elevated',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary active:bg-bg-tertiary',
    danger: 'bg-accent-danger text-text-inverse shadow-md hover:brightness-110 active:brightness-90',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
