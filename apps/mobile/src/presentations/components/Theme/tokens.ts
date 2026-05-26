export type ThemeName = 'light' | 'dark'

export type ThemeTokens = {
  name: ThemeName
  colors: {
    background: string
    backgroundGradientTop: string
    surface: string
    surfaceHover: string
    surfaceSolid: string
    surfaceDim: string
    playerBar: string
    sidebar: string
    modal: string

    text: string
    mutedText: string
    dimText: string
    inverseText: string

    border: string
    subtleBorder: string
    focusBorder: string

    primary: string
    primaryHover: string
    success: string
    error: string
    warning: string
    info: string

    overlay: string
    inverseBackground: string
  }

  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    panelGap: number
  }

  radius: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    full: number
  }
}

const baseSpacing = {
  xs: 5,
  sm: 10,
  md: 20,
  lg: 30,
  xl: 40,
  panelGap: 8,
}

const baseRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  full: 9999,
}

export const darkTheme: ThemeTokens = {
  name: 'dark',
  colors: {
    // Desktop Midnight theme
    background: '#0A0A0A',
    backgroundGradientTop: '#1F1F1F',
    surface: 'rgba(255,255,255,0.05)',
    surfaceHover: 'rgba(255,255,255,0.08)',
    surfaceSolid: '#1C1C1C',
    surfaceDim: 'rgba(255,255,255,0.03)',
    playerBar: '#181818',
    sidebar: '#121212',
    modal: '#1C1C1C',

    text: '#FFFFFF',
    mutedText: '#9CA3AF',
    dimText: '#6B7280',
    inverseText: '#000000',

    border: 'rgba(255,255,255,0.10)',
    subtleBorder: 'rgba(255,255,255,0.08)',
    focusBorder: 'rgba(16,185,129,0.50)',

    primary: '#10B981',
    primaryHover: '#059669',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    overlay: 'rgba(0,0,0,0.55)',
    inverseBackground: '#FFFFFF',
  },
  spacing: baseSpacing,
  radius: baseRadius,
}

export const lightTheme: ThemeTokens = {
  name: 'light',
  colors: {
    // Desktop Snow theme
    background: '#F9F8F7',
    backgroundGradientTop: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceHover: '#ECE9E7',
    surfaceSolid: '#E5E1DE',
    surfaceDim: 'rgba(45,42,40,0.03)',
    playerBar: '#FFFFFF',
    sidebar: '#ECE9E7',
    modal: '#FFFFFF',

    text: '#2D2A21',
    mutedText: '#5E5955',
    dimText: '#8A8480',
    inverseText: '#F9F8F7',

    border: '#E5E1DE',
    subtleBorder: 'rgba(45,42,40,0.08)',
    focusBorder: 'rgba(139,126,116,0.50)',

    primary: '#8B7E74',
    primaryHover: '#756A62',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    overlay: 'rgba(0,0,0,0.35)',
    inverseBackground: '#2D2A21',
  },
  spacing: baseSpacing,
  radius: baseRadius,
}