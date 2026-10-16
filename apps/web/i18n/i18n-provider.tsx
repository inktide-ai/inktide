'use client'

import { useMemo, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import type { Language } from './languages'

/**
 * The server shares one i18next instance between requests and has no browser to
 * detect from, so without this every page was rendered in English and then
 * re-rendered in the visitor's language after hydration (React #418). On the
 * server each request renders through a clone set to its language; the browser
 * keeps the shared instance, whose detector reads the same cookie and languages.
 */
export function I18nProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  const instance = useMemo(
    () => (typeof window === 'undefined' ? i18n.cloneInstance({ lng: lang, initAsync: false }) : i18n),
    [lang],
  )
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
