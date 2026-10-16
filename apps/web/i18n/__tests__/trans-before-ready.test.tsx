import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// In the browser i18next stays "not ready" until HttpBackend has fetched every namespace in
// `ns`, which is still the case while the page hydrates. useTranslation then hands out a t
// without its namespace attached, so a <Trans> without `ns` falls back to `common` and prints
// the raw key, and React reports a hydration mismatch against the server's translated HTML.
describe('<Trans> while the client is still loading namespaces', () => {
  beforeEach(() => {
    vi.resetModules()
    document.cookie = 'inktide_lang=ru; path=/'
    // Keep the backend's fetches pending, the way they are during hydration.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.cookie = 'inktide_lang=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('renders the landing headline, not its key, when the namespace is given', async () => {
    const [{ default: i18n }, { Trans, useTranslation }] = await Promise.all([import('../i18n'), import('react-i18next')])
    expect(i18n.isInitialized).toBeFalsy()

    function Headline() {
      const { t } = useTranslation('landing')
      return <Trans ns="landing" t={t} i18nKey="stage.listen.title2" components={{ accent: <b /> }} />
    }
    render(<Headline />)

    expect(screen.getByText('слышит.').tagName).toBe('B')
    expect(document.body.textContent).toBe('Всё слышит.')
  })
})
