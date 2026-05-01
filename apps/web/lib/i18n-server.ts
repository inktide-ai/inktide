import { readFileSync } from 'fs'
import { join } from 'path'
import { headers } from 'next/headers'

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

export async function getTranslations(ns: string) {
  const h = await headers()
  const al = h.get('accept-language') ?? ''
  const locale = /\bru\b/.test(al) ? 'ru' : 'en'

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
