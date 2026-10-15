/** Shared visual tokens for the Tunisian Rami and Chkobba tables. */
export const tunisianTheme = {
  colors: {
    background: '#101014',
    felt: '#0E7A4D',
    feltDeep: '#0A5C38',
    gold: '#D4AF37',
    ivory: '#F6F1E2',
    ink: '#171719',
    muted: '#A6A6AA',
    danger: '#B8443C',
    suits: {
      dineri: '#D4AF37',
      coupe: '#C94A4A',
      bastoni: '#7A4B2A',
      spade: '#D9E0E8',
    },
  },
  radius: {
    card: 12,
    table: 999,
    panel: 18,
    control: 10,
    pill: 999,
  },
  shadows: {
    card: {
      color: '#000000',
      offset: { width: 0, height: 5 },
      opacity: 0.28,
      radius: 8,
      elevation: 5,
    },
    table: {
      color: '#000000',
      offset: { width: 0, height: 10 },
      opacity: 0.35,
      radius: 18,
      elevation: 10,
    },
    goldGlow: {
      color: '#D4AF37',
      offset: { width: 0, height: 0 },
      opacity: 0.22,
      radius: 12,
      elevation: 4,
    },
  },
  typography: {
    fontFamily: {
      latin: 'Inter',
      arabic: 'NotoNaskhArabic-Regular',
    },
    fontSize: {
      caption: 12,
      body: 16,
      title: 24,
      display: 32,
    },
    lineHeight: {
      latin: 1.35,
      arabic: 1.7,
    },
    direction: {
      french: 'ltr',
      arabic: 'rtl',
    },
  },
  table: {
    shape: 'oval',
    borderRadius: '50%',
    background: '#0E7A4D',
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
} as const;

export type TunisianTheme = typeof tunisianTheme;