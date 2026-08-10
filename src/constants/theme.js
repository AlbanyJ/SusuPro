// ============================================================
// FILE 1: src/constants/theme.js
// WHAT:   Every color, font, spacing, and shadow in the app.
//         Change values here → whole app updates instantly.
// ============================================================

export const Colors = {
  // ── Greens (primary palette) ──
  green50:  '#f0faf4',
  green100: '#d6f2e0',
  green200: '#a8dfc0',
  green300: '#6ec99a',
  green400: '#3daf73',
  green500: '#259158',
  green600: '#1a7344',
  green700: '#145534',

  // ── Neutrals ──
  white:    '#ffffff',
  offWhite: '#f8faf9',
  gray50:   '#f3f4f6',
  gray100:  '#e8eae9',
  gray200:  '#d1d5db',
  gray400:  '#9ca3af',
  gray500:  '#6b7280',
  gray700:  '#374151',
  gray900:  '#111827',

  // ── Status colors ──
  red:         '#dc2626',
  redLight:    '#fee2e2',
  amber:       '#d97706',
  amberLight:  '#fef3c7',
};

export const Gradients = {
  green:      ['#259158', '#1a7344'],   // used with LinearGradient
  greenSoft:  ['#3daf73', '#259158'],
  red:        ['#dc2626', '#b91c1c'],
};

export const Typography = {
  display: 'DMSans-ExtraBold',       // headings, big numbers
  body:    'DMSans-Regular',         // normal text
  medium:  'DMSans-Medium',
  semiBold:'DMSans-SemiBold',
  bold:    'DMSans-Bold',

  size: {
    xs:   10,
    sm:   12,
    md:   14,
    base: 15,
    lg:   17,
    xl:   20,
    xxl:  24,
    hero: 34,
  },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#259158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#259158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};