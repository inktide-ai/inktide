// server-only helper - do NOT import in client components
// Priority: INTERNAL_API_URL (server-side absolute) -> BACKEND_URL (what the BFF proxy and
// deploy/server/compose.yml use) -> NEXT_PUBLIC_API_URL -> localhost fallback
export const serverApiUrl = () =>
  process.env.INTERNAL_API_URL
  ?? process.env.BACKEND_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? 'http://localhost:5001'
