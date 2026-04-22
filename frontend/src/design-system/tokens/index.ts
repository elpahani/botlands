/**
 * Botlands Design Tokens
 * Single source of truth for all visual values
 */

export interface TokenSet {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  transitions: TransitionTokens;
}

export interface ColorTokens {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgOverlay: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Accents
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;
  accentInfo: string;
  
  // Borders
  borderLight: string;
  borderMedium: string;
  borderFocus: string;
  
  // Gradients
  gradientPrimary: string;
  gradientHero: string;
}

export interface SpacingTokens {
  xs: string;   // 4px
  sm: string;   // 8px
  md: string;   // 16px
  lg: string;   // 24px
  xl: string;   // 32px
  xxl: string;  // 48px
  xxxl: string; // 64px
}

export interface TypographyTokens {
  fontFamily: string;
  fontMono: string;
  
  sizes: {
    xs: string;   // 12px
    sm: string;   // 14px
    base: string; // 16px
    lg: string;   // 18px
    xl: string;   // 20px
    '2xl': string;// 24px
    '3xl': string;// 30px
    '4xl': string;// 36px
    '5xl': string;// 48px
  };
  
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface RadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  glow: string;
}

export interface TransitionTokens {
  fast: string;
  normal: string;
  slow: string;
}
