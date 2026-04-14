export type ThemeName = 'light' | 'dark'

export type ThemeTokens = {
  name: ThemeName
  colors: {
    background: string
    surface: string
    text: string
    mutedText: string
    border: string
    primary: string
  }
}

export const lightTheme: ThemeTokens = {
  name: 'light',
  colors: {
    background: '#FFFFFF',
    surface: '#F6F7F9',
    text: '#111827',
    mutedText: '#6B7280',
    border: '#E5E7EB',
    primary: '#208AEF',
  },
}

export const darkTheme: ThemeTokens = {
  name: 'dark',
  colors: {
    background: '#0B0F1A',
    surface: '#111827',
    text: '#F9FAFB',
    mutedText: '#9CA3AF',
    border: '#1F2937',
    primary: '#208AEF',
  },
}
