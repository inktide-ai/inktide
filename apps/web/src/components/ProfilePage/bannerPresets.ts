export const BANNER_PRESETS = [
  { gradient: 'linear-gradient(135deg, #1a1f2e 0%, #2d1b4e 100%)', accent: '#8b5cf6' },
  { gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', accent: '#22d3ee' },
  { gradient: 'linear-gradient(135deg, #0d1117 0%, #1c2a1e 100%)', accent: '#4ade80' },
  {
    gradient: 'linear-gradient(135deg, #422006 0%, #854d0e 40%, #ca8a04 100%)',
    accent: '#facc15',
  },
  {
    gradient: 'linear-gradient(135deg, #431407 0%, #c2410c 50%, #ea580c 100%)',
    accent: '#fb923c',
  },
] as const

export const getBannerGradient = (index: number) =>
  BANNER_PRESETS[Math.max(0, index % BANNER_PRESETS.length)]?.gradient ?? BANNER_PRESETS[0].gradient

export const getBannerAccent = (index: number) =>
  BANNER_PRESETS[Math.max(0, index % BANNER_PRESETS.length)]?.accent ?? BANNER_PRESETS[0].accent
