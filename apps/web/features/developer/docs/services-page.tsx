import { DocPage, PageSubtitle, PageTitle, Table, TableHead, TableRow, Td, TdBold } from './shared'

export function ServicesPage() {
  return (
    <DocPage>
      <PageTitle eyebrow="Platform">Services</PageTitle>
      <PageSubtitle>Default local development addresses for all Inktide services.</PageSubtitle>

      <Table>
        <TableHead cols={['Service', 'Address', 'Purpose']} />
        <tbody>
          {[
            ['Inktide API',      '127.0.0.1:5001',  'Main HTTP/REST backend (Kestrel)'],
            ['gRPC (general)',   '127.0.0.1:8081',  'General gRPC service endpoint'],
            ['Soul gRPC',        '127.0.0.1:8084',  'AI Cards gRPC service'],
            ['Frontend (dev)',   'localhost:3000',   'Next.js dev server'],
            ['Keycloak',         'localhost:8080',   'OIDC identity provider — realm: inktide-app'],
            ['Keycloak Admin',   'localhost:8080',   '/admin/realms/inktide-app'],
            ['PostgreSQL',       'localhost:5432',   'Primary relational database'],
            ['Redis',            'localhost:6379',   'Streams (message pipeline) + cache'],
            ['Qdrant',           'localhost:6334',   'Vector DB (gRPC) — collection: chat_memories, vector size: 768'],
            ['Qdrant HTTP',      'localhost:6333',   'Vector DB HTTP (dashboard at :6333/dashboard)'],
            ['Kokoro TTS',       '127.0.0.1:8880',  'Text-to-speech server — OpenAI-compatible API at /v1'],
            ['MinIO S3',         '127.0.0.1:9000',  'Object storage — bucket: inktide-uploads'],
            ['MinIO Console',    '127.0.0.1:9001',  'MinIO web admin console'],
            ['AI Worker',        'localhost:8000',   'Python — embeddings (/embeddings) + classify (/classify) via Ollama'],
            ['Scribe Worker',    'localhost:8001',   'Python — fact extraction from text'],
          ].map(([svc, addr, purpose]) => (
            <TableRow key={svc}>
              <TdBold>{svc}</TdBold>
              <Td mono accent>{addr}</Td>
              <Td>{purpose}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </DocPage>
  )
}
