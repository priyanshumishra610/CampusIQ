// 8px spacing system - CRM standard
export const spacing = {
  xs: 4,   // 0.5 * 8
  sm: 8,   // 1 * 8
  md: 16,  // 2 * 8
  lg: 24,  // 3 * 8
  xl: 32,  // 4 * 8
  '2xl': 40,  // 5 * 8
  '3xl': 48,  // 6 * 8
};

// Border radius - CRM standard (8px or 10px)
export const borderRadius = {
  sm: 6,
  md: 8,   // Standard
  lg: 10,  // Alternative standard
  xl: 12,
  full: 9999,
};

// Typography hierarchy - CRM standard
export const fontSize = {
  xs: 11,      // Meta/label text
  sm: 12,      // Small body
  base: 14,    // Body text
  md: 16,      // Medium body
  lg: 18,      // Section title
  xl: 20,      // Large section
  '2xl': 24,   // Page title
  '3xl': 28,   // Hero title
};

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Line heights
export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

