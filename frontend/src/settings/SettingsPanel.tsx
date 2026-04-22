import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import { getPresetOptions } from '../design-system/themes/presets';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { currentPresetId, setPreset, presets } = useTheme();
  const presetOptions = getPresetOptions();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          background: '#1a1a2e',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: '#e0e0ff' }}
          >
            ⚙️ Settings
          </h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: '#8892b0' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Theme Section */}
          <div className="mb-8">
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: '#8892b0' }}
            >
              🎨 Theme
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetOptions.map((preset) => {
                const presetData = presets.find(p => p.id === preset.id);
                const isActive = currentPresetId === preset.id;
                
                return (
                  <button
                    key={preset.id}
                    onClick={() => setPreset(preset.id)}
                    className="relative p-4 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: `2px solid ${isActive ? '#667eea' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {/* Color Preview */}
                    <div 
                      className="w-full h-8 rounded-lg mb-3"
                      style={{ 
                        background: presetData?.tokens.colors.gradientPrimary || 'linear-gradient(135deg, #667eea, #764ba2)'
                      }}
                    />
                    
                    <div 
                      className="font-semibold text-sm mb-1"
                      style={{ color: '#e0e0ff' }}
                    >
                      {preset.name}
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: '#5a6680' }}
                    >
                      {presetData?.description || ''}
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div 
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ background: '#667eea', color: '#fff' }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacing Preview */}
          <div>
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: '#8892b0' }}
            >
              📐 Spacing Preview
            </h3>
            
            <div 
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div className="flex items-end gap-4">
                {['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <div 
                      className="rounded"
                      style={{ 
                        width: size === 'xs' ? '4px' : size === 'sm' ? '8px' : size === 'md' ? '16px' : size === 'lg' ? '24px' : size === 'xl' ? '32px' : '48px',
                        height: size === 'xs' ? '4px' : size === 'sm' ? '8px' : size === 'md' ? '16px' : size === 'lg' ? '24px' : size === 'xl' ? '32px' : '48px',
                        background: 'rgba(102, 126, 234, 0.6)'
                      }}
                    />
                    <span 
                      className="text-xs uppercase"
                      style={{ color: '#5a6680' }}
                    >
                      {size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-4 border-t flex justify-between items-center"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <span 
            className="text-sm"
            style={{ color: '#5a6680' }}
          >
            Active: {presets.find(p => p.id === currentPresetId)?.name || currentPresetId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              background: 'rgba(102, 126, 234, 0.2)',
              color: '#667eea'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
