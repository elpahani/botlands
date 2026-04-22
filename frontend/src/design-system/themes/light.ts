import type { TokenSet } from '../tokens';

/**
 * Light Theme for Botlands
 */
export const lightTheme: TokenSet = {
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8f9fa',
    bgTertiary: '#e9ecef',
    bgElevated: '#ffffff',
    bgOverlay: 'rgba(0, 0, 0, 0.5)',
    
    textPrimary: '#1a1a2e',
    textSecondary: '#5a6680',
    textTertiary: '#8892b0',
    textInverse: '#ffffff',
    
    accentPrimary: '#667eea',
    accentSecondary: '#764ba2',
    accentSuccess: '#22c55e',
    accentWarning: '#f59e0b',
    accentDanger: '#ef4444',
    accentInfo: '#3b82f6',
    
    borderLight: 'rgba(0, 0, 0, 0.05)',
    borderMedium: 'rgba(0, 0, 0, 0.1)',
    borderFocus: '#667eea',
    
    gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientHero: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },
  
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "'Fira Code', 'Consolas', monospace",
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 60px rgba(0, 0, 0, 0.2)',
    glow: '0 0 40px rgba(102, 126, 234, 0.15)',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};
