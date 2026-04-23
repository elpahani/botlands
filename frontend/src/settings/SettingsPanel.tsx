import { X } from 'lucide-react';
import { useTheme } from '../design-system/ThemeProvider';
import { getPresetOptions } from '../design-system/themes/presets';
import { TypographySection } from './TypographySection';
import { SpacingSection } from './SpacingSection';
import { ComponentsSection } from './ComponentsSection';
import { LayoutSection } from './LayoutSection';
import type { ColorTokens } from '../design-system/tokens';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { currentPresetId, setPreset, presets, setCustomTheme, currentTheme } = useTheme();
  const presetOptions = getPresetOptions();

  // Handle color change from picker
  const handleColorChange = (key: keyof ColorTokens, value: string) => {
    setCustomTheme({
      ...currentTheme,
      colors: { ...currentTheme.colors, [key]: value }
    });
  };
  
  // Convert rgb/rgba to hex
  const rgbToHex = (rgb: string): string => {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb.startsWith('#') ? rgb : '#000000';
    const [, r, g, b] = match;
    return '#' + [r, g, b].map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Get color value helper - reads from CSS variable
  const getColor = (key: keyof ColorTokens): string => {
    if (typeof window === 'undefined') return '#000000';
    const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    return rgbToHex(value) || '#000000';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-bg-primary border border-border-medium"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-medium flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            ⚙️ Settings
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Theme Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-text-secondary">
              🎨 Theme Presets
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetOptions.map((preset) => {
                const presetData = presets.find((p) => p.id === preset.id);
                const isActive = currentPresetId === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => setPreset(preset.id)}
                    className={`relative p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                      isActive
                        ? 'border-accent-primary bg-accent-primary/10'
                        : 'border-border-medium hover:border-accent-primary/50 bg-bg-secondary'
                    }`}
                  >
                    {/* Color Preview */}
                    <div
                      className="w-full h-8 rounded-lg mb-3"
                      style={{
                        background:
                          presetData?.tokens.colors?.gradientPrimary ||
                          'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
                      }}
                    />

                    <div className="font-semibold text-sm mb-1 text-text-primary">
                      {preset.name}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {presetData?.description || ''}
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs bg-accent-primary text-text-inverse">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-text-secondary">
              🎯 Custom Colors
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'accentPrimary' as keyof ColorTokens, label: 'Accent' },
                { key: 'accentSecondary' as keyof ColorTokens, label: 'Secondary' },
                { key: 'bgPrimary' as keyof ColorTokens, label: 'Background' },
                { key: 'textPrimary' as keyof ColorTokens, label: 'Text' },
                { key: 'borderMedium' as keyof ColorTokens, label: 'Border' },
                { key: 'bgElevated' as keyof ColorTokens, label: 'Elevated' },
              ].map((color) => (
                <div key={String(color.key)} className="flex items-center gap-3 p-3 rounded-lg border border-border-medium bg-bg-secondary">
                  <input
                    type="color"
                    value={getColor(color.key)}
                    onChange={(e) => handleColorChange(color.key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{color.label}</div>
                    <div className="text-xs text-text-tertiary">
                      {getColor(color.key)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <TypographySection />

          {/* Spacing */}
          <SpacingSection />

          {/* Components */}
          <ComponentsSection />

          {/* Layout */}
          <LayoutSection />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-medium flex justify-between items-center bg-bg-secondary">
          <span className="text-sm text-text-tertiary">
            Active: {presets.find((p) => p.id === currentPresetId)?.name || currentPresetId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-primary text-text-inverse hover:bg-accent-primary/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
