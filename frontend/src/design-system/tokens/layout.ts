export interface LayoutTokens {
  tabStyle: 'pills' | 'underline' | 'buttons';
  gridSize: 'small' | 'medium' | 'large';
  sidebarPosition: 'left' | 'right' | 'hidden';
}

export const defaultLayout: LayoutTokens = {
  tabStyle: 'buttons',
  gridSize: 'medium',
  sidebarPosition: 'left',
};

export const tabStyleOptions = [
  { id: 'pills', name: 'Pills', description: 'Rounded pill-shaped tabs' },
  { id: 'underline', name: 'Underline', description: 'Bottom border indicator' },
  { id: 'buttons', name: 'Buttons', description: 'Button-style tabs' },
];

export const gridSizeOptions = [
  { id: 'small', name: 'Small', value: 'w-10 h-10' },
  { id: 'medium', name: 'Medium', value: 'w-12 h-12' },
  { id: 'large', name: 'Large', value: 'w-16 h-16' },
];

export const sidebarPositionOptions = [
  { id: 'left', name: 'Left', value: 'left' },
  { id: 'right', name: 'Right', value: 'right' },
  { id: 'hidden', name: 'Hidden', value: 'hidden' },
];
