import { CodeBlock, DocPage, InfoBox, InlineCode, MethodBadge, PageSubtitle, PageTitle, SectionHeading, SubHeading, Table, TableHead, TableRow, Td } from './shared'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Endpoint = [Method, string, string]

const PROFILE: Endpoint[] = [
  ['GET',    '/v1/me',                                       'Current user (userId, userName, role, pictureUrl)'],
  ['DELETE', '/v1/me',                                       'Delete account — purges DB + removes from Keycloak'],
  ['PATCH',  '/v1/me/avatar',                                'Update avatar from storage object key'],
  ['GET',    '/v1/me/preferences',                           'Global preferences (appearance, language, notifications)'],
  ['PATCH',  '/v1/me/preferences',                           'Update global preferences'],
  ['GET',    '/v1/me/preferences/workspace/{characterId}',   'Workspace preferences (hub layout, scene settings)'],
  ['PATCH',  '/v1/me/preferences/workspace/{characterId}',   'Update workspace preferences'],
  ['POST',   '/v1/me/email-change/request',                  'Request email change (sends verification email)'],
  ['POST',   '/v1/me/email-change/verify',                   'Verify email change with token'],
]

const SOULS: Endpoint[] = [
  ['GET',    '/v1/souls/cards',                              'List souls (paginated: limit, cursor)'],
  ['POST',   '/v1/souls/cards',                              'Create soul — 402 if plan limit exceeded'],
  ['GET',    '/v1/souls/cards/{cardId}',                     'Get soul details'],
  ['PUT',    '/v1/souls/cards/{cardId}',                     'Update soul configuration'],
  ['DELETE', '/v1/souls/cards/{cardId}',                     'Delete soul'],
  ['PATCH',  '/v1/souls/cards/{cardId}/status',              'Update soul status'],
  ['PATCH',  '/v1/souls/cards/{cardId}/position',            'Reorder soul in list'],
  ['GET',    '/v1/souls/cards/{cardId}/activity',            'Soul activity log (paginated)'],
  ['GET',    '/v1/souls/cards/{cardId}/export',              'Export soul as ZIP'],
  ['GET',    '/v1/souls/cards/{cardId}/models',              'LLM model configuration for soul'],
  ['GET',    '/v1/souls/credentials',                        'LLM provider credentials'],
  ['GET',    '/v1/souls/public/{slug}',                      'Public soul profile by slug (no auth required)'],
  ['GET',    '/v1/souls/public/{slug}/activity',             'Public soul activity feed (no auth required)'],
  ['GET',    '/v1/soul/catalog',                             'Available soul catalog'],
]

const PROJECTS: Endpoint[] = [
  ['GET',    '/v1/projects',                                 'List projects (paginated by soul, cursor-based)'],
  ['POST',   '/v1/projects',                                 'Create project'],
  ['GET',    '/v1/projects/{id}',                            'Get project details'],
  ['PUT',    '/v1/projects/{id}',                            'Update project'],
  ['DELETE', '/v1/projects/{id}',                            'Delete project'],
  ['PUT',    '/v1/projects/{id}/soul',                       'Bind soul to project'],
  ['DELETE', '/v1/projects/{id}/soul',                       'Unbind soul from project'],
  ['PATCH',  '/v1/projects/{id}/scene-config',               'Update scene configuration'],
  ['PATCH',  '/v1/projects/{id}/position',                   'Reorder project'],
  ['POST',   '/v1/projects/export',                          'Export project as ZIP'],
  ['POST',   '/v1/projects/import/parse',                    'Parse .inkt import file (50 MB max)'],
  ['POST',   '/v1/projects/import/finalize',                 'Finalize project import'],
  ['GET',    '/v1/projects/{id}/plugins',                    'List installed plugins'],
  ['PUT',    '/v1/projects/{id}/plugins/{pluginId}',         'Install or update plugin'],
]

const CHANNELS: Endpoint[] = [
  ['GET',    '/v1/projects/{projectId}/channels',            'List channels for project'],
  ['POST',   '/v1/projects/{projectId}/channels',            'Create channel (platform, channelName)'],
  ['PATCH',  '/v1/projects/{projectId}/channels/{id}',       'Update channel (isActive)'],
  ['DELETE', '/v1/projects/{projectId}/channels/{id}',       'Remove channel from project'],
]

