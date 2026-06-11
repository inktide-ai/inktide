import { CodeBlock, DocPage, InfoBox, InlineCode, PageSubtitle, PageTitle, SectionHeading, Step, SubHeading, Table, TableHead, TableRow, Td } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function RealtimePage() {
  const t = await getTranslations('developer')
  const hubMethods: [string, string, string][] = [
    ['JoinChannel',  'channelId: string', t('docs.realtime.mJoin')],
    ['LeaveChannel', 'channelId: string', t('docs.realtime.mLeave')],
  ]
  const latency: [string, string][] = [
    [t('docs.realtime.lat1Stage'), '500–1300 ms'],
    [t('docs.realtime.lat2Stage'), t('docs.realtime.lat2Val')],
    [t('docs.realtime.lat3Stage'), t('docs.realtime.lat3Val')],
  ]
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.realtime.eyebrow')}>{t('docs.realtime.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.realtime.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.realtime.howItWorks')}</SectionHeading>
      <InfoBox variant="tip">
        {t('docs.realtime.tip1')}{' '}<InlineCode>Authorization</InlineCode>{' '}{t('docs.realtime.tip2')}
      </InfoBox>

      <div className="mb-10">
        <Step n={1} title={t('docs.realtime.step1Title')} desc={t('docs.realtime.step1Desc')}>
          <CodeBlock label="typescript">
{`const res = await fetch('/api/auth/ws-ticket', {
  method: 'POST',
  // No body needed — the BFF proxy reads the session and issues the ticket
})
const { ticket } = await res.json()
// ticket expires in 30 seconds and can only be used once`}
          </CodeBlock>
        </Step>

        <Step n={2} title={t('docs.realtime.step2Title')} desc={t('docs.realtime.step2Desc')}>
          <CodeBlock label="typescript">
{`import * as signalR from '@microsoft/signalr'

const connection = new signalR.HubConnectionBuilder()
  .withUrl(\`/hubs/audio?access_token=\${ticket}\`)
  .withAutomaticReconnect()
  .build()

await connection.start()`}
          </CodeBlock>
          <InfoBox>
            {t('docs.realtime.install1')}{' '}<InlineCode>npm install @microsoft/signalr</InlineCode>{t('docs.realtime.install2')}{' '}<InlineCode>/hubs/*</InlineCode> → <InlineCode>http://127.0.0.1:5001/hubs/*</InlineCode>.
          </InfoBox>
        </Step>

        <Step n={3} title={t('docs.realtime.step3Title')} desc={t('docs.realtime.step3Desc')}>
          <CodeBlock label="typescript">
{`await connection.invoke('JoinChannel', channelId)
// channelId: string — the channel ID from your project configuration

// To stop receiving events:
await connection.invoke('LeaveChannel', channelId)`}
          </CodeBlock>
        </Step>

        <Step n={4} title={t('docs.realtime.step4Title')} desc={t('docs.realtime.step4Desc')}>
          <CodeBlock label="typescript">
{`connection.on('audioReceived', (event: AudioReceivedEvent) => {
  // Decode audio and play it
  const bytes = Uint8Array.from(atob(event.audioBase64), c => c.charCodeAt(0))
  const blob  = new Blob([bytes], { type: event.contentType })
  const url   = URL.createObjectURL(blob)

  const audio = new Audio(url)
  audio.play()

  // Optional: drive lipsync with viseme timeline
  if (event.visemeTimeline) {
    scheduleVisemes(event.visemeTimeline)
  }
})`}
          </CodeBlock>
        </Step>
      </div>

      <SectionHeading>{t('docs.realtime.hubMethods')}</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.realtime.colMethod'), t('docs.realtime.colParameter'), t('docs.realtime.colDescription')]} />
          <tbody>
            {hubMethods.map(([method, param, desc]) => (
              <TableRow key={method}>
                <Td mono accent>{method}</Td>
                <Td mono>{param}</Td>
                <Td>{desc}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <SectionHeading>{t('docs.realtime.audioReceivedEvent')}</SectionHeading>
      <SubHeading>{t('docs.realtime.tsInterface')}</SubHeading>
      <CodeBlock label="typescript">
{`interface AudioReceivedEvent {
  correlationId:    string        // trace ID — ties audio to the original message
  audioBase64:      string        // base64-encoded audio bytes
  contentType:      string        // MIME type, e.g. "audio/mpeg"
  visemeTimeline:   unknown|null  // Rhubarb viseme data for lipsync (null if not enabled)
  emotion:          string|null   // emotion label, e.g. "happy", "neutral"
  emotionIntensity: number        // 0–1 intensity of the current emotion
  vad: {
    v: number   // valence   (-1 to 1: negative to positive)
    a: number   // arousal   (0 to 1: calm to excited)
    d: number   // dominance (0 to 1: submissive to dominant)
  }
  physical: {
    energy:    number  // 0–1 physical energy level
    attention: number  // 0–1 attentiveness
    comfort:   number  // 0–1 comfort level
  }
}`}
      </CodeBlock>

      <SectionHeading>{t('docs.realtime.completeExample')}</SectionHeading>
      <CodeBlock label="typescript">
{`import * as signalR from '@microsoft/signalr'

async function connectToSoul(channelId: string) {
  // 1. Get a single-use ticket
  const { ticket } = await fetch('/api/auth/ws-ticket', {
    method: 'POST',
  }).then(r => r.json())

  // 2. Build connection
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(\`/hubs/audio?access_token=\${ticket}\`)
    .withAutomaticReconnect({
      // Re-fetch a fresh ticket on reconnect
      nextRetryDelayInMilliseconds: () => 2000,
    })
    .build()

  // 3. Subscribe to audio events
  connection.on('audioReceived', async (event) => {
    const bytes = Uint8Array.from(atob(event.audioBase64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: event.contentType })
    const audio = new Audio(URL.createObjectURL(blob))
    await audio.play()
  })

  // 4. Handle reconnect — ticket is single-use, must refresh before reconnect
  connection.onreconnecting(() => console.log('Reconnecting…'))
  connection.onreconnected(() => connection.invoke('JoinChannel', channelId))

  // 5. Start and join
  await connection.start()
  await connection.invoke('JoinChannel', channelId)

  return connection
}

// Disconnect cleanly
async function disconnect(connection: signalR.HubConnection, channelId: string) {
  await connection.invoke('LeaveChannel', channelId)
  await connection.stop()
}`}
      </CodeBlock>

      <InfoBox variant="warning">
        {t('docs.realtime.warn1')}{' '}<InlineCode>withAutomaticReconnect</InlineCode>{t('docs.realtime.warn2')}{' '}<InlineCode>onreconnecting</InlineCode>{' '}{t('docs.realtime.warn3')}
      </InfoBox>

      <SectionHeading>{t('docs.realtime.latencyChars')}</SectionHeading>
      <div className="mb-8">
        <Table>
          <TableHead cols={[t('docs.realtime.colStage'), t('docs.realtime.colLatency')]} />
          <tbody>
            {latency.map(([stage, lat]) => (
              <TableRow key={stage}>
                <Td>{stage}</Td>
                <Td mono accent>{lat}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </DocPage>
  )
}
