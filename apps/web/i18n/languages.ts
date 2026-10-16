// Interface languages. Russian is the primary market and English covers everyone else;
// the other locale folders in public/locales stay on disk but are no longer offered.
export const SUPPORTED_LANGUAGES = ['ru', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const FALLBACK_LANGUAGE: Language = 'en'

// Shared by the browser detector and the server, so both pick the same language.
export const LANGUAGE_COOKIE = 'inktide_lang'

export function isSupportedLanguage(value: string | undefined | null): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * Picks the interface language from an Accept-Language header the way the browser
 * detector reads navigator.languages: the first listed language we support wins.
 */
export function languageFromAcceptLanguage(header: string | null | undefined): Language {
  for (const part of (header ?? '').split(',')) {
    const primary = part.split(';')[0].trim().toLowerCase().split('-')[0]
    if (isSupportedLanguage(primary)) return primary
  }
  return FALLBACK_LANGUAGE
}
