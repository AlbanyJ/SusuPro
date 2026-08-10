// ============================================================
// FILE 1: src/constants/theme.js
// WHAT:   Every color, font, spacing, and shadow in the app.
//         Change values here → whole app updates instantly.
//
// Dark-first "bold & premium" palette (Cash App / Revolut style):
// deep near-black surfaces with a green tint, bright green/status
// accents for text and highlights. `white`/`offWhite` etc. keep
// their original semantic NAMES (screen bg, text, dividers) so
// every screen that already references them just inherits the new
// look — only `Colors.white` used specifically as a background
// (cards/headers/modals) was swapped to the new `surface` token,
// since `white` itself still means literal white text-on-dark.
// ============================================================

export const Colors = {
  // ── Greens (primary palette) ──
  green50:  '#122a1c',   // darkest tint — subtle chip/icon-wrap bg
  green100: '#1a3d28',   // dark tint — badge/panel bg
  green200: '#2a5c3c',
  green300: '#7dd6a3',   // bright accent — icon/text on dark cards
  green400: '#3daf73',   // gradient mid tone
  green500: '#259158',   // brand core
  green600: '#4ade80',   // bright — primary readable text/icon accent
  green700: '#8beab3',   // brightest — sparing emphasis text

  // ── Ink (deep premium dark surface — hero/gradient cards) ──
  ink:      '#0c1912',
  ink700:   '#132b1f',
  ink600:   '#1c3d2b',

  // ── Neutrals (dark UI: "white" stays literal white for text,
  //     everything else is a dark surface or light text tone) ──
  white:      '#ffffff',
  offWhite:   '#0a130e',   // screen background (near-black, green cast)
  surface:    '#12201a',   // card / header / modal background
  surfaceAlt: '#1a2c22',   // nested surface — focused input, chips

  gray50:   '#132119',   // subtle chip / icon-wrap bg
  gray100:  '#213329',   // hairline border / divider
  gray200:  '#2c4235',   // stronger border (inputs, search box)
  gray400:  '#7c9186',   // tertiary text, placeholders
  gray500:  '#a3b8ac',   // secondary body text
  gray600:  '#c2d2c7',   // secondary text (was undefined — now fixed)
  gray700:  '#dbe6e0',   // secondary bold text / labels
  gray900:  '#f6faf8',   // primary text (near-white)

  // ── Status colors ──
  red:         '#f87171',
  redLight:    '#3a1414',
  amber:       '#fbbf24',
  amberLight:  '#3a2a0c',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 16,
  },
  // Colored "glow" shadow for the brand-green primary button/hero
  glow: {
    shadowColor: '#1a7344',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
};
