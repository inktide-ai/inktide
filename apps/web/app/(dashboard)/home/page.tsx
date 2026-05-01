'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/context/CharactersContext'
import SceneFullscreen from '@/components/ProfilePage/tabs/SceneFullscreen'
import { PROFILE_SETTINGS_BASE } from '@/lib/routes'

export default function HomePage() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { selected, loading } = useCharactersContext()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
        <p className="text-sm">{t('emptyState.loadingCharacters')}</p>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <div className="text-5xl">🎬</div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('emptyState.noCharacterSelected')}</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">{t('emptyState.noCharacterSelectedDesc')}</p>
      </div>
    )
  }

  return (
    <SceneFullscreen
      character={selected}
      cardId={selected.id}
      onOpenSettings={() => router.push(PROFILE_SETTINGS_BASE)}
    />
  )
}
