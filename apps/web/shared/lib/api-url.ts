// server-only helper — do NOT import in client components
// Priority: INTERNAL_API_URL (server-side absolute) → NEXT_PUBLIC_API_URL → localhost fallback
export const serverApiUrl = () =>
  process.env.INTERNAL_API_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? 'http://localhost:5001'
