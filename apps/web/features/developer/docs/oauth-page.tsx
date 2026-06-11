import { CodeBlock, DocPage, InlineCode, PageSubtitle, PageTitle, SectionHeading, TableRow, Td } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function OAuthPage() {
  const t = await getTranslations('developer')
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.oauth.eyebrow')}>{t('docs.oauth.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.oauth.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.oauth.flowOverview')}</SectionHeading>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['1', t('docs.oauth.step1Title'), t('docs.oauth.step1Desc')],
          ['2', t('docs.oauth.step2Title'), t('docs.oauth.step2Desc')],
          ['3', t('docs.oauth.step3Title'), t('docs.oauth.step3Desc')],
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

      <SectionHeading>{t('docs.oauth.authUrl')}</SectionHeading>
      <CodeBlock label={t('docs.oauth.labelAuthUrl')}>
{`{keycloak_base_url}/realms/inktide-app/protocol/openid-connect/auth
  ?client_id=<your_client_id>
  &redirect_uri=<your_redirect_uri>           # must match registered URIs
  &response_type=code
  &scope=openid
  &code_challenge=<pkce_s256_challenge>
  &code_challenge_method=S256
  &state=<random_opaque_value>`}
      </CodeBlock>

      <SectionHeading>{t('docs.oauth.tokenExchange')}</SectionHeading>
      <CodeBlock label={t('docs.oauth.labelTokenExchange')}>
{`POST {keycloak_base_url}/realms/inktide-app/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=<your_client_id>
&client_secret=<your_client_secret>
&code=<authorization_code>
&redirect_uri=<your_redirect_uri>
&code_verifier=<pkce_verifier>`}
      </CodeBlock>

      <CodeBlock label={t('docs.oauth.labelResponse')}>
{`{
  "access_token":  "eyJ...",       // use as Bearer token for API calls
  "refresh_token": "eyJ...",       // use to obtain new access tokens
  "expires_in":    300,            // seconds until access_token expires
  "token_type":    "Bearer"
}`}
      </CodeBlock>

      <SectionHeading>{t('docs.oauth.tokenRefresh')}</SectionHeading>
      <CodeBlock label={t('docs.oauth.labelTokenRefresh')}>
{`POST {keycloak_base_url}/realms/inktide-app/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=<your_client_id>
&client_secret=<your_client_secret>
&refresh_token=<your_refresh_token>`}
      </CodeBlock>

      <SectionHeading>{t('docs.oauth.availableScopes')}</SectionHeading>
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {[
              ['channels:read',    'docs.oauth.scopeChannelsRead'],
              ['channels:write',   'docs.oauth.scopeChannelsWrite'],
              ['messages:receive', 'docs.oauth.scopeMessagesReceive'],
              ['soul:read',        'docs.oauth.scopeSoulRead'],
            ].map(([scope, descKey]) => (
              <TableRow key={scope}>
                <Td mono accent>{scope}</Td>
                <Td>{t(descKey)}</Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4 text-sm text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">{t('docs.oauth.baseUrlLabel')}</span>
        <InlineCode>http://localhost:8080</InlineCode>
        {' '}{t('docs.oauth.realmLabel')} <InlineCode>inktide-app</InlineCode>
      </div>
    </DocPage>
  )
}
