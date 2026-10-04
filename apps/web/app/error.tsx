'use client'

import '@/i18n/i18n'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorScreen } from '@/widgets/error-screen'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useTranslation('common')

  useEffect(() => {
    // Log to your error tracking service here (e.g., Sentry.captureException(error))
    console.error('[Route Error]', error)
  }, [error])

  return (
    <ErrorScreen
      code="500"
      caption="Technical difficulties"
      title={t('errorBoundary.title')}
      description={t('errorBoundary.description')}
      primary={{ label: t('errorBoundary.retry'), onClick: reset }}
      secondary={{ label: t('notFound.home'), href: '/' }}
      reference={error.digest}
    />
  )
}
