import React from 'react';

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
  return (
    <div
      className={`
        bg-bg-secondary
        rounded-lg
        border border-border-light
        p-6
        transition-fast
        ${
          elevation === 'none' ? '' :
          elevation === 'sm' ? 'shadow-sm' :
          elevation === 'md' ? 'shadow-md' :
          elevation === 'lg' ? 'shadow-lg' : 'shadow-md'
        }
        ${hover ? 'cursor-pointer hover:border-accent-primary/30' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
