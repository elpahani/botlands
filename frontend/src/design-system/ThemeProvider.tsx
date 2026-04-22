import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { TokenSet } from './tokens';
import { darkTheme } from './themes/dark';
import { defaultPresets, getPresetById } from './themes/presets';
import type { ThemePreset } from './themes/presets';

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

  // Apply theme by setting data-theme attribute on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentPresetId);
  }, [currentPresetId]);

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