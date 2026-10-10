/**
 * OneWebUI Radius Tokens
 * Strict rule: No sharp corners! Minimum radius across the entire system is 12px.
 * Buttons, inputs, tabs, badges strictly use 'full' (pill).
 * Cards, modals, containers use 28px ('3xl' / 'card') or 32px ('sheet' / 'modal').
 */
export const radii = {
  min: '12px',      // Minimum allowed radius in OneWebUI (no <12px)
  lg: '12px',       // Small utility popovers / tooltips
  xl: '16px',       // Medium menus / dropdowns
  '2xl': '20px',    // Larger dropdowns / floating panels
  '3xl': '28px',    // Standard Cards & Containers
  card: '28px',     // Semantic alias for Cards
  sheet: '32px',    // Bottom sheets & Modal dialogs
  modal: '32px',    // Semantic alias for Modals
  full: '9999px',   // Strict pill shape: Buttons, Inputs, Tabs, Badges, FAB
} as const;

export type RadiusToken = keyof typeof radii;
