export interface TypographyTokens {
  fontFamily: string;
  fontMono: string;
  fontSizeBase: number; // px
  fontWeight: number;
  lineHeight: number;
}

export const defaultTypography: TypographyTokens = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'Fira Code', 'Consolas', monospace",
  fontSizeBase: 16,
  fontWeight: 400,
  lineHeight: 1.5,
};

export const fontFamilies = [
  { id: 'system', name: 'System', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id: 'inter', name: 'Inter', value: "'Inter', -apple-system, sans-serif" },
  { id: 'roboto', name: 'Roboto', value: "'Roboto', sans-serif" },
  { id: 'fira', name: 'Fira Code', value: "'Fira Code', monospace" },
];

export const fontSizeOptions = [
  { id: 'sm', name: 'Small', value: 14 },
  { id: 'base', name: 'Normal', value: 16 },
  { id: 'lg', name: 'Large', value: 18 },
  { id: 'xl', name: 'Extra Large', value: 20 },
];

export const fontWeightOptions = [
  { id: 'normal', name: 'Normal', value: 400 },
  { id: 'medium', name: 'Medium', value: 500 },
  { id: 'semibold', name: 'Semi Bold', value: 600 },
];

export const lineHeightOptions = [
  { id: 'tight', name: 'Tight', value: 1.2 },
  { id: 'normal', name: 'Normal', value: 1.5 },
  { id: 'relaxed', name: 'Relaxed', value: 1.75 },
];
