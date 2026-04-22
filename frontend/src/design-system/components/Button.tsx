import React from 'react';
import { useTheme } from '../ThemeProvider';

/**
 * Button Component
 * Uses CSS variables from theme system
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
  const { currentTheme } = useTheme();
  const { colors } = currentTheme;

  const baseStyles: React.CSSProperties = {
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    fontFamily: 'var(--font-family)',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 'var(--font-size-sm)' },
    md: { padding: '10px 20px', fontSize: 'var(--font-size-base)' },
    lg: { padding: '14px 28px', fontSize: 'var(--font-size-lg)' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: colors.gradientPrimary,
      color: colors.textInverse,
      boxShadow: 'var(--shadow-md)',
    },
    secondary: {
      background: colors.bgElevated,
      color: colors.textPrimary,
      border: `1px solid ${colors.borderMedium}`,
    },
    ghost: {
      background: 'transparent',
      color: colors.textSecondary,
    },
    danger: {
      background: colors.accentDanger,
      color: colors.textInverse,
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      className={`botlands-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
