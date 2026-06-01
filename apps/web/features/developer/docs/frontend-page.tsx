import { CodeBlock, DocPage, InfoBox, InlineCode, PageSubtitle, PageTitle, SectionHeading, SubHeading, Table, TableHead, TableRow, Td, TdBold } from './shared'

export function FrontendPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Platform">Frontend Architecture</PageTitle>
      <PageSubtitle>
        Next.js 16 App Router with Feature-Sliced Design (FSD). Path alias <InlineCode>@</InlineCode> resolves to <InlineCode>apps/web/</InlineCode>.
      </PageSubtitle>

      <SectionHeading>FSD Layer Structure</SectionHeading>
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

      <SubHeading>Layer rules</SubHeading>
      <Table>
        <TableHead cols={['Layer', 'Can import from', 'Cannot import from']} />
        <tbody>
          {[
            ['app/',      'features, entities, shared, widgets', '—'],
            ['features/', 'entities, shared, api',              'Other features directly'],
            ['entities/', 'shared, api',                        'features'],
            ['shared/',   'Nothing above it',                   'features, entities, app'],
            ['widgets/',  'features, entities, shared',         '—'],
          ].map(([layer, can, cannot]) => (
            <TableRow key={layer}>
              <Td mono accent>{layer}</Td>
              <Td>{can}</Td>
              <Td>{cannot}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionHeading>Data Fetching</SectionHeading>
      <Table>
        <TableHead cols={['Concept', 'Location']} />
        <tbody>
          {[
            ['Query client',  'shared/lib/query/client.ts — TanStack Query v5'],
            ['Query keys',    'shared/lib/query/keys.ts — always use these, never inline strings'],
            ['API client',    'api/client.ts — apiFetch() with bearer token + 401 auto-refresh'],
            ['Auth wiring',   'configureApiAuth(provider) in components/providers.tsx'],
          ].map(([k, v]) => (
            <TableRow key={k}>
              <TdBold>{k}</TdBold>
              <Td mono>{v}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionHeading>Auth Flow</SectionHeading>
      <CodeBlock>
{`1. Keycloak-js initialized once in components/providers.tsx (KeycloakBootstrap)
2. Tokens stored in localStorage:
     inktide_kc_token   — access token
     inktide_kc_refresh — refresh token
3. Cookie set by middleware: inktide_auth (used for SSR route protection)
4. JWT claims extracted in AuthContext.tsx:
     sub               → userId
     preferred_username → display name
     realm_access.roles → roles array
5. Primary role: "admin" if present, else first role, else "user"`}
      </CodeBlock>

      <SectionHeading>Character / Soul Model</SectionHeading>
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

      <SectionHeading>API Proxy (Next.js rewrites)</SectionHeading>
      <CodeBlock label="next.config.ts">
{`/api/*   →  http://127.0.0.1:5001/api/*   (backend REST)
/hubs/*  →  http://127.0.0.1:5001/hubs/*  (SignalR — Realtime AudioHub)`}
      </CodeBlock>

      <SectionHeading>VRM Animation Pipeline</SectionHeading>
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
          <span className="font-semibold text-[var(--text-primary)]">OBS Browser Source: </span>
          <InlineCode>/obs/scene</InlineCode> is unauthenticated. All config is passed via URL search params:
          <InlineCode>channelId</InlineCode> (required), <InlineCode>modelUrl</InlineCode>, <InlineCode>modelType</InlineCode> (vrm|glb|live2d),
          <InlineCode>sceneUrl</InlineCode> (background image), <InlineCode>bg</InlineCode> (CSS color or <InlineCode>transparent</InlineCode>).
        </InfoBox>
      </div>
    </DocPage>
  )
}
