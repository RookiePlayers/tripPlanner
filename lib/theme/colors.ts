/**
 * Centralized color token system.
 * Edit colors here — they propagate to the MUI Joy theme and CSS custom properties.
 */

export interface ColorTokens {
  brand: string
  brandHover: string
  accent: string
  accentHover: string

  surface: {
    base: string
    raised: string
    overlay: string
    sunken: string
  }

  text: {
    primary: string
    secondary: string
    muted: string
    inverse: string
  }

  border: {
    default: string
    subtle: string
    strong: string
  }

  status: {
    error: string
    errorBg: string
    success: string
    successBg: string
    warning: string
    warningBg: string
    info: string
    infoBg: string
  }

  auth: {
    panelBg: string
    formBg: string
    inputBg: string
    inputBorder: string
    inputBorderFocus: string
    orb1: string
    orb2: string
    buttonGradient: string
    buttonGradientHover: string
    buttonShadow: string
  }

  nav: {
    activeBg: string
    activeBorder: string
    activeShadow: string
  }

  progress: {
    gradient: string
    marker: string
    markerShadow: string
  }
}

// ─── Dark mode tokens ───
export const dark: ColorTokens = {
  brand: '#6366f1',
  brandHover: '#5558e6',
  accent: '#ff9e44',
  accentHover: '#f59131',

  surface: {
    base: '#0B1022',
    raised: '#141B3A',
    overlay: 'rgba(255,255,255,0.06)',
    sunken: '#080c1a',
  },

  text: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.7)',
    muted: 'rgba(255,255,255,0.4)',
    inverse: '#0B1022',
  },

  border: {
    default: 'rgba(255,255,255,0.1)',
    subtle: 'rgba(255,255,255,0.06)',
    strong: 'rgba(255,255,255,0.18)',
  },

  status: {
    error: '#ef4444',
    errorBg: 'rgba(239,68,68,0.12)',
    success: '#22c55e',
    successBg: 'rgba(34,197,94,0.12)',
    warning: '#eab308',
    warningBg: 'rgba(234,179,8,0.12)',
    info: '#3b82f6',
    infoBg: 'rgba(59,130,246,0.12)',
  },

  auth: {
    panelBg: 'linear-gradient(160deg, #0B1022 0%, #1a1f3a 50%, #0f1629 100%)',
    formBg: 'linear-gradient(180deg, #101428 0%, #0d1120 100%)',
    inputBg: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(255,255,255,0.08)',
    inputBorderFocus: 'rgba(99,102,241,0.4)',
    orb1: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
    buttonGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    buttonGradientHover: 'linear-gradient(135deg, #5558e6 0%, #7c4feb 100%)',
    buttonShadow: '0 4px 14px rgba(99,102,241,0.3)',
  },

  nav: {
    activeBg: 'linear-gradient(135deg, rgba(168,85,247,.18), rgba(234,179,8,.18))',
    activeBorder: 'rgba(168,85,247,0.35)',
    activeShadow: '0 6px 16px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.18)',
  },

  progress: {
    gradient: 'linear-gradient(90deg, #7a5cff, #ff9e44)',
    marker: 'linear-gradient(180deg, #ffffff, #d7d7ff)',
    markerShadow: 'rgba(255,255,255,0.6)',
  },
}

// ─── Light mode tokens ───
export const light: ColorTokens = {
  brand: '#4f46e5',
  brandHover: '#4338ca',
  accent: '#ea580c',
  accentHover: '#dc2626',

  surface: {
    base: '#f8fafc',
    raised: '#ffffff',
    overlay: 'rgba(0,0,0,0.04)',
    sunken: '#f1f5f9',
  },

  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },

  border: {
    default: 'rgba(0,0,0,0.12)',
    subtle: 'rgba(0,0,0,0.06)',
    strong: 'rgba(0,0,0,0.2)',
  },

  status: {
    error: '#dc2626',
    errorBg: 'rgba(220,38,38,0.08)',
    success: '#16a34a',
    successBg: 'rgba(22,163,74,0.08)',
    warning: '#ca8a04',
    warningBg: 'rgba(202,138,4,0.08)',
    info: '#2563eb',
    infoBg: 'rgba(37,99,235,0.08)',
  },

  auth: {
    panelBg: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    formBg: '#ffffff',
    inputBg: '#f8fafc',
    inputBorder: 'rgba(0,0,0,0.12)',
    inputBorderFocus: 'rgba(79,70,229,0.5)',
    orb1: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
    buttonGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    buttonGradientHover: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
    buttonShadow: '0 4px 14px rgba(79,70,229,0.25)',
  },

  nav: {
    activeBg: 'linear-gradient(135deg, rgba(79,70,229,.12), rgba(234,179,8,.1))',
    activeBorder: 'rgba(79,70,229,0.3)',
    activeShadow: '0 4px 12px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.6)',
  },

  progress: {
    gradient: 'linear-gradient(90deg, #4f46e5, #ea580c)',
    marker: 'linear-gradient(180deg, #ffffff, #e0e7ff)',
    markerShadow: 'rgba(79,70,229,0.3)',
  },
}

/** Flatten tokens to a Record<string, string> for CSS var injection. */
function flatten(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const varName = prefix ? `${prefix}-${key}` : key
    if (typeof value === 'object' && value !== null && !value.startsWith?.('linear') && !value.startsWith?.('radial') && !value.startsWith?.('rgba') && !value.startsWith?.('#') && !value.startsWith?.('0 ')) {
      Object.assign(result, flatten(value, varName))
    } else {
      result[varName] = value
    }
  }
  return result
}

/** Get a flat map of `--color-{name}: value` entries for a given mode. */
export function cssVarEntries(mode: 'light' | 'dark'): Record<string, string> {
  const tokens = mode === 'light' ? light : dark
  const flat = flatten(tokens as unknown as Record<string, any>)
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(flat)) {
    // Convert camelCase to kebab-case
    const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    result[`--color-${kebab}`] = value
  }
  return result
}
