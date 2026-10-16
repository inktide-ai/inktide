import type { Metadata } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'
import { headers, cookies } from 'next/headers'
import { LANGUAGE_COOKIE, isSupportedLanguage, languageFromAcceptLanguage, type Language } from '@/i18n/languages'

function resolve(obj: Record<string, unknown>, key: string): string | undefined {
  let cur: unknown = obj
  for (const part of key.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

function loadLocale(locale: string, ns: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'public/locales', locale, `${ns}.json`), 'utf-8'))
  } catch {
    return {}
  }
}

/** The request's interface language, chosen from the same sources as the browser detector. */
export async function getLocale(): Promise<Language> {
  const fromCookie = (await cookies()).get(LANGUAGE_COOKIE)?.value
  if (isSupportedLanguage(fromCookie)) return fromCookie
  return languageFromAcceptLanguage((await headers()).get('accept-language'))
}

/** `export const generateMetadata = titleMetadata('dashboard')` — the root layout appends "— Quackie". */
export function titleMetadata(key: string) {
  return async (): Promise<Metadata> => ({ title: (await getTranslations('common'))(`meta.${key}`) })
}

export async function getTranslations(ns: string) {
  const locale = await getLocale()

  const data = loadLocale(locale, ns)
  const fallback = locale !== 'en' ? loadLocale('en', ns) : {}

  return (key: string, vars?: Record<string, string | number>) => {
    let value = resolve(data, key) ?? resolve(fallback, key) ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(`{{${k}}}`, String(v))
      }
    }
    return value
  }
}
