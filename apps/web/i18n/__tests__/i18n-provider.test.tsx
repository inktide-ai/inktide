// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { useTranslation } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '../i18n-provider'

function DashboardTitle() {
  const { t } = useTranslation('common')
  return <span>{t('meta.dashboard')}</span>
}

const renderAs = (lang: 'ru' | 'en') =>
  renderToString(<I18nProvider lang={lang}><DashboardTitle /></I18nProvider>)

describe('I18nProvider on the server', () => {
  it('renders the page in the language of the request', () => {
    expect(renderAs('ru')).toContain('Дашборд')
    expect(renderAs('en')).toContain('Dashboard')
  })

  it('does not leak one request language into the next', () => {
    renderAs('ru')
    expect(renderAs('en')).toContain('Dashboard')
    expect(renderAs('ru')).toContain('Дашборд')
  })
})
