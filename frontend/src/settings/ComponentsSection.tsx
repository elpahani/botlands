import { Layers, CreditCard } from 'lucide-react';
import { useTheme } from '../design-system/ThemeProvider';
import { buttonStyleOptions, cardShadowOptions, inputStyleOptions } from '../design-system/tokens/components';
import { Card } from '../design-system/components/Card';

export const ComponentsSection: React.FC = () => {
  const { components, setComponents } = useTheme();

  return (
    <Card className="mb-4">
      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5" />
        Components
      </h3>
      
      <div className="space-y-4">
        {/* Button Style */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Button Style</label>
          <div className="flex gap-2">
            {buttonStyleOptions.map((style) => (
              <button
                key={style.id}
                onClick={() => setComponents({ ...components, buttonStyle: style.id as any })}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  components.buttonStyle === style.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <div className="font-medium mb-1">{style.name}</div>
                <div className="text-xs opacity-60">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Shadow */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Card Shadow</label>
          <div className="flex gap-2">
            {cardShadowOptions.map((shadow) => (
              <button
                key={shadow.id}
                onClick={() => setComponents({ ...components, cardShadow: shadow.id as any })}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  components.cardShadow === shadow.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <CreditCard 
                  className={`w-8 h-8 mx-auto mb-2 text-text-secondary ${
                    shadow.id !== 'none' ? `shadow-${shadow.id}` : ''
                  }`}
                />
                {shadow.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Style */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Input Style</label>
          <div className="flex gap-2">
            {inputStyleOptions.map((style) => (
              <button
                key={style.id}
                onClick={() => setComponents({ ...components, inputStyle: style.id as any })}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  components.inputStyle === style.id
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border-medium text-text-secondary hover:border-accent-primary/50'
                }`}
              >
                <div className="font-medium mb-1">{style.name}</div>
                <div className="text-xs opacity-60">{style.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
