'use client'

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppTopBar } from '@/features/workspace-home'

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  return (
    <>
      <AppTopBar title={t('templates.title')} variant="page" />
      <main className="flex-1 overflow-auto">{children}</main>
    </>
  )
}
