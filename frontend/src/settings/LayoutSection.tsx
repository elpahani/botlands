import { Layout, Columns, Grid3x3 } from 'lucide-react';
import { useTheme } from '../design-system/ThemeProvider';
import { tabStyleOptions, gridSizeOptions, sidebarPositionOptions } from '../design-system/tokens/layout';
import { Card } from '../design-system/components/Card';

export const LayoutSection: React.FC = () => {
  const { layout, setLayout } = useTheme();

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <Layout className="w-5 h-5" />
        Layout
      </h3>

      <div className="space-y-4">
        {/* Tab Style */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Tab Style</label>
          <div className="flex gap-2">
            {tabStyleOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLayout({ ...layout, tabStyle: tab.id as any })}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  layout.tabStyle === tab.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <div className="font-medium mb-1">{tab.name}</div>
                <div className="text-xs opacity-60">{tab.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Grid Size */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Grid Icon Size</label>
          <div className="flex gap-2">
            {gridSizeOptions.map((size) => (
              <button
                key={size.id}
                onClick={() => setLayout({ ...layout, gridSize: size.id as any })}
                className={`flex-1 py-3 px-3 rounded-lg border text-sm transition-all ${
                  layout.gridSize === size.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <Grid3x3 className={`mx-auto mb-1 text-text-secondary ${size.value}`} />
                {size.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Position */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Sidebar Position</label>
          <div className="flex gap-2">
            {sidebarPositionOptions.map((pos) => (
              <button
                key={pos.id}
                onClick={() => setLayout({ ...layout, sidebarPosition: pos.value as any })}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  layout.sidebarPosition === pos.value
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <Columns className="w-5 h-5 mx-auto mb-1" />
                {pos.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
