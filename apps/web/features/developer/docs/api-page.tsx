import { CodeBlock, DocPage, InfoBox, InlineCode, MethodBadge, PageSubtitle, PageTitle, SectionHeading, Table, TableHead, TableRow, Td } from './shared'

const ENDPOINTS: [string, string, string][] = [
  ['GET',    '/me',                          'Current authenticated user (profile + roles)'],
  ['GET',    '/souls',                       'List AI souls for the current user'],
  ['POST',   '/souls',                       'Create a new AI soul'],
  ['GET',    '/souls/{id}',                  'Get soul details'],
  ['PUT',    '/souls/{id}',                  'Update soul configuration'],
  ['DELETE', '/souls/{id}',                  'Delete soul'],
  ['POST',   '/souls/{id}/reorder',          'Reorder soul in the list'],
  ['GET',    '/projects',                    'List workspace projects'],
  ['POST',   '/projects',                    'Create a new project'],
  ['GET',    '/projects/{id}',               'Get project details'],
  ['PUT',    '/projects/{id}',               'Update project'],
  ['DELETE', '/projects/{id}',               'Delete project'],
  ['POST',   '/tts/synthesize',              'Synthesize speech (see schema below)'],
  ['GET',    '/developer/apps',              'List registered OAuth applications'],
  ['POST',   '/developer/apps',              'Register a new OAuth application'],
  ['GET',    '/developer/apps/{id}',         'Get app credentials and settings'],
  ['PUT',    '/developer/apps/{id}',         'Update app settings'],
  ['DELETE', '/developer/apps/{id}',         'Delete application'],
  ['POST',   '/developer/apps/{id}/rotate',  'Rotate client secret'],
  ['GET',    '/developer/apps/{id}/deliveries', 'List webhook delivery logs'],
  ['POST',   '/developer/apps/{id}/test-webhook', 'Send a test webhook event'],
  ['GET',    '/organizations',               'List user organizations'],
  ['POST',   '/organizations/invites',       'Send organization invite by email'],
]

export function ApiPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Reference">REST API</PageTitle>
      <PageSubtitle>
        Base URL: <InlineCode>http://127.0.0.1:5001/api</InlineCode> — proxied from the frontend via <InlineCode>/api</InlineCode>.
        All endpoints require a Bearer token unless noted.
      </PageSubtitle>

      <SectionHeading>Authentication</SectionHeading>
      <CodeBlock label="http">
{`Authorization: Bearer <keycloak_access_token>`}
      </CodeBlock>

      <SectionHeading>Endpoints</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={['Method', 'Path', 'Description']} />
          <tbody>
            {ENDPOINTS.map(([method, path, desc]) => (
              <TableRow key={method + path}>
                <td className="w-24 px-4 py-3"><MethodBadge method={method} /></td>
                <Td mono accent>{path}</Td>
                <Td>{desc}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>TTS Synthesize — full schema</SectionHeading>
      <CodeBlock label="POST /api/tts/synthesize">
{`// Request body (JSON)
{
  "text":         string,              // required — text to synthesize
  "voice_id":     string,              // required — provider-specific voice ID
  "model_id":     string | null,       // optional — TTS model override
  "speed":        number | null,       // optional — 0.5–2.0, default 1.0
  "provider_id":  string | null,       // optional — override default TTS provider
  "audio_format": "mp3"|"wav"|"pcm",  // optional — default: mp3
  "stream":       boolean              // optional — true for streaming chunked response
}

// Optional header (when provider requires an API key)
X-TTS-Api-Key: <provider_api_key>

// Response: audio/mpeg  |  audio/wav  |  audio/pcm
// Streaming: Transfer-Encoding: chunked`}
      </CodeBlock>

      <SectionHeading>Error responses</SectionHeading>
      <Table>
        <TableHead cols={['Status', 'Meaning']} />
        <tbody>
          {[
            ['400', 'Bad Request — validation failed, check request body'],
            ['401', 'Unauthorized — missing or expired Bearer token'],
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
          <span className="font-semibold text-[var(--text-primary)]">Note: </span>
          The Next.js dev server proxies <InlineCode>/api/*</InlineCode> → <InlineCode>http://127.0.0.1:5001/api/*</InlineCode> and <InlineCode>/hubs/*</InlineCode> → SignalR. In production, configure your reverse proxy accordingly.
        </InfoBox>
      </div>
    </DocPage>
  )
}
