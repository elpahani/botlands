import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { TokenSet } from './tokens';
import type { TypographyTokens } from './tokens/typography';
import type { SpacingTokens } from './tokens/spacing';
import type { ComponentTokens } from './tokens/components';
import type { LayoutTokens } from './tokens/layout';
import { darkTheme } from './themes/dark';
import { defaultPresets, getPresetById } from './themes/presets';
import type { ThemePreset } from './themes/presets';
import { defaultTypography } from './tokens/typography';
import { defaultSpacing } from './tokens/spacing';
import { defaultComponents } from './tokens/components';
import { defaultLayout } from './tokens/layout';

interface ThemeContextType {
  // Theme
  currentTheme: TokenSet;
  currentPresetId: string;
  presets: ThemePreset[];
  setPreset: (presetId: string) => void;
  setCustomTheme: (theme: TokenSet) => void;
  isDark: boolean;
  
  // Typography
  typography: TypographyTokens;
  setTypography: (t: TypographyTokens) => void;
  
  // Spacing
  spacing: SpacingTokens;
  setSpacing: (s: SpacingTokens) => void;
  
  // Components
  components: ComponentTokens;
  setComponents: (c: ComponentTokens) => void;
  
  // Layout
  layout: LayoutTokens;
  setLayout: (l: LayoutTokens) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  preset: 'botlands-theme-preset',
  typography: 'botlands-typography',
  spacing: 'botlands-spacing',
  components: 'botlands-components',
  layout: 'botlands-layout',
};

// Load from localStorage with fallback
const loadSaved = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme preset
  const [currentPresetId, setCurrentPresetId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.preset) || 'dark';
  });
  
  const [currentTheme, setCurrentTheme] = useState<TokenSet>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.preset);
    const preset = saved ? getPresetById(saved) : undefined;
    return preset?.tokens || darkTheme;
  });

  // Typography
  const [typography, setTypographyState] = useState<TypographyTokens>(() =>
    loadSaved(STORAGE_KEYS.typography, defaultTypography)
  );

  // Spacing
  const [spacing, setSpacingState] = useState<SpacingTokens>(() =>
    loadSaved(STORAGE_KEYS.spacing, defaultSpacing)
  );

  // Components
  const [components, setComponentsState] = useState<ComponentTokens>(() =>
    loadSaved(STORAGE_KEYS.components, defaultComponents)
  );

  // Layout
  const [layout, setLayoutState] = useState<LayoutTokens>(() =>
    loadSaved(STORAGE_KEYS.layout, defaultLayout)
  );

  const setPreset = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      setCurrentTheme(preset.tokens);
      setCurrentPresetId(presetId);
      localStorage.setItem(STORAGE_KEYS.preset, presetId);
    }
  }, []);

  const setCustomTheme = useCallback((theme: TokenSet) => {
    setCurrentTheme(theme);
    setCurrentPresetId('custom');
  }, []);

  const setTypography = useCallback((t: TypographyTokens) => {
    setTypographyState(t);
    localStorage.setItem(STORAGE_KEYS.typography, JSON.stringify(t));
  }, []);

  const setSpacing = useCallback((s: SpacingTokens) => {
    setSpacingState(s);
    localStorage.setItem(STORAGE_KEYS.spacing, JSON.stringify(s));
  }, []);

  const setComponents = useCallback((c: ComponentTokens) => {
    setComponentsState(c);
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(c));
  }, []);

  const setLayout = useCallback((l: LayoutTokens) => {
    setLayoutState(l);
    localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify(l));
  }, []);

  // Apply theme by setting data-theme attribute and CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentPresetId);
  }, [currentPresetId]);

  // Apply color tokens as CSS variables (overrides data-theme presets)
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    // Convert camelCase to kebab-case and set as CSS variables with --theme- prefix
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }, [currentTheme]);

  // Apply typography CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-font-family', typography.fontFamily);
    root.style.setProperty('--theme-font-mono', typography.fontMono);
    root.style.setProperty('--theme-font-size', `${typography.fontSizeBase}px`);
    root.style.setProperty('--theme-font-weight', String(typography.fontWeight));
    root.style.setProperty('--theme-line-height', String(typography.lineHeight));
  }, [typography]);

  // Apply spacing CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const densityMap = {
      compact: '0.75',
      normal: '1',
      comfortable: '1.25',
    };
    root.style.setProperty('--theme-density', densityMap[spacing.density]);
    root.style.setProperty('--theme-sidebar-width', `${spacing.sidebarWidth}px`);
    
    const radiusMap = {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
    };
    root.style.setProperty('--theme-border-radius', radiusMap[spacing.borderRadius]);
  }, [spacing]);

  // Apply component CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-button-style', components.buttonStyle);
    
    const shadowMap = {
      none: 'none',
      sm: '0 1px 2px rgba(0,0,0,0.1)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    };
    root.style.setProperty('--theme-card-shadow', shadowMap[components.cardShadow]);
    root.style.setProperty('--theme-input-style', components.inputStyle);
  }, [components]);

  // Apply layout CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-tab-style', layout.tabStyle);
    root.style.setProperty('--theme-sidebar-position', layout.sidebarPosition);
  }, [layout]);

  const isDark = ['dark', 'midnight', 'minimal', 'neon'].includes(currentPresetId);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        currentPresetId,
        presets: defaultPresets,
        setPreset,
        setCustomTheme,
        isDark,
        typography,
        setTypography,
        spacing,
        setSpacing,
        components,
        setComponents,
        layout,
        setLayout,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
