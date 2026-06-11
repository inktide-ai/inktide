import { CodeBlock, DocPage, InfoBox, PageSubtitle, PageTitle, SectionDivider, SectionHeading, Step } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function QuickStartPage() {
  const t = await getTranslations('developer')
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.quickstart.eyebrow')}>{t('docs.quickstart.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.quickstart.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.quickstart.setup')}</SectionHeading>

      <Step n={1} title={t('docs.quickstart.step1Title')} desc={t('docs.quickstart.step1Desc')}>
        <CodeBlock label="docker">
{`docker compose up -d`}
        </CodeBlock>
      </Step>

      <Step n={2} title={t('docs.quickstart.step2Title')} desc={t('docs.quickstart.step2Desc')}>
        <CodeBlock label=".env (root)">
{`Keycloak__Authority=http://localhost:8080/realms/inktide-app
Database__ConnectionString=Host=localhost;Database=inktide;Username=...;Password=...
CHANGE_ME__AUTH_SIGNING_SECRET_MIN_32_CHARS=your-32-char-secret-here
CHANGE_ME__KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
CHANGE_ME__KEYCLOAK_ADMIN_CLIENT_SECRET=...`}
        </CodeBlock>
      </Step>

      <Step n={3} title={t('docs.quickstart.step3Title')} desc={t('docs.quickstart.step3Desc')}>
        <CodeBlock label="bash">
{`dotnet build Inktide.API.sln
dotnet run --project src/Inktide.API
# HTTP API →  http://127.0.0.1:5001
# gRPC     →  http://127.0.0.1:8081
# Soul gRPC→  http://127.0.0.1:8084`}
        </CodeBlock>
      </Step>

      <Step n={4} title={t('docs.quickstart.step4Title')} desc={t('docs.quickstart.step4Desc')}>
        <CodeBlock label="bash">
{`cd apps/web
npm install
npm run dev
# App →  http://localhost:3000`}
        </CodeBlock>
      </Step>

      <Step n={5} title={t('docs.quickstart.step5Title')} desc={t('docs.quickstart.step5Desc')}>
        <CodeBlock label="bash">
{`# Embeddings + classification (port 8000)
cd fast-api/ai-worker && pip install -r requirements.txt
uvicorn main:app --port 8000

# Scribe fact-extraction (port 8001)
cd fast-api/ai-worker/scribe
uvicorn main:app --port 8001`}
        </CodeBlock>
      </Step>

      <SectionDivider />
      <SectionHeading>{t('docs.quickstart.runTests')}</SectionHeading>

      <CodeBlock label="bash">
{`dotnet test Inktide.API.sln                      # all tests
dotnet test --filter "FullyQualifiedName~Foo"    # single test

cd apps/web && npm run lint                       # ESLint
cd crates && cargo test                           # Rust`}
      </CodeBlock>

      <InfoBox>
        {t('docs.quickstart.infoA')}{' '}
        <strong className="font-semibold text-[var(--text-primary)]">.env</strong>{' '}
        {t('docs.quickstart.infoB')}
        <code className="font-mono text-[0.8125rem] text-[var(--accent-primary)]">Section__Property=value</code>
        {t('docs.quickstart.infoC')}
      </InfoBox>
    </DocPage>
  )
}
