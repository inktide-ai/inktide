import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '../../context/CharactersContext'
import { PROFILE_SETTINGS_BASE } from '../../constants/settingsRoutes'
import styles from '../../components/ProfilePage/ProfilePage.module.css'

const SEGMENT_TO_TAB: Record<string, string> = {
  identity: 'profile',
  skills: 'skills',
  model: 'avatars',
  scene: 'scene',
  memory: 'memory',
  brain: 'brain',
  voice: 'voice',
  integrations: 'connection',
  obs: 'obs',
  backup: 'backup',
}

function settingsTitleKey(segment: string): string {
  if (segment === 'account') return 'common:sidebar.profile'
  const tab = SEGMENT_TO_TAB[segment]
  return tab ? `profile:tabs.${tab}.label` : segment
}

export default function ProfileSettingsSectionLayout() {
  const { t } = useTranslation(['common', 'profile'])
  const navigate = useNavigate()
  const location = useLocation()
  const {
    selected,
    isDirty, saveStatus, saveError,
    discardChanges, handleSave,
  } = useCharactersContext()

  const segment = location.pathname.replace(`${PROFILE_SETTINGS_BASE}/`, '').split('/')[0] ?? ''

  if (!selected) return null

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderRow}>
          <div>
            <button type="button" className={styles.backBtn} onClick={() => navigate(PROFILE_SETTINGS_BASE)}>
              <span className={styles.backBtnArrow} aria-hidden>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M6.5 2L3.5 5L6.5 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {t('common:emptyState.backToSections')}
            </button>
          </div>
          <div className={styles.pageHeaderActions}>
            <span
              className={`${styles.statusBadge} ${
                selected.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
              }`}
            >
              {selected.isActive ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                  <circle cx="4" cy="4" r="3" fill="currentColor" />
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                  <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
              {selected.isActive ? t('common:badge.active') : t('common:badge.inactive')}
            </span>
          </div>
        </div>
      </div>

      {saveStatus === 'error' && saveError && (
        <div className={styles.errorBanner}>⚠ {saveError}</div>
      )}

      <div className={styles.panel}>
        <h2 className={styles.sectionHeading}>{t(settingsTitleKey(segment) as never)}</h2>
        <Outlet />
      </div>

      {isDirty && (
        <div className={styles.saveBar}>
          <span
            className={`${styles.saveBarText} ${
              saveStatus === 'error' ? styles.saveBarTextError :
              saveStatus === 'saved' ? styles.saveBarTextSuccess : ''
            }`}
          >
            {saveStatus === 'saving' ? t('common:saveBar.saving') :
             saveStatus === 'saved'  ? t('common:saveBar.saved') :
             saveStatus === 'error'  ? (saveError ?? t('common:saveBar.failed')) :
             t('common:saveBar.unsaved')}
          </span>
          <button
            type="button"
            className={styles.btnDiscard}
            onClick={discardChanges}
            disabled={saveStatus === 'saving'}
          >
            {t('common:saveBar.discard')}
          </button>
          <button
            type="button"
            className={styles.btnSave}
            onClick={() => void handleSave()}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? t('common:saveBar.saving') : t('common:saveBar.save')}
          </button>
        </div>
      )}
    </>
  )
}
