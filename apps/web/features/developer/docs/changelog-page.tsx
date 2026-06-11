import { CodeBlock, DocPage, InfoBox, InlineCode, PageSubtitle, PageTitle, SectionHeading, SubHeading, Table, TableHead, TableRow, Td } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function ChangelogPage() {
  const t = await getTranslations('developer')
  const docStatuses: [string, string][] = [
    ['docs/SYNAPSE_ARCHITECTURE_RETHINK.md',    t('docs.changelog.docStatus1')],
    ['docs/SYNAPSE_FULL_ARCHITECTURE.md',       t('docs.changelog.docStatus2')],
    ['docs/SYNAPSE_PRODUCTION_ARCHITECTURE.md', t('docs.changelog.docStatus3')],
    ['apps/web/STRUCTURE.md',                   t('docs.changelog.docStatus4')],
  ]
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.changelog.eyebrow')}>{t('docs.changelog.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.changelog.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.changelog.authSection')}</SectionHeading>
      <InfoBox variant="warning" title={t('docs.changelog.labelBreaking')}>
        {t('docs.changelog.authBox1')}{' '}<InlineCode>keycloak-js</InlineCode>{' '}{t('docs.changelog.authBox2')}{' '}<InlineCode>localStorage</InlineCode>{' '}{t('docs.changelog.authBox3')}{' '}
        <InlineCode>inktide_kc_token</InlineCode>{' '}{t('docs.changelog.authBox4')}{' '}<InlineCode>inktide_kc_refresh</InlineCode>{' '}{t('docs.changelog.authBox5')}
      </InfoBox>

      <SubHeading>{t('docs.changelog.before')}</SubHeading>
      <CodeBlock label={t('docs.changelog.labelDeprecatedCode')}>
{`// ❌ Old pattern — tokens exposed to browser JS
import Keycloak from 'keycloak-js'
const kc = new Keycloak({ url, realm, clientId })
await kc.init({ onLoad: 'check-sso', token: localStorage.getItem('inktide_kc_token') })
const token = kc.token  // access token in memory / localStorage`}
      </CodeBlock>

      <SubHeading>{t('docs.changelog.after')}</SubHeading>
      <CodeBlock label="typescript">
{`// ✅ New pattern — tokens never reach the browser
// Server Component: read session directly
import { auth } from '@/lib/auth'
const session = await auth()
const userId = session?.user?.id

// Client Component: call /api/* as usual — BFF proxy injects Bearer automatically
const res = await fetch('/api/v1/me')  // no token needed in browser
const user = await res.json()`}
      </CodeBlock>

      <InfoBox>
        <strong>{t('docs.changelog.whyLabel')}</strong> {t('docs.changelog.whyText')}
      </InfoBox>

      <SectionHeading>{t('docs.changelog.versioningSection')}</SectionHeading>
      <InfoBox variant="warning" title={t('docs.changelog.labelBreaking')}>
        {t('docs.changelog.versioningBox1')}{' '}<InlineCode>/v1/</InlineCode>{' '}{t('docs.changelog.versioningBox2')}{' '}<strong>404</strong>{t('docs.changelog.versioningBox3')}
      </InfoBox>

      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.changelog.colOld'), t('docs.changelog.colCorrect')]} />
          <tbody>
            {[
              ['/api/me',              '/api/v1/me'],
              ['/api/souls',           '/api/v1/souls/cards'],
              ['/api/souls/{id}',      '/api/v1/souls/cards/{cardId}'],
              ['/api/projects',        '/api/v1/projects'],
              ['/api/projects/{id}',   '/api/v1/projects/{id}'],
              ['/api/tts/synthesize',  '/api/v1/tts/synthesize'],
              ['/api/developer/apps',  '/api/v1/developer/apps'],
            ].map(([old, correct]) => (
              <TableRow key={old}>
                <Td mono><span className="text-red-400 line-through">{old}</span></Td>
                <Td mono accent>{correct}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>{t('docs.changelog.scopeSection')}</SectionHeading>
      <InfoBox variant="warning" title={t('docs.changelog.labelCorrection')}>
        {t('docs.changelog.scopeBox1')}{' '}<InlineCode>OAuthScope.cs</InlineCode>{t('docs.changelog.scopeBox2')}
      </InfoBox>

      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.changelog.colOld'), t('docs.changelog.colCorrect')]} />
          <tbody>
            {[
              ['channelsRead',    'channels:read'],
              ['channelsWrite',   'channels:write'],
              ['messagesReceive', 'messages:receive'],
              ['soulRead',        'soul:read'],
            ].map(([old, correct]) => (
              <TableRow key={old}>
                <Td mono><span className="text-red-400 line-through">{old}</span></Td>
                <Td mono accent>{correct}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>{t('docs.changelog.retrySection')}</SectionHeading>
      <InfoBox variant="warning" title={t('docs.changelog.labelCorrection')}>
        {t('docs.changelog.retryBox1')}{' '}<InlineCode>WebhookDeliveryWorker</InlineCode>{' '}{t('docs.changelog.retryBox2')}{' '}<strong>{t('docs.changelog.retryAttempts')}</strong>{' '}{t('docs.changelog.retryBox3')}
      </InfoBox>

      <CodeBlock label={t('docs.changelog.labelRetrySchedule')}>
{`Attempt 1 — immediate
Attempt 2 — 1 second delay
Attempt 3 — 5 seconds delay
Attempt 4 — 30 seconds delay
Attempt 5 — 5 minutes delay
After attempt 5 fails — 30 minute delay, then the event is dead-lettered`}
      </CodeBlock>

      <SectionHeading>{t('docs.changelog.synapseSection')}</SectionHeading>
      <InfoBox variant="warning" title={t('docs.changelog.labelDeprecated')}>
        <InlineCode>docs/SYNAPSE_PRODUCTION_ARCHITECTURE.md</InlineCode>{' '}{t('docs.changelog.synapseBox1')}{' '}<strong>{t('docs.changelog.synapseBox2')}</strong>{t('docs.changelog.synapseBox3')}{' '}<strong>{t('docs.changelog.synapseBox4')}</strong>{' '}{t('docs.changelog.synapseBox5')}{' '}<InlineCode>docs/SYNAPSE_ARCHITECTURE_RETHINK.md</InlineCode>{' '}{t('docs.changelog.synapseBox6')}
      </InfoBox>

      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.changelog.colDocument'), t('docs.changelog.colStatus')]} />
          <tbody>
            {docStatuses.map(([doc, status]) => (
              <TableRow key={doc}>
                <Td mono accent>{doc}</Td>
                <Td>{status}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </DocPage>
  )
}
