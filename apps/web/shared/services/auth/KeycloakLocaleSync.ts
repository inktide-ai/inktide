import type { ILocaleSync } from '@/shared/types/ILocaleSync'

/**
 * Language is managed via the user's global preferences (LanguageSync component).
 * The Keycloak token locale is intentionally not applied — it reflects the browser's
 * UI language at registration time and would override the user's explicit language choice.
 */
export class KeycloakLocaleSync implements ILocaleSync {
  sync(_locale: string | undefined): void {
    // no-op
  }
}
