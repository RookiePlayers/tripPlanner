import { extendTheme } from '@mui/joy/styles'
import { light, dark } from './colors'

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          solidBg: light.brand,
          solidHoverBg: light.brandHover,
          softBg: 'rgba(79,70,229,0.08)',
          softColor: light.brand,
          outlinedBorder: light.nav.activeBorder,
        },
        neutral: {
          softBg: light.surface.overlay,
          outlinedBorder: light.border.default,
        },
        danger: {
          solidBg: light.status.error,
          softBg: light.status.errorBg,
          softColor: light.status.error,
        },
        success: {
          solidBg: light.status.success,
          softBg: light.status.successBg,
          softColor: light.status.success,
        },
        warning: {
          solidBg: light.status.warning,
          softBg: light.status.warningBg,
          softColor: light.status.warning,
        },
        background: {
          body: light.surface.base,
          surface: light.surface.raised,
        },
        text: {
          primary: light.text.primary,
          secondary: light.text.secondary,
          tertiary: light.text.muted,
        },
        divider: light.border.default,
      },
    },
    dark: {
      palette: {
        primary: {
          solidBg: dark.brand,
          solidHoverBg: dark.brandHover,
          softBg: 'rgba(99,102,241,0.12)',
          softColor: '#a5b4fc',
          outlinedBorder: dark.nav.activeBorder,
        },
        neutral: {
          softBg: dark.surface.overlay,
          outlinedBorder: dark.border.default,
        },
        danger: {
          solidBg: dark.status.error,
          softBg: dark.status.errorBg,
          softColor: dark.status.error,
        },
        success: {
          solidBg: dark.status.success,
          softBg: dark.status.successBg,
          softColor: dark.status.success,
        },
        warning: {
          solidBg: dark.status.warning,
          softBg: dark.status.warningBg,
          softColor: dark.status.warning,
        },
        background: {
          body: dark.surface.base,
          surface: dark.surface.raised,
        },
        text: {
          primary: dark.text.primary,
          secondary: dark.text.secondary,
          tertiary: dark.text.muted,
        },
        divider: dark.border.default,
      },
    },
  },
  fontFamily: { body: 'Inter, ui-sans-serif, system-ui' },
})

export default theme
