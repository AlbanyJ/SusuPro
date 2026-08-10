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

  // ── Ink (deep premium dark surface — hero cards, primary CTAs) ──
  ink:      '#0c1912',
  ink700:   '#132b1f',
  ink600:   '#1c3d2b',

  // ── Neutrals ──
  white:    '#ffffff',
  offWhite: '#f7f9f8',
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

// Used with <LinearGradient colors={Gradients.x}>
export const Gradients = {
  hero:    ['#0c1912', '#164a30', '#1a7344'],   // dashboard hero / login bg — deep-to-brand depth
  primary: ['#3daf73', '#1a7344'],              // primary buttons
  ink:     ['#132b1f', '#0c1912'],              // dark accent cards
  red:     ['#ef4444', '#b91c1c'],              // danger buttons
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
    hero: 40,
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
  sm: 12,
  md: 18,
  lg: 26,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0c1912',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  md: {
    shadowColor: '#0c1912',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 16,
  },
  // Colored "glow" shadow for the brand-green primary button/hero
  glow: {
    shadowColor: '#1a7344',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
