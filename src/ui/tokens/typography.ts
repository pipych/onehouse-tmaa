/**
 * OneWebUI Typography Tokens
 */
export const typography = {
  fonts: {
    sans: "'Wix Madefor Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  sizes: {
    xs: { fontSize: '12px', lineHeight: '16px' },
    sm: { fontSize: '14px', lineHeight: '20px' },
    base: { fontSize: '16px', lineHeight: '24px' },
    lg: { fontSize: '18px', lineHeight: '28px' },
    xl: { fontSize: '20px', lineHeight: '28px' },
    '2xl': { fontSize: '24px', lineHeight: '32px' },
    '3xl': { fontSize: '30px', lineHeight: '36px' },
    '4xl': { fontSize: '36px', lineHeight: '40px' },
  },
} as const;