const SCENES: Endpoint[] = [
  ['GET',    '/v1/projects/{projectId}/scenes',              'List scenes'],
  ['POST',   '/v1/projects/{projectId}/scenes/presign',      'Get presigned upload URL for scene background'],
  ['POST',   '/v1/projects/{projectId}/scenes/complete',     'Confirm scene upload complete'],
  ['PATCH',  '/v1/projects/{projectId}/scenes/{sceneId}',    'Update scene metadata'],
  ['PATCH',  '/v1/projects/{projectId}/scenes/{sceneId}/position', 'Reorder scene'],
  ['DELETE', '/v1/projects/{projectId}/scenes/{sceneId}',    'Delete scene'],
]

const CONNECTORS: Endpoint[] = [
  ['GET',    '/v1/connectors/discord/install-url',           'OAuth install URL for Discord bot'],
  ['GET',    '/v1/connectors/discord/callback',              'Discord OAuth callback (no auth — handled by Keycloak redirect)'],
  ['DELETE', '/v1/connectors/discord/channels/{channelId}',  'Disconnect Discord channel'],
  ['POST',   '/v1/connectors/discord/channels/{channelId}/reconnections', 'Reconnect disconnected Discord channel'],
  ['POST',   '/v1/connectors/discord/channels/{channelId}/custom-bot',    'Configure custom Discord bot token'],
  ['POST',   '/v1/connectors/discord/token-validations',     'Validate Discord bot token'],
  ['GET',    '/v1/connectors/twitch/install-url',            'OAuth install URL for Twitch'],
  ['GET',    '/v1/connectors/twitch/callback',               'Twitch OAuth callback (no auth)'],
  ['DELETE', '/v1/connectors/twitch/channels/{channelId}',   'Disconnect Twitch channel'],
  ['POST',   '/v1/connectors/twitch/channels/{channelId}/reconnections', 'Reconnect Twitch channel'],
  ['POST',   '/v1/connectors/telegram/token-validations',    'Validate Telegram bot token'],
  ['POST',   '/v1/connectors/telegram/channels',             'Register Telegram channel'],
  ['DELETE', '/v1/connectors/telegram/channels/{channelId}', 'Disconnect Telegram channel'],
  ['POST',   '/v1/connectors/inktide/messages',              'Send message to Inktide Chat channel'],
]

const TTS: Endpoint[] = [
  ['GET',    '/v1/tts/providers',                            'List speech providers (no auth required)'],
  ['GET',    '/v1/tts/voices',                               'List voices for a provider: ?provider_id= (no auth required)'],
  ['POST',   '/v1/tts/synthesize',                           'Synthesize speech (see schema below)'],
]

const STORAGE: Endpoint[] = [
  ['GET',    '/v1/storage/status',                           'Check if S3/MinIO storage is configured'],
  ['GET',    '/v1/storage/objects',                          'List user uploaded objects'],
  ['GET',    '/v1/storage/download',                         'Download object by key: ?key='],
  ['POST',   '/v1/storage/upload',                           'Upload file (50 MB max)'],
  ['DELETE', '/v1/storage/objects/{key}',                    'Delete stored object'],
]

const BILLING: Endpoint[] = [
  ['GET',    '/v1/billing/subscription',                     'Current subscription status'],
  ['POST',   '/v1/billing/checkout',                         'Create Stripe checkout session'],
  ['POST',   '/v1/billing/portal',                           'Open Stripe customer portal'],
  ['POST',   '/v1/billing/stripe/payment-intent',            'Create Stripe payment intent'],
  ['POST',   '/v1/billing/webhooks/{provider}',              'Payment provider webhook (no auth — signed by provider)'],
]

