import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../languages'

const LOCALES = join(__dirname, '../../public/locales')

// Plural forms differ by language (Russian adds _few and _many), so they count as one key.
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix.replace(PLURAL_SUFFIX, '')]
  return [...new Set(Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k)))]
}

const load = (lang: string, file: string) => JSON.parse(readFileSync(join(LOCALES, lang, file), 'utf-8'))

describe('interface translations', () => {
  const files = readdirSync(join(LOCALES, 'en')).filter(f => f.endsWith('.json'))

  it.each(files)('%s has the same keys in every offered language', file => {
    const reference = keys(load('en', file)).sort()
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(keys(load(lang, file)).sort(), `${lang}/${file}`).toEqual(reference)
    }
  })
})
