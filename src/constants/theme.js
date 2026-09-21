// ============================================================
// FILE 1: src/constants/theme.js
// WHAT:   Every color, font, spacing, and shadow in the app.
//         Palettes/GradientPalettes/ShadowPalettes are keyed by
//         mode ('dark' | 'light') — see src/store/ThemeContext.js,
//         which is what screens actually consume via useTheme().
//         Typography/Spacing/Radius are mode-independent.
// ============================================================

// "Bold & premium" dark palette (Cash App / Revolut style): deep
// near-black surfaces with a green tint, bright green/status
// accents for text so they stay readable against the dark surfaces.
const dark = {
  green50:  '#122a1c',
  green100: '#1a3d28',
  green200: '#2a5c3c',
  green300: '#7dd6a3',
  green400: '#3daf73',
  green500: '#259158',
  green600: '#4ade80',
  green700: '#8beab3',

  ink:      '#0c1912',
  ink700:   '#132b1f',
  ink600:   '#1c3d2b',

  white:      '#ffffff',
  offWhite:   '#0a130e',   // screen background
  surface:    '#12201a',   // card / header / modal background
  surfaceAlt: '#1a2c22',   // nested surface — focused input, chips

  gray50:   '#132119',
  gray100:  '#213329',
  gray200:  '#2c4235',
  gray400:  '#7c9186',
  gray500:  '#a3b8ac',
  gray600:  '#c2d2c7',
  gray700:  '#dbe6e0',
  gray900:  '#f6faf8',

  red:         '#f87171',
  redLight:    '#3a1414',
  amber:       '#fbbf24',
  amberLight:  '#3a2a0c',
  blue:        '#60a5fa',   // Bank Transfer payment-method pill
  blueLight:   '#0f2036',
};

// Same "bold & premium" feel, but blending with warm cream instead
// of stark white — a soft, warm light mode rather than a harsh one.
const light = {
  green50:  '#eef8f1',
  green100: '#d9f0e1',
  green200: '#a8dfc0',
  green300: '#6ec99a',
  green400: '#3daf73',
  green500: '#259158',
  green600: '#1a7344',
  green700: '#145534',

  ink:      '#0c1912',   // dark accent cards stay dark in both modes
  ink700:   '#132b1f',
  ink600:   '#1c3d2b',

  white:      '#ffffff',
  offWhite:   '#f7f1e4',   // screen background — warm cream, not white
  surface:    '#fffdf9',   // card / header / modal background
  surfaceAlt: '#ffffff',   // nested surface — focused input, chips

  gray50:   '#f4efe2',
  gray100:  '#ece4d3',
  gray200:  '#ddd0b3',
  gray400:  '#75674f',   // darkened from #9a8f78 — that failed WCAG AA (2.84:1) against the cream bg; this passes (4.9:1)
  gray500:  '#71685a',
  gray600:  '#544e43',
  gray700:  '#3a352c',
  gray900:  '#241f18',

  red:         '#dc2626',
  redLight:    '#fdecec',
  amber:       '#b45309',
  amberLight:  '#fdf1d9',
  blue:        '#1d4ed8',   // Bank Transfer payment-method pill
  blueLight:   '#eaf1fd',
};

export const Palettes = { dark, light };

// Used with <LinearGradient colors={gradients.x}> (from useTheme())
export const GradientPalettes = {
  dark: {
    hero:    ['#0c1912', '#164a30', '#1a7344'],   // deep-to-brand depth
    primary: ['#2a8353', '#1a7344'],   // darkened from #3daf73 — that failed WCAG AA (2.77:1) against white button text; this passes (4.7:1)
    ink:     ['#132b1f', '#0c1912'],
    red:     ['#ef4444', '#b91c1c'],
  },
  light: {
    hero:    ['#3daf73', '#259158', '#1a7344'],   // brighter range — no near-black start on a light page
    primary: ['#2a8353', '#1a7344'],   // darkened from #3daf73 — that failed WCAG AA (2.77:1) against white button text; this passes (4.7:1)
    ink:     ['#132b1f', '#0c1912'],               // still dark — the one deliberate dark accent in light mode
    red:     ['#ef4444', '#b91c1c'],
  },
};

export const ShadowPalettes = {
  dark: {
    sm:   { shadowColor: '#000', shadowOffset: { width: 0, height: 3 },  shadowOpacity: 0.30, shadowRadius: 10, elevation: 3 },
    md:   { shadowColor: '#000', shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 },
    lg:   { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 32, elevation: 16 },
    glow: { shadowColor: '#1a7344', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 10 },
  },
  light: {
    sm:   { shadowColor: '#241f18', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,  elevation: 2 },
    md:   { shadowColor: '#241f18', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5 },
    lg:   { shadowColor: '#241f18', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 9 },
    glow: { shadowColor: '#1a7344', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  },
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
