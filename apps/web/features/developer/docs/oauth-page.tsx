import { CodeBlock, DocPage, InlineCode, PageSubtitle, PageTitle, SectionHeading, TableRow, Td } from './shared'

export function OAuthPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Auth">OAuth 2.0</PageTitle>
      <PageSubtitle>
        Inktide uses Keycloak as the identity provider. Third-party apps authenticate users
        via the standard Authorization Code flow with PKCE.
      </PageSubtitle>

      <SectionHeading>Flow Overview</SectionHeading>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['1', 'Register App',   "Go to Developer → Create App. You'll receive a client_id and client_secret."],
          ['2', 'Authorize User', 'Redirect the user to the Keycloak authorization URL with PKCE challenge.'],
          ['3', 'Exchange Code',  'POST the authorization code to the token endpoint to receive access + refresh tokens.'],
        ].map(([step, title, desc]) => (
          <div key={step} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
            <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-primary)]">
              {step}
            </span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{desc}</p>
          </div>
        ))}
      </div>

      <SectionHeading>Authorization URL</SectionHeading>
      <CodeBlock label="GET — redirect the user here">
{`{keycloak_base_url}/realms/inktide-app/protocol/openid-connect/auth
  ?client_id=<your_client_id>
  &redirect_uri=<your_redirect_uri>           # must match registered URIs
  &response_type=code
  &scope=openid
  &code_challenge=<pkce_s256_challenge>
  &code_challenge_method=S256
  &state=<random_opaque_value>`}
      </CodeBlock>

      <SectionHeading>Token Exchange</SectionHeading>
      <CodeBlock label="POST — exchange code for tokens">
{`POST {keycloak_base_url}/realms/inktide-app/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=<your_client_id>
&client_secret=<your_client_secret>
&code=<authorization_code>
&redirect_uri=<your_redirect_uri>
&code_verifier=<pkce_verifier>`}
      </CodeBlock>

      <CodeBlock label="Response">
{`{
  "access_token":  "eyJ...",       // use as Bearer token for API calls
  "refresh_token": "eyJ...",       // use to obtain new access tokens
  "expires_in":    300,            // seconds until access_token expires
  "token_type":    "Bearer"
}`}
      </CodeBlock>

      <SectionHeading>Token Refresh</SectionHeading>
      <CodeBlock label="POST — refresh the access token">
{`POST {keycloak_base_url}/realms/inktide-app/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=<your_client_id>
&client_secret=<your_client_secret>
&refresh_token=<your_refresh_token>`}
      </CodeBlock>

      <SectionHeading>Available Scopes</SectionHeading>
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {[
              ['channelsRead',    'Read the list of connected channels for a soul'],
              ['channelsWrite',   'Connect and disconnect platform channels'],
              ['messagesReceive', 'Receive real-time message notifications via webhook'],
              ['soulRead',        'Read public soul card info (name, avatar, description)'],
            ].map(([scope, desc]) => (
              <TableRow key={scope}>
                <Td mono accent>{scope}</Td>
                <Td>{desc}</Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4 text-sm text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Keycloak base URL (local): </span>
        <InlineCode>http://localhost:8080</InlineCode>
        {' '}— realm: <InlineCode>inktide-app</InlineCode>
      </div>
    </DocPage>
  )
}