const DEVELOPER: Endpoint[] = [
  ['GET',    '/v1/developer/apps',                           'List registered OAuth applications'],
  ['POST',   '/v1/developer/apps',                           'Register OAuth application'],
  ['GET',    '/v1/developer/apps/{id}',                      'Get app credentials and settings'],
  ['PUT',    '/v1/developer/apps/{id}',                      'Update app settings'],
  ['DELETE', '/v1/developer/apps/{id}',                      'Delete application'],
  ['POST',   '/v1/developer/apps/{id}/secret-rotations',     'Rotate client secret'],
  ['GET',    '/v1/developer/apps/{id}/deliveries',           'Webhook delivery logs (paginated, max 100)'],
  ['POST',   '/v1/developer/webhooks/test',                  'Send test ping event: ?appId={guid}'],
]

const ORGANIZATION: Endpoint[] = [
  ['GET',    '/v1/organization/invites',                     'List pending organization invites'],
  ['POST',   '/v1/organization/invites',                     'Send invite to email addresses with role'],
  ['POST',   '/v1/organization/invites/{inviteId}/deliveries', 'Resend invitation email'],
  ['DELETE', '/v1/organization/invites/{inviteId}',          'Cancel invitation'],
  ['POST',   '/v1/organization/invites/accept',              'Accept invite with token'],
]

const MARKETPLACE: Endpoint[] = [
  ['GET',    '/v1/marketplace/connectors',                   'List connector plugins (no auth required)'],
  ['GET',    '/v1/marketplace/connectors/{slug}',            'Get connector plugin details (no auth required)'],
  ['GET',    '/v1/marketplace/souls/{soulId}/installs',      'List installed connectors for soul'],
  ['POST',   '/v1/marketplace/souls/{soulId}/installs',      'Install connector on soul'],
  ['DELETE', '/v1/marketplace/installs/{installationId}',    'Uninstall connector'],
]

const CHAT: Endpoint[] = [
  ['GET',    '/v1/chat/providers',                           'Chat provider catalog (no auth required)'],
  ['GET',    '/v1/chat/models',                              'Live model list from provider: ?provider_id=&base_url= (header: X-Api-Key)'],
  ['POST',   '/v1/demo/chat',                                'Demo chat (no auth required)'],
]

const PUBLIC_PROJECT: Endpoint[] = [
  ['GET',    '/public/projects/{id}/scene-config',           'Read-only scene config (no auth required — for OBS overlay)'],
]

const REALTIME: Endpoint[] = [
  ['POST',   '/auth/ws-ticket',                              'Get a single-use WebSocket ticket (30 s TTL) — Next.js route, not proxied to .NET. See Real-time page.'],
]

