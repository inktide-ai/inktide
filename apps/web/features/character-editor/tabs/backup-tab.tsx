'use client'
import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'

interface BackupTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BackupTab = ({ character: _character, onUpdate: _onUpdate }: BackupTabProps) => {
  const { t } = useTranslation('backup')

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="flex flex-col gap-3 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0 border-t border-(--border) pt-4 mt-6">
        <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('section.title')}</div>
        <div className="py-2">
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}>💾</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('title')}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              {t('desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupTab
