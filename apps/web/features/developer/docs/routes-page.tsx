import { DocPage, PageSubtitle, PageTitle, SectionHeading, Table, TableHead, TableRow, Td } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function RoutesPage() {
  const t = await getTranslations('developer')
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.routes.eyebrow')}>{t('docs.routes.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.routes.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.routes.authSection')}</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.routes.colRoute'), t('docs.routes.colDescription')]} />
          <tbody>
            {[
              ['/home',                      'docs.routes.a.home'],
              ['/souls',                     'docs.routes.a.souls'],
              ['/souls/[id]/brain',          'docs.routes.a.brain'],
              ['/souls/[id]/voice',          'docs.routes.a.voice'],
              ['/souls/[id]/channels',       'docs.routes.a.channels'],
              ['/souls/[id]/scene',          'docs.routes.a.scene'],
              ['/souls/[id]/memory',         'docs.routes.a.memory'],
              ['/projects',                  'docs.routes.a.projects'],
              ['/projects/[id]/character',   'docs.routes.a.projectCharacter'],
              ['/projects/[id]/graph',       'docs.routes.a.projectGraph'],
              ['/projects/[id]/channels',    'docs.routes.a.projectChannels'],
              ['/projects/[id]/memory',      'docs.routes.a.projectMemory'],
              ['/projects/[id]/plugins',     'docs.routes.a.projectPlugins'],
              ['/projects/[id]/scene',       'docs.routes.a.projectScene'],
              ['/edit/sandbox',              'docs.routes.a.sandbox'],
              ['/marketplace',               'docs.routes.a.marketplace'],
              ['/templates',                 'docs.routes.a.templates'],
              ['/developer',                 'docs.routes.a.developer'],
              ['/billing',                   'docs.routes.a.billing'],
              ['/invite/[token]',            'docs.routes.a.invite'],
            ].map(([route, descKey]) => (
              <TableRow key={route}>
                <Td mono accent>{route}</Td>
                <Td>{t(descKey)}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>{t('docs.routes.publicSection')}</SectionHeading>
      <Table>
        <TableHead cols={[t('docs.routes.colRoute'), t('docs.routes.colDescription')]} />
        <tbody>
          {[
            ['/obs/scene',     'docs.routes.pub.obs'],
            ['/pricing',       'docs.routes.pub.pricing'],
            ['/p/[id]',        'docs.routes.pub.share'],
            ['/home',          'docs.routes.pub.home'],
            ['/login',         'docs.routes.pub.login'],
            ['/register',      'docs.routes.pub.register'],
          ].map(([route, descKey]) => (
            <TableRow key={route}>
              <Td mono accent>{route}</Td>
              <Td>{t(descKey)}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionHeading>{t('docs.routes.constantsSection')}</SectionHeading>
      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
        <pre className="overflow-x-auto bg-[var(--surface-1)] px-5 py-4 text-sm font-mono leading-relaxed text-[var(--text-secondary)]">
{`// apps/web/lib/routes.ts
export const HOME_ROUTE         = '/home'
export const SOULS_ROUTE        = '/souls'
export const PROJECTS_ROUTE     = '/projects'
export const TEMPLATES_ROUTE    = '/templates'
export const MARKETPLACE_ROUTE  = '/marketplace'
export const SANDBOX_ROUTE      = '/edit/sandbox'
export const DEVELOPER_ROUTE    = '/developer'`}
        </pre>
      </div>
    </DocPage>
  )
}
