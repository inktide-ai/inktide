import { useTranslation } from 'react-i18next'
import styles from './LanguageSwitcher.module.css'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
]

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className={styles.switcher}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={current === code ? styles.active : styles.item}
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
