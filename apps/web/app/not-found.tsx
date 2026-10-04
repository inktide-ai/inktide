import { getTranslations } from '@/lib/i18n-server'
import { ErrorScreen } from '@/widgets/error-screen'

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <ErrorScreen
      code="404"
      caption="No signal"
      title={t('notFound.title')}
      description={t('notFound.description')}
      primary={{ label: t('notFound.home'), href: '/' }}
    />
  )
}
