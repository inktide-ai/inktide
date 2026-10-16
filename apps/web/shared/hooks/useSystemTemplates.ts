'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SYSTEM_TEMPLATES, localizeSystemTemplate, type ProjectTemplate } from '@/shared/data/project-templates'

/** The built-in project templates, with their visible text in the current interface language. */
export function useSystemTemplates(): ProjectTemplate[] {
  const { t } = useTranslation('common')
  return useMemo(() => SYSTEM_TEMPLATES.map(tpl => localizeSystemTemplate(tpl, t)), [t])
}
