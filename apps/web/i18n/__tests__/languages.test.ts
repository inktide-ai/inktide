import { describe, expect, it } from 'vitest'
import { isSupportedLanguage, languageFromAcceptLanguage } from '../languages'

describe('languageFromAcceptLanguage', () => {
  it('picks Russian for a Russian browser', () => {
    expect(languageFromAcceptLanguage('ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('ru')
  })

  it('follows the browser order, so Russian listed before English wins', () => {
    expect(languageFromAcceptLanguage('uk-UA,uk;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6')).toBe('ru')
  })

  it('keeps English for a browser that lists English first', () => {
    expect(languageFromAcceptLanguage('en-US,en;q=0.9,ru;q=0.8')).toBe('en')
  })

  it('falls back to English when no listed language is offered', () => {
    expect(languageFromAcceptLanguage('de-DE,de;q=0.9,fr;q=0.8')).toBe('en')
    expect(languageFromAcceptLanguage('')).toBe('en')
    expect(languageFromAcceptLanguage(null)).toBe('en')
  })
})

describe('isSupportedLanguage', () => {
  it('accepts only the offered interface languages', () => {
    expect(isSupportedLanguage('ru')).toBe(true)
    expect(isSupportedLanguage('en')).toBe(true)
    expect(isSupportedLanguage('de')).toBe(false)
    expect(isSupportedLanguage(undefined)).toBe(false)
  })
})
