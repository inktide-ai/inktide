import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import commonEn from '../public/locales/en/common.json'
import landingEn from '../public/locales/en/landing.json'
import commonRu from '../public/locales/ru/common.json'
import landingRu from '../public/locales/ru/landing.json'
// developer + organization are SSR'd by the (un-gated) developer portal,
// so they must be bundled to avoid a hydration mismatch (raw key on server).
import developerEn from '../public/locales/en/developer.json'
import organizationEn from '../public/locales/en/organization.json'
import developerRu from '../public/locales/ru/developer.json'
import organizationRu from '../public/locales/ru/organization.json'
import { FALLBACK_LANGUAGE, LANGUAGE_COOKIE, SUPPORTED_LANGUAGES, type Language } from './languages'

const isBrowser = typeof window !== 'undefined'

// Namespaces needed during SSR (public pages: /, /pricing, /invite, /p/[slug];
// plus the developer portal which renders without a ProtectedRoute gate).
// Other namespaces are fetched lazily by HttpBackend on the client.
const bundledResources: Record<Language, Record<string, object>> = {
  en: { common: commonEn, landing: landingEn, developer: developerEn, organization: organizationEn },
  ru: { common: commonRu, landing: landingRu, developer: developerRu, organization: organizationRu },
}

// All plugins registered synchronously at module load time.
// HttpBackend is only wired on the client - on the server common resources
// come from bundledResources so no HTTP calls are made during SSR.
if (isBrowser) i18n.use(HttpBackend)
i18n.use(LanguageDetector).use(initReactI18next)

// Init fires immediately when this module is first imported - before any
// component renders. bundledResources makes common available synchronously;
// other namespaces are fetched lazily by HttpBackend.
const _ready = i18n.init({
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  defaultNS: 'common',
  ns: ['common', 'landing', 'model', 'behavior', 'brain', 'backup', 'providers', 'obs', 'channels', 'scene', 'scenes', 'prompts', 'voice', 'profile', 'developer', 'organization'],
  resources: bundledResources,
  partialBundledLanguages: true,
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  detection: {
    order: ['cookie', 'querystring', 'localStorage', 'navigator'],
    caches: ['cookie', 'localStorage'],
    lookupCookie: LANGUAGE_COOKIE,
    lookupLocalStorage: LANGUAGE_COOKIE,
    lookupQuerystring: 'lang',
    cookieMinutes: 60 * 24 * 365,
    cookieDomain: isBrowser ? window.location.hostname : undefined,
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

// The server sets <html lang> for the first paint; keep it in step after a switch.
if (isBrowser) i18n.on('languageChanged', lng => { document.documentElement.lang = lng })

export async function initI18n() {
  await _ready
  return i18n
}

export default i18n
