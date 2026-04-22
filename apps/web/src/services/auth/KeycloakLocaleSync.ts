import i18n from '../../i18n/i18n'
import type { ILocaleSync } from '../../ports/ILocaleSync'

const SUPPORTED = new Set(['en', 'ru'])

/** SRP: единственная ответственность — синхронизировать язык i18n из locale-клейма токена. */
export class KeycloakLocaleSync implements ILocaleSync {
  sync(locale: string | undefined): void {
    const lang = locale?.split('-')[0] // 'ru-RU' → 'ru'
    if (lang && SUPPORTED.has(lang)) {
      void i18n.changeLanguage(lang)
    }
  }
}
