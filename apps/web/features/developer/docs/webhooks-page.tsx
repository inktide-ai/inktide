import { CodeBlock, DocPage, InfoBox, InlineCode, PageSubtitle, PageTitle, SectionHeading, Table, TableHead, TableRow, Td } from './shared'

export function WebhooksPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Integrations">Webhooks</PageTitle>
      <PageSubtitle>
        Register a webhook URL in your app settings. Inktide POSTs a signed JSON payload
        to your endpoint on each event. Verify the signature before processing.
      </PageSubtitle>

      <SectionHeading>Setup</SectionHeading>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['1', 'Create App',      'Register an OAuth app at Developer → Create App and set a webhook URL + secret.'],
          ['2', 'Receive Events',  'Inktide POSTs JSON to your URL. Return HTTP 200 within 10 seconds.'],
          ['3', 'Verify Signature','Check X-Inktide-Signature on each request to confirm authenticity.'],
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

      <SectionHeading>Event Types</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={['Event', 'Description']} />
          <tbody>
            {[
              ['soul.message',        'A message was received and processed by a soul'],
              ['soul.response',       'The soul generated a response (text + audio ready)'],
              ['channel.connected',   'A platform channel was linked to a soul'],
              ['channel.disconnected','A platform channel was unlinked from a soul'],
              ['tts.complete',        'TTS synthesis finished; audio URL available in payload'],
            ].map(([event, desc]) => (
              <TableRow key={event}>
                <Td mono accent>{event}</Td>
                <Td>{desc}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>Example Payload</SectionHeading>
      <CodeBlock label="POST https://your-server.com/webhook">
{`Content-Type: application/json
X-Inktide-Signature: sha256=<hmac_hex>
X-Inktide-Event: soul.message
X-Inktide-Delivery: <uuid>

{
  "event":     "soul.message",
  "timestamp": "2025-06-01T12:34:56Z",
  "soul_id":   "abc123",
  "data": {
    "channel":    "twitch",
    "author":     "viewer_username",
    "text":       "Hello streamer!",
    "message_id": "msg_xyz"
  }
}`}
      </CodeBlock>

      <SectionHeading>Signature Verification</SectionHeading>
      <CodeBlock label="Node.js example">
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
        <span className="font-semibold text-[var(--text-primary)]">Important: </span>
        Always use <InlineCode>timingSafeEqual</InlineCode> (or equivalent) when comparing signatures.
        String equality (<InlineCode>===</InlineCode>) is vulnerable to timing attacks.
        Inktide retries failed deliveries up to 3 times with exponential backoff.
        Use <InlineCode>X-Inktide-Delivery</InlineCode> for idempotency.
      </InfoBox>
    </DocPage>
  )
}
