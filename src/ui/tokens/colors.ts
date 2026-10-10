/**
 * OneWebUI Color Tokens
 * Strict tokens for the One ecosystem
 */
export const colors = {
  // Main canvas / background
  bgBase: '#090b0e',
  bgSubtle: '#050709',

  // Surfaces
  surface: '#14171c',
  surfaceElevated: '#181c23',
  surfaceSubtle: '#252c37',
  surfaceGlass: 'rgba(20, 23, 28, 0.94)',

  // Accent (One Lime)
  accent: '#c0ff00',
  accentHover: '#aee600',
  accentSubtle: 'rgba(192, 255, 0, 0.15)',

  // Borders
  border: 'rgba(255, 255, 255, 0.10)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  borderAccent: 'rgba(192, 255, 0, 0.25)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#8e8e93',
  textMuted: '#8e8e93',
  textInverse: '#090b0e',
  textAccent: '#c0ff00',

  // Status
  statusSuccess: '#1bd96a',
  statusWarning: '#fbbf24',
  statusDanger: '#ef4444',
} as const;

export type ColorToken = keyof typeof colors;
