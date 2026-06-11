import Link from 'next/link'
import { getTranslations } from '@/lib/i18n-server'

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-[var(--bg-0)]">
      <p className="text-[4rem] font-bold leading-none text-[var(--text-primary)]">404</p>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t('notFound.title')}</h1>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">{t('notFound.description')}</p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {t('notFound.home')}
      </Link>
    </div>
  )
}
