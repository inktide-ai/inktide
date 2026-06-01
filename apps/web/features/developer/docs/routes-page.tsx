import { DocPage, PageSubtitle, PageTitle, SectionHeading, Table, TableHead, TableRow, Td } from './shared'

export function RoutesPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Platform">Frontend Routes</PageTitle>
      <PageSubtitle>
        Next.js App Router. Workspace routes require Keycloak authentication. Public routes do not.
      </PageSubtitle>

      <SectionHeading>Authenticated (workspace)</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={['Route', 'Description']} />
          <tbody>
            {[
              ['/home',                      'Workspace dashboard — stats, souls, recent projects, templates'],
              ['/souls',                     'AI soul list with search, filters, drag-to-reorder'],
              ['/souls/[id]/brain',          'LLM provider + model configuration (30+ providers)'],
              ['/souls/[id]/voice',          'TTS provider + voice configuration (30+ providers)'],
              ['/souls/[id]/channels',       'Connected platform channels (Discord, Twitch, Telegram)'],
              ['/souls/[id]/scene',          'VRM/GLB avatar, background, OBS scene settings'],
              ['/souls/[id]/memory',         'RAG memory settings + ingested facts viewer'],
              ['/projects',                  'Project list + detail — projects bind souls to graph configs'],
              ['/projects/[id]/character',   'Soul binding for the project'],
              ['/projects/[id]/graph',       'Visual node graph for the project pipeline'],
              ['/projects/[id]/channels',    'Project-level channel configuration'],
              ['/projects/[id]/memory',      'Project memory settings'],
              ['/projects/[id]/plugins',     'Installed plugins for the project'],
              ['/projects/[id]/scene',       'Scene / OBS settings for the project'],
              ['/edit/sandbox',              'Main workspace — Dockview panel layout, live VRM preview'],
              ['/edit/graph',                'Standalone node graph builder (XYFlow/React)'],
              ['/edit/settings/[segment]',   'Soul settings tabs: identity, brain, voice, model, scene, memory, skills, channels, obs, backup'],
              ['/marketplace',               'Connector marketplace — install channels and plugins'],
              ['/templates',                 'Project template gallery — system + user templates'],
              ['/developer',                 'Developer portal — docs, OAuth apps, webhooks'],
              ['/billing',                   'Billing and subscription management'],
              ['/invite/[token]',            'Organization invite acceptance'],
            ].map(([route, desc]) => (
              <TableRow key={route}>
                <Td mono accent>{route}</Td>
                <Td>{desc}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>Public (unauthenticated)</SectionHeading>
      <Table>
        <TableHead cols={['Route', 'Description']} />
        <tbody>
          {[
            ['/obs/scene',     'OBS browser source — configured entirely via URL params: channelId, modelUrl, modelType, sceneUrl, bg'],
            ['/pricing',       'Pricing and plan comparison page'],
            ['/p/[id]',        'Public soul/project share page'],
            ['/home',          'Marketing home page (before login)'],
            ['/login',         'Keycloak login redirect'],
            ['/register',      'Keycloak register redirect'],
          ].map(([route, desc]) => (
            <TableRow key={route}>
              <Td mono accent>{route}</Td>
              <Td>{desc}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionHeading>Route Constants</SectionHeading>
      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
        <pre className="overflow-x-auto bg-[var(--surface-1)] px-5 py-4 text-sm font-mono leading-relaxed text-[var(--text-secondary)]">
{`// apps/web/lib/routes.ts
export const HOME_ROUTE              = '/home'
export const SOULS_ROUTE             = '/souls'
export const PROJECTS_ROUTE          = '/projects'
export const TEMPLATES_ROUTE         = '/templates'
export const MARKETPLACE_ROUTE       = '/marketplace'
export const SANDBOX_ROUTE           = '/edit/sandbox'
export const GRAPH_ROUTE             = '/edit/graph'
export const PROFILE_SETTINGS_BASE   = '/edit/settings'
export const DEVELOPER_ROUTE         = '/developer'`}
        </pre>
      </div>
    </DocPage>
  )
}
