import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import { getPresetOptions } from '../design-system/themes/presets';

/**
 * Settings Panel for Botlands
 * Allows users to customize themes and UI preferences
 */
export const SettingsPanel: React.FC = () => {
  const { currentPresetId, setPreset, presets } = useTheme();
  const presetOptions = getPresetOptions();

  return (
    <div className="botlands-settings-panel" style={{
      padding: 'var(--spacing-xl)',
      background: 'var(--color-bgSecondary)',
      borderRadius: 'var(--radius-lg)',
      maxWidth: '600px',
    }}>
      <h2 style={{
        fontSize: 'var(--font-size-2xl)',
        color: 'var(--color-textPrimary)',
        marginBottom: 'var(--spacing-lg)',
      }}>
        ⚙️ Settings
      </h2>

      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-textSecondary)',
          marginBottom: 'var(--spacing-md)',
        }}>
          🎨 Theme
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 'var(--spacing-md)',
        }}>
          {presetOptions.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPreset(preset.id)}
              style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${currentPresetId === preset.id ? 'var(--color-accentPrimary)' : 'var(--color-borderLight)'}`,
                background: 'var(--color-bgElevated)',
                color: 'var(--color-textPrimary)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                {preset.name}
              </div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-textTertiary)',
              }}>
                {presets.find(p => p.id === preset.id)?.description}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-textSecondary)',
          marginBottom: 'var(--spacing-md)',
        }}>
          📐 Spacing
        </h3>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          alignItems: 'center',
        }}>
          {['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].map((size) => (
            <div key={size} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
            }}>
              <div style={{
                width: `var(--spacing-${size})`,
                height: `var(--spacing-${size})`,
                background: 'var(--color-accentPrimary)',
                borderRadius: 'var(--radius-sm)',
                opacity: 0.6,
              }} />
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-textTertiary)',
                textTransform: 'uppercase',
              }}>
                {size}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
