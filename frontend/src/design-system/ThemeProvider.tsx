import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { TokenSet } from './tokens';
import { darkTheme } from './themes/dark';
import { defaultPresets, getPresetById } from './themes/presets';
import type { ThemePreset } from './themes/presets';

/**
 * Theme Context for Botlands
 * Provides current theme tokens and theme switching
 */

interface ThemeContextType {
  currentTheme: TokenSet;
  currentPresetId: string;
  presets: ThemePreset[];
  setPreset: (presetId: string) => void;
  setCustomTheme: (theme: TokenSet) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'botlands-theme-preset';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPresetId, setCurrentPresetId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });
  
  const [currentTheme, setCurrentTheme] = useState<TokenSet>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const preset = saved ? getPresetById(saved) : undefined;
    return preset?.tokens || darkTheme;
  });

  const setPreset = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (preset) {
      setCurrentTheme(preset.tokens);
      setCurrentPresetId(presetId);
      localStorage.setItem(STORAGE_KEY, presetId);
    }
  }, []);

  const setCustomTheme = useCallback((theme: TokenSet) => {
    setCurrentTheme(theme);
    setCurrentPresetId('custom');
  }, []);

  // Apply CSS variables on theme change
  useEffect(() => {
    const root = document.documentElement;
    const { colors, spacing, typography, radius, shadows, transitions } = currentTheme;
    
    // Colors
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Spacing
    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Typography
    root.style.setProperty('--font-family', typography.fontFamily);
    root.style.setProperty('--font-mono', typography.fontMono);
    Object.entries(typography.sizes).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    
    // Radius
    Object.entries(radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    // Shadows
    Object.entries(shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Transitions
    Object.entries(transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });
  }, [currentTheme]);

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
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
