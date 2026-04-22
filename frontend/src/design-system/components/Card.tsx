import React from 'react';
import { useTheme } from '../ThemeProvider';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevation = 'md',
  hover = false,
  children,
  className = '',
  ...props
}) => {
  const { currentTheme } = useTheme();
  const { colors } = currentTheme;

  const elevationStyles: Record<string, React.CSSProperties> = {
    none: { boxShadow: 'none' },
    sm: { boxShadow: 'var(--shadow-sm)' },
    md: { boxShadow: 'var(--shadow-md)' },
    lg: { boxShadow: 'var(--shadow-lg)' },
  };

  const baseStyles: React.CSSProperties = {
    background: colors.bgSecondary,
    borderRadius: 'var(--radius-lg)',
    border: `1px solid ${colors.borderLight}`,
    padding: 'var(--spacing-lg)',
    transition: 'var(--transition-fast)',
  };

  const hoverStyles: React.CSSProperties = hover ? {
    cursor: 'pointer',
  } : {};

  return (
    <div
      style={{
        ...baseStyles,
        ...elevationStyles[elevation],
        ...hoverStyles,
      }}
      className={`botlands-card ${hover ? 'botlands-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
