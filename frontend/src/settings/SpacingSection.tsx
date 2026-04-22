import { Maximize2 } from 'lucide-react';
import { useTheme } from '../design-system/ThemeProvider';
import { densityOptions, sidebarWidthOptions, borderRadiusOptions } from '../design-system/tokens/spacing';
import { Card } from '../design-system/components/Card';

export const SpacingSection: React.FC = () => {
  const { spacing, setSpacing } = useTheme();

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <Maximize2 className="w-5 h-5" />
        Spacing & Layout
      </h3>
      
      <div className="space-y-4">
        {/* Density */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Content Density</label>
          <div className="space-y-2">
            {densityOptions.map((d) => (
              <button
                key={d.id}
                onClick={() => setSpacing({ ...spacing, density: d.id as any })}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  spacing.density === d.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <div className="font-medium">{d.name}</div>
                <div className="text-xs opacity-60">{d.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Width */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Sidebar Width</label>
          <div className="flex gap-2">
            {sidebarWidthOptions.map((width) => (
              <button
                key={width.id}
                onClick={() => setSpacing({ ...spacing, sidebarWidth: width.value })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                  spacing.sidebarWidth === width.value
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                {width.name}
                <span className="block text-xs opacity-50">{width.value}px</span>
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Border Radius</label>
          <div className="flex gap-2">
            {borderRadiusOptions.map((r) => (
              <button
                key={r.id}
                onClick={() => setSpacing({ ...spacing, borderRadius: r.id as any })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                  spacing.borderRadius === r.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
                style={{ borderRadius: r.value }}
              >
                <div 
                  className="w-4 h-4 mx-auto mb-1 bg-accent-primary/50"
                  style={{ borderRadius: r.value }}
                />
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
