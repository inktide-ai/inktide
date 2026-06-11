import { CodeBlock, DocPage, InfoBox, InlineCode, PageSubtitle, PageTitle, SectionHeading, SubHeading, Table, TableHead, TableRow, Td, TdBold } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function FrontendPage() {
  const t = await getTranslations('developer')
  const layerRules: [string, string, string][] = [
    ['app/',      'features, entities, shared, widgets', '—'],
    ['features/', 'entities, shared, api',               t('docs.frontend.ruleOtherFeatures')],
    ['entities/', 'shared, api',                         'features'],
    ['shared/',   t('docs.frontend.ruleNothingAbove'),   'features, entities, app'],
    ['widgets/',  'features, entities, shared',          '—'],
  ]
  const dataFetching: [string, string][] = [
    [t('docs.frontend.conceptQueryClient'), 'shared/lib/query/client.ts — TanStack Query v5'],
    [t('docs.frontend.conceptQueryKeys'),   'shared/lib/query/keys.ts — always use these, never inline strings'],
    [t('docs.frontend.conceptApiClient'),   'api/client.ts — apiFetch() with bearer token + 401 auto-refresh'],
    [t('docs.frontend.conceptAuthWiring'),  'configureApiAuth(provider) in components/providers.tsx'],
  ]
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.frontend.eyebrow')}>{t('docs.frontend.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.frontend.sub1')}{' '}<InlineCode>@</InlineCode>{' '}{t('docs.frontend.sub2')}{' '}<InlineCode>apps/web/</InlineCode>.
      </PageSubtitle>

      <SectionHeading>{t('docs.frontend.fsdStructure')}</SectionHeading>
      <CodeBlock>
{`apps/web/
  app/        — Next.js App Router pages (thin route shells, no business logic)
  features/   — account, auth, developer, graph, marketplace, projects,
                sandbox, soul, templates, workspace-home, ...
  entities/   — billing, character, project, soul
  shared/     — ui/, lib/, hooks/, services/, types/, data/
  api/        — raw fetch wrappers: client.ts, me.ts, config.ts
  widgets/    — workspace-sidebar, obs-overlay
  components/ — legacy global components (being migrated to features/)
  lib/        — legacy utilities (being migrated to shared/lib/)`}
      </CodeBlock>

      <SubHeading>{t('docs.frontend.layerRules')}</SubHeading>
      <Table>
        <TableHead cols={[t('docs.frontend.colLayer'), t('docs.frontend.colCanImport'), t('docs.frontend.colCannotImport')]} />
        <tbody>
          {layerRules.map(([layer, can, cannot]) => (
            <TableRow key={layer}>
              <Td mono accent>{layer}</Td>
              <Td>{can}</Td>
              <Td>{cannot}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionHeading>{t('docs.frontend.dataFetching')}</SectionHeading>
      <Table>
        <TableHead cols={[t('docs.frontend.colConcept'), t('docs.frontend.colLocation')]} />
        <tbody>
          {dataFetching.map(([k, v]) => (
            <TableRow key={k}>
              <TdBold>{k}</TdBold>
              <Td mono>{v}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionHeading>{t('docs.frontend.authFlow')}</SectionHeading>
      <CodeBlock>
{`Next-auth v5 BFF (Backend-for-Frontend) — tokens never touch the browser.

1. User clicks "Sign in" → redirected to Keycloak (Authorization Code + PKCE)
2. Keycloak redirects back → next-auth exchanges code for tokens server-side
3. Tokens stored in an encrypted HttpOnly session cookie (__session)
4. All /api/* fetch calls go through app/api/[...path]/route.ts:
     - next-auth reads the session server-side
     - injects Authorization: Bearer <access_token>
     - forwards the request to http://127.0.0.1:5001/api/*
5. Middleware (middleware.ts) protects routes via next-auth session check
6. Token refresh: next-auth refreshes automatically with a 60 s buffer

// Session shape available in Server Components
import { auth } from '@/lib/auth'
const session = await auth()
session.user.id        // Keycloak sub
session.user.name      // preferred_username
session.user.roles     // realm_access.roles[]
session.accessToken    // raw JWT (inject as Bearer when calling .NET directly)`}
      </CodeBlock>

      <SectionHeading>{t('docs.frontend.characterModel')}</SectionHeading>
      <CodeBlock label="shared/lib/character/types.ts">
{`// AiCharacter split by Interface Segregation Principle
CharacterIdentity    — name, avatar, description, emoji
CharacterAppearance  — VRM model URL, background, scale, position
CharacterLlm         — provider, model, system prompt, temperature, top-p
CharacterTts         — provider, voice ID, speed, pitch, format
CharacterBehavior    — response triggers, cooldowns, keyword filters
CharacterMemory      — RAG enabled, memory scope, max fact count
CharacterAutoPilot   — autonomous response settings, idle behavior`}
      </CodeBlock>

      <SectionHeading>{t('docs.frontend.apiProxy')}</SectionHeading>
      <CodeBlock label="next.config.ts">
{`/api/*   →  http://127.0.0.1:5001/api/*   (backend REST)
/hubs/*  →  http://127.0.0.1:5001/hubs/*  (SignalR — Realtime AudioHub)`}
      </CodeBlock>

      <SectionHeading>{t('docs.frontend.vrmPipeline')}</SectionHeading>
      <CodeBlock label="shared/services/animation/registry.ts">
{`CONTROLLER_FACTORIES — ordered list of controller factories.
Each VrmRenderer instance gets its own controller set, running top-to-bottom
each frame:
  ExpressionController      — facial blend shapes
  HeadPoseController        — head rotation from gaze
  GazeController            — eye tracking
  JiggleController          — physics-based hair/cloth
  AnimationStateMachineController — idle/talk/emote state machine

To add a controller: implement IVrmController and insert a factory.
Never modify VrmRenderer.tsx directly.`}
      </CodeBlock>

      <div className="mt-6">
        <InfoBox>
          <span className="font-semibold text-[var(--text-primary)]">{t('docs.frontend.obsLabel')}</span>
          <InlineCode>/obs/scene</InlineCode>{' '}{t('docs.frontend.obs1')}{' '}
          <InlineCode>channelId</InlineCode>{' '}{t('docs.frontend.obs2')}{' '}<InlineCode>modelUrl</InlineCode>, <InlineCode>modelType</InlineCode>{' '}{t('docs.frontend.obs3')}{' '}
          <InlineCode>sceneUrl</InlineCode>{' '}{t('docs.frontend.obs4')}{' '}<InlineCode>bg</InlineCode>{' '}{t('docs.frontend.obs5')}{' '}<InlineCode>transparent</InlineCode>{t('docs.frontend.obs6')}
        </InfoBox>
      </div>
    </DocPage>
  )
}
