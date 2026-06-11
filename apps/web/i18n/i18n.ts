import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import commonDe from '../public/locales/de/common.json'
import landingDe from '../public/locales/de/landing.json'
import commonEn from '../public/locales/en/common.json'
import landingEn from '../public/locales/en/landing.json'
import commonEs from '../public/locales/es/common.json'
import landingEs from '../public/locales/es/landing.json'
import commonFr from '../public/locales/fr/common.json'
import landingFr from '../public/locales/fr/landing.json'
import commonJa from '../public/locales/ja/common.json'
import landingJa from '../public/locales/ja/landing.json'
import commonKo from '../public/locales/ko/common.json'
import landingKo from '../public/locales/ko/landing.json'
import commonRu from '../public/locales/ru/common.json'
import landingRu from '../public/locales/ru/landing.json'
import commonZh from '../public/locales/zh/common.json'
import landingZh from '../public/locales/zh/landing.json'
// developer + organization are SSR'd by the (un-gated) developer portal,
// so they must be bundled to avoid a hydration mismatch (raw key on server).
import developerDe from '../public/locales/de/developer.json'
import organizationDe from '../public/locales/de/organization.json'
import developerEn from '../public/locales/en/developer.json'
import organizationEn from '../public/locales/en/organization.json'
import developerEs from '../public/locales/es/developer.json'
import organizationEs from '../public/locales/es/organization.json'
import developerFr from '../public/locales/fr/developer.json'
import organizationFr from '../public/locales/fr/organization.json'
import developerJa from '../public/locales/ja/developer.json'
import organizationJa from '../public/locales/ja/organization.json'
import developerKo from '../public/locales/ko/developer.json'
import organizationKo from '../public/locales/ko/organization.json'
import developerRu from '../public/locales/ru/developer.json'
import organizationRu from '../public/locales/ru/organization.json'
import developerZh from '../public/locales/zh/developer.json'
import organizationZh from '../public/locales/zh/organization.json'

const isBrowser = typeof window !== 'undefined'

// Namespaces needed during SSR (public pages: /, /pricing, /invite, /p/[slug];
// plus the developer portal which renders without a ProtectedRoute gate).
// Other namespaces are fetched lazily by HttpBackend on the client.
const bundledResources = {
  de: { common: commonDe, landing: landingDe, developer: developerDe, organization: organizationDe },
  en: { common: commonEn, landing: landingEn, developer: developerEn, organization: organizationEn },
  es: { common: commonEs, landing: landingEs, developer: developerEs, organization: organizationEs },
  fr: { common: commonFr, landing: landingFr, developer: developerFr, organization: organizationFr },
  ja: { common: commonJa, landing: landingJa, developer: developerJa, organization: organizationJa },
  ko: { common: commonKo, landing: landingKo, developer: developerKo, organization: organizationKo },
  ru: { common: commonRu, landing: landingRu, developer: developerRu, organization: organizationRu },
  zh: { common: commonZh, landing: landingZh, developer: developerZh, organization: organizationZh },
}

// All plugins registered synchronously at module load time.
// HttpBackend is only wired on the client — on the server common resources
// come from bundledResources so no HTTP calls are made during SSR.
if (isBrowser) i18n.use(HttpBackend)
i18n.use(LanguageDetector).use(initReactI18next)

// Init fires immediately when this module is first imported — before any
// component renders. bundledResources makes common available synchronously;
// other namespaces are fetched lazily by HttpBackend.
const _ready = i18n.init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'ru', 'zh', 'ja', 'ko', 'de', 'fr', 'es'],
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
    lookupCookie: 'inktide_lang',
    lookupLocalStorage: 'inktide_lang',
    lookupQuerystring: 'lang',
    cookieMinutes: 60 * 24 * 365,
    cookieDomain: isBrowser ? window.location.hostname : undefined,
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export async function initI18n() {
  await _ready
  return i18n
}

export default i18n