function EndpointTable({ endpoints }: { endpoints: Endpoint[] }) {
  return (
    <div className="mb-8">
      <Table>
        <TableHead cols={['Method', 'Path', 'Description']} />
        <tbody>
          {endpoints.map(([method, path, desc]) => (
            <TableRow key={method + path}>
              <td className="w-24 px-4 py-3"><MethodBadge method={method} /></td>
              <Td mono accent>{path}</Td>
              <Td>{desc}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function ApiPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Reference">REST API</PageTitle>
      <PageSubtitle>
        Base URL: <InlineCode>http://127.0.0.1:5001/api</InlineCode> — proxied from the frontend via <InlineCode>/api</InlineCode>.
        All endpoints require a Bearer token unless noted as <em>no auth required</em>.
      </PageSubtitle>

      <SectionHeading>Authentication</SectionHeading>
      <CodeBlock label="http">
{`Authorization: Bearer <access_token>`}
      </CodeBlock>
      <InfoBox variant="tip">
        When calling from the Next.js frontend, you don&apos;t attach the token manually.
        All <InlineCode>/api/*</InlineCode> requests are intercepted by the BFF proxy
        (<InlineCode>app/api/[...path]/route.ts</InlineCode>), which reads the session
        server-side and injects the <InlineCode>Authorization</InlineCode> header.
        Direct API clients (external apps, scripts) must supply the Bearer token from
        the OAuth token exchange — see the <a href="/developer/oauth" className="underline text-[var(--accent-primary)]">OAuth 2.0</a> page.
      </InfoBox>

      <SectionHeading>Profile</SectionHeading>
      <EndpointTable endpoints={PROFILE} />

      <SectionHeading>Souls (AI Cards)</SectionHeading>
      <EndpointTable endpoints={SOULS} />

      <SectionHeading>Projects</SectionHeading>
      <EndpointTable endpoints={PROJECTS} />

      <SubHeading>Project channels</SubHeading>
      <EndpointTable endpoints={CHANNELS} />

      <SubHeading>Project scenes</SubHeading>
      <EndpointTable endpoints={SCENES} />

      <SectionHeading>Connectors</SectionHeading>
      <InfoBox>
        Connector OAuth callbacks (<InlineCode>/callback</InlineCode>) are redirect endpoints
        that complete the platform OAuth flow. They are called by Discord/Twitch, not by
        your application directly.
      </InfoBox>
      <EndpointTable endpoints={CONNECTORS} />

      <SectionHeading>TTS</SectionHeading>
      <EndpointTable endpoints={TTS} />

      <SectionHeading>TTS Synthesize — full schema</SectionHeading>
      <CodeBlock label="POST /api/v1/tts/synthesize">
{`// Request body (JSON)
{
  "text":         string,             // required — text to synthesize
  "voice_id":     string,             // required — provider-specific voice ID
  "model_id":     string | null,      // optional — TTS model override
  "speed":        number | null,      // optional — 0.5–2.0, default 1.0
  "provider_id":  string | null,      // optional — override default TTS provider
  "audio_format": "mp3"|"wav"|"pcm", // optional — default: mp3
  "stream":       boolean             // optional — true for streaming chunked response
}

// Optional header (when provider requires an API key)
X-TTS-Api-Key: <provider_api_key>

// Response: audio/mpeg  |  audio/wav  |  audio/pcm
// Streaming: Transfer-Encoding: chunked`}
      </CodeBlock>

      <SectionHeading>Storage</SectionHeading>
      <EndpointTable endpoints={STORAGE} />

      <SectionHeading>Billing</SectionHeading>
      <EndpointTable endpoints={BILLING} />

      <SectionHeading>Developer Apps</SectionHeading>
      <EndpointTable endpoints={DEVELOPER} />

      <SectionHeading>Organization</SectionHeading>
      <EndpointTable endpoints={ORGANIZATION} />

      <SectionHeading>Marketplace</SectionHeading>
      <EndpointTable endpoints={MARKETPLACE} />

      <SectionHeading>Chat Providers</SectionHeading>
      <EndpointTable endpoints={CHAT} />

      <SectionHeading>Public Endpoints</SectionHeading>
      <EndpointTable endpoints={PUBLIC_PROJECT} />

      <SectionHeading>Real-time (WebSocket ticket)</SectionHeading>
      <InfoBox variant="tip">
        This is a Next.js route (<InlineCode>/api/auth/ws-ticket</InlineCode>), not a .NET endpoint.
        It does not use the <InlineCode>/v1/</InlineCode> prefix.
        The full base URL is the frontend URL, not <InlineCode>http://127.0.0.1:5001</InlineCode>.
        See the <a href="/developer/realtime" className="underline text-[var(--accent-primary)]">Real-time</a> page for the full SignalR connection guide.
      </InfoBox>
      <EndpointTable endpoints={REALTIME} />

      <SectionHeading>Error responses</SectionHeading>
      <Table>
        <TableHead cols={['Status', 'Meaning']} />
        <tbody>
          {[
            ['400', 'Bad Request — validation failed, check request body'],
            ['401', 'Unauthorized — missing or expired Bearer token'],
            ['402', 'Payment Required — plan limit exceeded (e.g. soul count)'],
            ['403', 'Forbidden — token valid but insufficient permissions'],
            ['404', 'Not Found — resource does not exist'],
            ['429', 'Too Many Requests — rate limit exceeded'],
            ['500', 'Internal Server Error — check API logs'],
          ].map(([status, meaning]) => (
            <TableRow key={status}>
              <Td mono accent>{status}</Td>
              <Td>{meaning}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <div className="mt-6">
        <InfoBox>
          The Next.js dev server proxies <InlineCode>/api/*</InlineCode> → <InlineCode>http://127.0.0.1:5001/api/*</InlineCode> and{' '}
          <InlineCode>/hubs/*</InlineCode> → SignalR. In production, configure your reverse proxy accordingly.
        </InfoBox>
      </div>
    </DocPage>
  )
}
