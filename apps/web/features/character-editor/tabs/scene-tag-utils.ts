import type { CustomSceneTagDto } from '@/shared/types/soul-api'

/** Built-in + custom labels for pickers (deduped, case-insensitive). */
export function mergeSceneTagPickOptions(customTags: CustomSceneTagDto[] | string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const customLabels = customTags.map(t => (typeof t === 'string' ? t : t.label))
  for (const label of [...BUILTIN_SCENE_TAGS, ...customLabels]) {
    const trimmed = label.trim()
    if (!trimmed) continue
    const k = trimmed.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(trimmed)
  }
  return out
}

/** Build a label->hex color map from custom tags. Only entries with a stored color are included. */
export function getCustomTagsColorMap(customTags: CustomSceneTagDto[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const t of customTags) {
    if (t.color) map.set(t.label, t.color)
  }
  return map
}

/** Built-in scene filter tags (hash bucket order must stay stable for legacy scenes). */
export const BUILTIN_SCENE_TAGS = [
  'Синтвейв',
  'Природа',
  'Городской',
  'Sci-Fi',
  'Аниме',
  'Фэнтези',
  'Приключение',
  'Экшн',
  'Уютная',
] as const

export const SCENE_FILTER_ALL = 'Все'

export type TagDisplayStyle = {
  text: string
  bg: string
  border: string
  activeBorder: string
  activeBg: string
}

const TAG_DISPLAY_STYLES: Record<string, TagDisplayStyle> = {
  Синтвейв: {
    text: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.35)',
    activeBorder: 'rgba(167,139,250,0.45)',
    activeBg: 'rgba(167,139,250,0.06)',
  },
  Природа: {
    text: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.35)',
    activeBorder: 'rgba(74,222,128,0.45)',
    activeBg: 'rgba(74,222,128,0.06)',
  },
  Городской: {
    text: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.35)',
    activeBorder: 'rgba(56,189,248,0.45)',
    activeBg: 'rgba(56,189,248,0.06)',
  },
  'Sci-Fi': {
    text: '#818cf8',
    bg: 'rgba(129,140,248,0.1)',
    border: 'rgba(129,140,248,0.35)',
    activeBorder: 'rgba(129,140,248,0.45)',
    activeBg: 'rgba(129,140,248,0.06)',
  },
  Аниме: {
    text: '#f472b6',
    bg: 'rgba(244,114,182,0.1)',
    border: 'rgba(244,114,182,0.35)',
    activeBorder: 'rgba(244,114,182,0.45)',
    activeBg: 'rgba(244,114,182,0.06)',
  },
  Фэнтези: {
    text: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.35)',
    activeBorder: 'rgba(251,146,60,0.45)',
    activeBg: 'rgba(251,146,60,0.06)',
  },
  Приключение: {
    text: '#a3e635',
    bg: 'rgba(163,230,53,0.1)',
    border: 'rgba(163,230,53,0.35)',
    activeBorder: 'rgba(163,230,53,0.45)',
    activeBg: 'rgba(163,230,53,0.06)',
  },
  Экшн: {
    text: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.35)',
    activeBorder: 'rgba(248,113,113,0.45)',
    activeBg: 'rgba(248,113,113,0.06)',
  },
  Уютная: {
    text: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.35)',
    activeBorder: 'rgba(251,191,36,0.45)',
    activeBg: 'rgba(251,191,36,0.06)',
  },
  [SCENE_FILTER_ALL]: {
    text: '#ED3E3E',
    bg: 'rgba(237,62,62,0.1)',
    border: 'rgba(237,62,62,0.35)',
    activeBorder: 'rgba(237,62,62,0.45)',
    activeBg: 'rgba(237,62,62,0.06)',
  },
}

const HASH_KEYS: readonly string[] = BUILTIN_SCENE_TAGS

export function getHashTagKeyForScene(sceneId: string): string {
  let hash = 0
  for (let i = 0; i < sceneId.length; i++) hash = (hash * 31 + sceneId.charCodeAt(i)) >>> 0
  return HASH_KEYS[hash % HASH_KEYS.length]!
}

/** User-facing title: saved display name, else file name without extension. */
export function getSceneDisplayTitle(scene: {
  original_name?: string
  original_file_name?: string
  display_name?: string | null
}): string {
  const d = scene.display_name?.trim()
  if (d) return d
  const name = scene.original_name ?? scene.original_file_name ?? ''
  return name.replace(/\.[^/.]+$/, '')
}

/** Effective filter/display label: persisted tag, else legacy hash bucket. */
export function getEffectiveTagLabel(scene: { id: string; tag?: string | null }): string {
  const t = scene.tag?.trim()
  if (t) return t
  return getHashTagKeyForScene(scene.id)
}

export function tagAccentFromLabel(label: string): TagDisplayStyle {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  const hue = hash % 360
  return {
    text: `hsl(${hue}, 72%, 68%)`,
    bg: `hsla(${hue}, 55%, 55%, 0.12)`,
    border: `hsla(${hue}, 60%, 50%, 0.35)`,
    activeBorder: `hsla(${hue}, 60%, 45%, 0.5)`,
    activeBg: `hsla(${hue}, 50%, 45%, 0.08)`,
  }
}

export function getTagDisplayStyle(label: string): TagDisplayStyle {
  return TAG_DISPLAY_STYLES[label] ?? tagAccentFromLabel(label)
}

/** Like getTagDisplayStyle but prefers a user-chosen stored hex color when available. */
export function getTagDisplayStyleWithColor(label: string, storedColor?: string | null): TagDisplayStyle {
  if (storedColor) {
    const h = storedColor.startsWith('#') ? storedColor : `#${storedColor}`
    return {
      text: h,
      bg: `${h}1a`,
      border: `${h}59`,
      activeBorder: `${h}80`,
      activeBg: `${h}14`,
    }
  }
  return getTagDisplayStyle(label)
}

/** Pill row colours (text/bg/border only - no active card chrome). */
export function getPillColors(label: string, storedColor?: string | null): { text: string; bg: string; border: string } {
  const s = getTagDisplayStyleWithColor(label, storedColor)
  return { text: s.text, bg: s.bg, border: s.border }
}
