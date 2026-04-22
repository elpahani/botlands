import { TokenSet } from '../tokens';

/**
 * Dark Theme — Default for Botlands
 * Inspired by modern dark UIs (Linear, Vercel, GitHub Dark)
 */
export const darkTheme: TokenSet = {
  colors: {
    bgPrimary: '#0f0f1a',
    bgSecondary: '#1a1a2e',
    bgTertiary: '#16213e',
    bgElevated: '#1e1e3f',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',
    
    textPrimary: '#e0e0ff',
    textSecondary: '#8892b0',
    textTertiary: '#5a6680',
    textInverse: '#0f0f1a',
    
    accentPrimary: '#667eea',
    accentSecondary: '#764ba2',
    accentSuccess: '#4ade80',
    accentWarning: '#fbbf24',
    accentDanger: '#f87171',
    accentInfo: '#60a5fa',
    
    borderLight: 'rgba(255, 255, 255, 0.05)',
    borderMedium: 'rgba(255, 255, 255, 0.1)',
    borderFocus: '#667eea',
    
    gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientHero: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 60px rgba(0, 0, 0, 0.5)',
    glow: '0 0 40px rgba(102, 126, 234, 0.2)',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};
