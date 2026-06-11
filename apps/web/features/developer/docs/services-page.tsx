import { DocPage, PageSubtitle, PageTitle, Table, TableHead, TableRow, Td, TdBold } from './shared'
import { getTranslations } from '@/lib/i18n-server'

export async function ServicesPage() {
  const t = await getTranslations('developer')
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.services.eyebrow')}>{t('docs.services.title')}</PageTitle>
      <PageSubtitle>{t('docs.services.subtitle')}</PageSubtitle>

      <Table>
        <TableHead cols={[t('docs.services.colService'), t('docs.services.colAddress'), t('docs.services.colPurpose')]} />
        <tbody>
          {[
            ['Inktide API',      '127.0.0.1:5001',  'docs.services.p.api'],
            ['gRPC (general)',   '127.0.0.1:8081',  'docs.services.p.grpc'],
            ['Soul gRPC',        '127.0.0.1:8084',  'docs.services.p.soulGrpc'],
            ['Frontend (dev)',   'localhost:3000',   'docs.services.p.frontend'],
            ['Keycloak',         'localhost:8080',   'docs.services.p.keycloak'],
            ['Keycloak Admin',   'localhost:8080',   'docs.services.p.keycloakAdmin'],
            ['PostgreSQL',       'localhost:5432',   'docs.services.p.postgres'],
            ['Redis',            'localhost:6379',   'docs.services.p.redis'],
            ['Qdrant',           'localhost:6334',   'docs.services.p.qdrant'],
            ['Qdrant HTTP',      'localhost:6333',   'docs.services.p.qdrantHttp'],
            ['Kokoro TTS',       '127.0.0.1:8880',  'docs.services.p.kokoro'],
            ['MinIO S3',         '127.0.0.1:9000',  'docs.services.p.minio'],
            ['MinIO Console',    '127.0.0.1:9001',  'docs.services.p.minioConsole'],
            ['AI Worker',        'localhost:8000',   'docs.services.p.aiWorker'],
            ['Scribe Worker',    'localhost:8001',   'docs.services.p.scribe'],
          ].map(([svc, addr, purposeKey]) => (
            <TableRow key={svc}>
              <TdBold>{svc}</TdBold>
              <Td mono accent>{addr}</Td>
              <Td>{t(purposeKey)}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </DocPage>
  )
}
