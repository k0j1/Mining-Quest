
/**
 * Global Theme Configuration
 * Centralized styles for colors, spacing, typography, etc.
 */

export const THEME = {
  colors: {
    primary: 'indigo-500',
    primaryDark: 'indigo-600',
    primaryLight: 'indigo-400',
    secondary: 'slate-500',
    bg: 'slate-950',
    cardBg: 'slate-900/80',
    cardBgSecondary: 'slate-800/50',
    border: 'slate-800',
    borderLight: 'slate-700',
    text: 'white',
    textMuted: 'slate-400',
    textAccent: 'indigo-300',
    accent: 'emerald-500',
    error: 'red-500',
    warning: 'amber-500',
  },
  spacing: {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
  },
  radius: {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  },
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
  typography: {
    fontSans: 'font-sans',
    fontMono: 'font-mono',
    trackingTight: 'tracking-tight',
    trackingWidest: 'tracking-widest',
    uppercase: 'uppercase',
  }
};

// Helper to combine theme classes
export const themeClass = {
  card: `${THEME.colors.cardBg} backdrop-blur-xl ${THEME.radius['2xl']} border ${THEME.colors.border} ${THEME.shadow.xl}`,
  cardSecondary: `${THEME.colors.cardBgSecondary} ${THEME.radius.xl} border ${THEME.colors.borderLight}`,
  buttonPrimary: `${THEME.colors.primary} hover:${THEME.colors.primaryDark} transition-colors`,
  textMutedSmall: `text-[10px] ${THEME.colors.textMuted} ${THEME.typography.uppercase} ${THEME.typography.trackingWidest}`,
  monoSmall: `${THEME.typography.fontMono} text-[10px] ${THEME.colors.textAccent} break-all bg-slate-900/50 p-2 rounded border border-slate-700/50`,
};
