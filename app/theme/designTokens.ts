/**
 * Design Tokens for CampusIQ
 * Centralized design system for consistent UI across the platform
 * Premium UI/UX with dark/light mode support
 */

export type ThemeMode = 'light' | 'dark' | 'system';

// Light Theme Colors
const LightColors = {
  // Primary Brand Colors
  primary: '#1e3a5f',
  primaryDark: '#0c1222',
  primaryLight: '#2d5a87',
  primaryAccent: '#64b5f6',
  primaryAccentLight: '#a8c4e0',

  // Background Colors
  background: '#f4f6f9',
  backgroundLight: '#f5f7fa',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceHover: '#f8f9fb',

  // Text Colors
  textPrimary: '#0c1222',
  textSecondary: '#2a3a4a',
  textTertiary: '#5a6a7a',
  textMuted: '#7a8a9a',
  textInverse: '#ffffff',

  // Border Colors
  border: '#e4e8ec',
  borderLight: '#f0f4f8',
  divider: '#e4e8ec',

  // Status Colors
  success: '#27ae60',
  successLight: '#d4edda',
  warning: '#f39c12',
  warningLight: '#fff3cd',
  error: '#e74c3c',
  errorLight: '#f8d7da',
  info: '#3498db',
  infoLight: '#d1ecf1',

  // Priority Colors
  priorityLow: '#27ae60',
  priorityMedium: '#e67e22',
  priorityHigh: '#c0392b',
  priorityUrgent: '#e74c3c',

  // Status Badge Colors
  statusNew: '#3498db',
  statusInProgress: '#f39c12',
  statusResolved: '#27ae60',
  statusEscalated: '#e74c3c',
  statusActive: '#e74c3c',
  statusInvestigating: '#f39c12',

  // Severity Colors
  severityCritical: '#e74c3c',
  severityHigh: '#f39c12',
  severityMedium: '#3498db',
  severityLow: '#7a8a9a',
};

// Dark Theme Colors
const DarkColors = {
  // Primary Brand Colors
  primary: '#64b5f6',
  primaryDark: '#0c1222',
  primaryLight: '#2d5a87',
  primaryAccent: '#64b5f6',
  primaryAccentLight: '#a8c4e0',

  // Background Colors
  background: '#0c1222',
  backgroundLight: '#141b2d',
  surface: '#1a2332',
  surfaceElevated: '#1f2a3a',
  surfaceHover: '#252f42',

  // Text Colors
  textPrimary: '#e8eef4',
  textSecondary: '#c9d6e3',
  textTertiary: '#8ba4bc',
  textMuted: '#6b7d95',
  textInverse: '#0c1222',

  // Border Colors
  border: '#2a3a4a',
  borderLight: '#1f2a3a',
  divider: '#2a3a4a',

  // Status Colors (same for dark mode)
  success: '#27ae60',
  successLight: '#1a5c3a',
  warning: '#f39c12',
  warningLight: '#8b5a00',
  error: '#e74c3c',
  errorLight: '#8b1a0f',
  info: '#3498db',
  infoLight: '#1a4d6b',

  // Priority Colors (same)
  priorityLow: '#27ae60',
  priorityMedium: '#e67e22',
  priorityHigh: '#c0392b',
  priorityUrgent: '#e74c3c',

  // Status Badge Colors (same)
  statusNew: '#3498db',
  statusInProgress: '#f39c12',
  statusResolved: '#27ae60',
  statusEscalated: '#e74c3c',
  statusActive: '#e74c3c',
  statusInvestigating: '#f39c12',

  // Severity Colors (same)
  severityCritical: '#e74c3c',
  severityHigh: '#f39c12',
  severityMedium: '#3498db',
  severityLow: '#7a8a9a',
};

// Default export (light theme for backward compatibility)
export const Colors = LightColors;

export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    bold: 'Poppins-Bold',
    italic: 'Poppins-Italic',
    mediumItalic: 'Poppins-MediumItalic',
    boldItalic: 'Poppins-BoldItalic',
  },

  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Animation Durations (in milliseconds)
export const Animation = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
} as const;

// Breakpoints (for responsive design)
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Theme helper functions
export const getThemeColors = (isDark: boolean) => {
  return isDark ? DarkColors : LightColors;
};

// Export both themes
export {LightColors, DarkColors};

