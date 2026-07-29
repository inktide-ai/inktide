/**
 * Base URL for all API requests.
 * In dev, Vite proxies /api -> backend (see vite.config.ts).
 * In production, set VITE_API_URL=https://api.example.com to point at a different origin;
 * leave it unset when the frontend and backend are served from the same domain.
 */
export const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL ?? ''
