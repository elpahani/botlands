export interface ComponentTokens {
  buttonStyle: 'filled' | 'outlined' | 'ghost';
  cardShadow: 'none' | 'sm' | 'md' | 'lg';
  inputStyle: 'rounded' | 'square' | 'underline';
}

export const defaultComponents: ComponentTokens = {
  buttonStyle: 'filled',
  cardShadow: 'md',
  inputStyle: 'rounded',
};

export const buttonStyleOptions = [
  { id: 'filled', name: 'Filled', description: 'Solid background with text' },
  { id: 'outlined', name: 'Outlined', description: 'Border with transparent background' },
  { id: 'ghost', name: 'Ghost', description: 'Transparent, only text' },
];

export const cardShadowOptions = [
  { id: 'none', name: 'None', value: 'none' },
  { id: 'sm', name: 'Small', value: 'sm' },
  { id: 'md', name: 'Medium', value: 'md' },
  { id: 'lg', name: 'Large', value: 'lg' },
];

export const inputStyleOptions = [
  { id: 'rounded', name: 'Rounded', description: 'Fully rounded corners' },
  { id: 'square', name: 'Square', description: 'Sharp corners' },
  { id: 'underline', name: 'Underline', description: 'Bottom border only' },
];
