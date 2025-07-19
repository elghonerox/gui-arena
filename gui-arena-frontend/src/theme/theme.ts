import { colors } from './colors';

export const arenaTheme = {
  token: {
    colorPrimary: colors.neon.purple,
    colorSuccess: colors.status.success,
    colorWarning: colors.status.warning,
    colorError: colors.status.error,
    colorInfo: colors.status.info,
    colorBgBase: colors.dark.bg,
    colorBgContainer: colors.dark.card,
    colorBorder: colors.dark.border,
    colorText: colors.dark.text,
    colorTextSecondary: colors.dark.muted,
    borderRadius: 16,
    fontFamily: '"Rajdhani", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
  },
  components: {
    Button: {
      borderRadius: 15,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontFamily: '"Orbitron", monospace',
    },
    Card: {
      borderRadius: 20,
      paddingLG: 24,
    },
    Input: {
      borderRadius: 12,
      fontSize: 16,
    },
    Modal: {
      borderRadius: 20,
    },
    Table: {
      borderRadius: 16,
    },
  },
};