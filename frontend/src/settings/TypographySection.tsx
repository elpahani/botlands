import { Type } from 'lucide-react';
import { useTheme } from '../design-system/ThemeProvider';
import { fontFamilies, fontSizeOptions, fontWeightOptions, lineHeightOptions } from '../design-system/tokens/typography';
import { Card } from '../design-system/components/Card';

export const TypographySection: React.FC = () => {
  const { typography, setTypography } = useTheme();

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <Type className="w-5 h-5" />
        Typography
      </h3>
      
      <div className="space-y-4">
        {/* Font Family */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Font Family</label>
          <div className="grid grid-cols-2 gap-2">
            {fontFamilies.map((font) => (
              <button
                key={font.id}
                onClick={() => setTypography({ ...typography, fontFamily: font.value })}
                className={`p-2 rounded-lg border text-sm transition-all text-left ${
                  typography.fontFamily === font.value
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
                style={{ fontFamily: font.value }}
              >
                {font.name}
                <span className="block text-xs opacity-60 mt-0.5">
                  The quick brown fox...
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Font Size ({typography.fontSizeBase}px)</label>
          <div className="flex gap-2">
            {fontSizeOptions.map((size) => (
              <button
                key={size.id}
                onClick={() => setTypography({ ...typography, fontSizeBase: size.value })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                  typography.fontSizeBase === size.value
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
                style={{ fontSize: `${size.value}px` }}
              >
                A
              </button>
            ))}
          </div>
        </div>

        {/* Font Weight */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Font Weight</label>
          <div className="flex gap-2">
            {fontWeightOptions.map((weight) => (
              <button
                key={weight.id}
                onClick={() => setTypography({ ...typography, fontWeight: weight.value })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                  typography.fontWeight === weight.value
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
                style={{ fontWeight: weight.value }}
              >
                {weight.name}
              </button>
            ))}
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Line Height</label>
          <div className="flex gap-2">
            {lineHeightOptions.map((lh) => (
              <button
                key={lh.id}
                onClick={() => setTypography({ ...typography, lineHeight: lh.value })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                  typography.lineHeight === lh.value
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                {lh.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
