import { CodeBlock, DocPage, InfoBox, InlineCode, PageSubtitle, PageTitle, SectionHeading, Table, TableHead, TableRow, Td } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function WebhooksPage() {
  const t = await getTranslations('developer')
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.webhooks.eyebrow')}>{t('docs.webhooks.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.webhooks.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.webhooks.setup')}</SectionHeading>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['1', t('docs.webhooks.step1Title'), t('docs.webhooks.step1Desc')],
          ['2', t('docs.webhooks.step2Title'), t('docs.webhooks.step2Desc')],
          ['3', t('docs.webhooks.step3Title'), t('docs.webhooks.step3Desc')],
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

      <SectionHeading>{t('docs.webhooks.eventTypes')}</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.webhooks.colEvent'), t('docs.webhooks.colDescription')]} />
          <tbody>
            {[
              ['soul.message',        'docs.webhooks.evMessage'],
              ['soul.response',       'docs.webhooks.evResponse'],
              ['channel.connected',   'docs.webhooks.evConnected'],
              ['channel.disconnected','docs.webhooks.evDisconnected'],
              ['tts.complete',        'docs.webhooks.evTtsComplete'],
            ].map(([event, descKey]) => (
              <TableRow key={event}>
                <Td mono accent>{event}</Td>
                <Td>{t(descKey)}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>{t('docs.webhooks.examplePayload')}</SectionHeading>
      <CodeBlock label="POST https://your-server.com/webhook">
{`Content-Type: application/json
X-Inktide-Signature: sha256=<hmac_hex>
X-Inktide-Event: soul.message
X-Inktide-Delivery: <uuid>

{
  "id":        "<uuid>",
  "event":     "soul.message",
  "timestamp": "2025-06-01T12:34:56Z",
  "data": {
    "channel":    "twitch",
    "author":     "viewer_username",
    "text":       "Hello streamer!",
    "message_id": "msg_xyz"
  }
}`}
      </CodeBlock>

      <SectionHeading>{t('docs.webhooks.signatureVerification')}</SectionHeading>
      <CodeBlock label={t('docs.webhooks.labelNodeExample')}>
{`import crypto from 'crypto'

function verifySignature(body: string, secret: string, header: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(header)
  )
}`}
      </CodeBlock>

      <InfoBox>
        <span className="font-semibold text-[var(--text-primary)]">{t('docs.webhooks.importantLabel')}</span>
        {t('docs.webhooks.info1')}{' '}<InlineCode>timingSafeEqual</InlineCode>{' '}{t('docs.webhooks.info2')}<InlineCode>===</InlineCode>{t('docs.webhooks.info3')}{' '}<InlineCode>X-Inktide-Delivery</InlineCode>{' '}{t('docs.webhooks.info4')}{' '}<InlineCode>POST /api/v1/developer/webhooks/test?appId={'{appId}'}</InlineCode>.
      </InfoBox>
    </DocPage>
  )
}
