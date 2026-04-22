import React from 'react';
import { useTheme } from '../ThemeProvider';

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
  const { currentTheme } = useTheme();
  const { colors } = currentTheme;

  const inputStyles: React.CSSProperties = {
    background: colors.bgPrimary,
    border: `1px solid ${error ? colors.accentDanger : colors.borderMedium}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    color: colors.textPrimary,
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-base)',
    width: '100%',
    outline: 'none',
    transition: 'var(--transition-fast)',
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: 'var(--spacing-xs)',
    color: colors.textSecondary,
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
  };

  const errorStyles: React.CSSProperties = {
    color: colors.accentDanger,
    fontSize: 'var(--font-size-xs)',
    marginTop: 'var(--spacing-xs)',
  };

  return (
    <div className={`botlands-input-wrapper ${className}`}>
      {label && <label style={labelStyles}>{label}</label>}
      <input style={inputStyles} {...props} />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
};
