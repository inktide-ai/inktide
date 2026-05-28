import type { CharacterPersonality } from '@/shared/lib/character'

export function moodDescription(p: CharacterPersonality): string {
  const base: Record<string, string> = {
    neutral:     'Composed and balanced',
    happy:       'Warm and cheerful',
    chill:       'Relaxed and easygoing',
    melancholic: 'Introspective and quiet',
    hyped:       'High-energy and expressive',
  }
  let desc = base[p.baselineMood] ?? 'Balanced'
  if (p.sarcasm > 0.65)            desc += ', sharp-tongued'
  else if (p.empathy > 0.85)       desc += ', deeply empathetic'
  else if (p.assertiveness > 0.75) desc += ', assertive by nature'
  else if (p.warmth < 0.3)         desc += ', emotionally reserved'
  return desc
}

export function stressLabel(s: string): string {
  return (
    { humor: 'Deflects with humor', deflect: 'Redirects tension', withdraw: 'Becomes quieter', confront: 'Addresses conflict directly' }[s]
    ?? 'Adapts to context'
  )
}
