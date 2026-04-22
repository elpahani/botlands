import type { TokenSet } from '../tokens';
import { darkTheme } from './dark';
import { lightTheme } from './light';

/**
 * Preset Themes for Botlands
 * Users can switch between these or create custom ones
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  tokens: TokenSet;
}

export const defaultPresets: ThemePreset[] = [
  {
    id: 'dark',
    name: 'Dark (Default)',
    description: 'Modern dark theme with purple accents',
    tokens: darkTheme,
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme for daytime use',
    tokens: lightTheme,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue-black for late night sessions',
    tokens: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        bgPrimary: '#000000',
        bgSecondary: '#0a0a0f',
        bgTertiary: '#12121f',
        accentPrimary: '#8b5cf6',
        accentSecondary: '#a78bfa',
      },
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Green tones for nature lovers',
    tokens: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        accentPrimary: '#10b981',
        accentSecondary: '#34d399',
        accentSuccess: '#6ee7b7',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming blue tones',
    tokens: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        accentPrimary: '#0ea5e9',
        accentSecondary: '#38bdf8',
        accentInfo: '#7dd3fc',
      },
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and coral tones',
    tokens: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        accentPrimary: '#f97316',
        accentSecondary: '#fb923c',
        accentWarning: '#fdba74',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Monochrome, maximum contrast',
    tokens: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        bgPrimary: '#000000',
        bgSecondary: '#111111',
        bgTertiary: '#222222',
        textPrimary: '#ffffff',
        textSecondary: '#aaaaaa',
        accentPrimary: '#ffffff',
        accentSecondary: '#888888',
      },
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'High contrast neon accents on dark',
    tokens: {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        accentPrimary: '#00ff88',
        accentSecondary: '#00ccff',
        accentSuccess: '#00ff00',
        accentWarning: '#ffff00',
        accentDanger: '#ff00ff',
      },
    },
  },
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return defaultPresets.find(p => p.id === id);
}

/**
 * Get all preset IDs
 */
export function getPresetIds(): string[] {
  return defaultPresets.map(p => p.id);
}

/**
 * Get preset names for UI
 */
export function getPresetOptions(): { id: string; name: string }[] {
  return defaultPresets.map(p => ({ id: p.id, name: p.name }));
}
