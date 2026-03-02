/**
 * Shared API types and localStorage key constants.
 */

export interface ApiError {
  error: string
  code?: string
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_EMAIL: 'userEmail',
} as const
