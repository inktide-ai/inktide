import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const isBrowser = typeof window !== 'undefined'

export async function initI18n() {
  if (i18n.isInitialized) return i18n

  if (isBrowser) {
    const HttpBackend = (await import('i18next-http-backend')).default
    i18n.use(HttpBackend)
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)

  await i18n.init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'zh', 'ja', 'ko', 'de', 'fr', 'es'],
    defaultNS: 'common',
    ns: ['common', 'landing', 'model', 'behavior', 'brain', 'backup', 'providers', 'obs', 'channels', 'scene', 'scenes', 'prompts', 'voice', 'profile'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['cookie', 'querystring', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'inktide_lang',
      lookupLocalStorage: 'inktide_lang',
      lookupQuerystring: 'lang',
      cookieMinutes: 60 * 24 * 365,
      cookieDomain: typeof window !== 'undefined' ? window.location.hostname : undefined,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

  return i18n
}

export default i18n
