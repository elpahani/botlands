export interface SpacingTokens {
  density: 'compact' | 'normal' | 'comfortable';
  sidebarWidth: number;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const defaultSpacing: SpacingTokens = {
  density: 'normal',
  sidebarWidth: 256,
  borderRadius: 'md',
};

export const densityOptions = [
  { id: 'compact', name: 'Compact', description: 'Tight spacing, more content visible' },
  { id: 'normal', name: 'Normal', description: 'Balanced spacing' },
  { id: 'comfortable', name: 'Comfortable', description: 'Relaxed spacing, easier to read' },
];

export const sidebarWidthOptions = [
  { id: 'narrow', name: 'Narrow', value: 200 },
  { id: 'normal', name: 'Normal', value: 256 },
  { id: 'wide', name: 'Wide', value: 300 },
];

export const borderRadiusOptions = [
  { id: 'none', name: 'None', value: '0' },
  { id: 'sm', name: 'Small', value: '4px' },
  { id: 'md', name: 'Medium', value: '8px' },
  { id: 'lg', name: 'Large', value: '12px' },
  { id: 'xl', name: 'Extra Large', value: '16px' },
];
