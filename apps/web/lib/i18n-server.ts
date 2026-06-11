import { readFileSync } from 'fs'
import { join } from 'path'
import { headers, cookies } from 'next/headers'

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

const SUPPORTED_LNGS = ['en', 'ru', 'zh', 'ja', 'ko', 'de', 'fr', 'es']

export async function getTranslations(ns: string) {
  const jar = await cookies()
  const fromCookie = jar.get('inktide_lang')?.value

  let locale: string
  if (fromCookie && SUPPORTED_LNGS.includes(fromCookie)) {
    locale = fromCookie
  } else {
    const h = await headers()
    const al = (h.get('accept-language') ?? '').toLowerCase()
    locale = SUPPORTED_LNGS.find(l => new RegExp(`\\b${l}\\b`).test(al)) ?? 'en'
  }

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
