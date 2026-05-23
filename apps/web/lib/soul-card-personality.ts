/** Split list-card `personality` into hero subtitle + body description (first sentence vs rest). */
export function splitPersonalityForSoulCard(personality: string | undefined | null): {
  subtitle: string
  description?: string
} {
  const t = personality?.trim() ?? ''
  if (!t) return { subtitle: 'AI Soul' }
  const parts = t.split('.')
  const head = parts[0]?.trim() ?? ''
  const rest = parts.slice(1).join('.').trim()
  const subtitle = head || 'AI Soul'
  return rest ? { subtitle, description: rest } : { subtitle }
}
