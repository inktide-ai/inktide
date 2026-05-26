import GraphBuilderPage from '@/features/graph/graph-builder-page'

interface Props {
  params: Promise<{ id: string; projectId: string }>
}

export default async function SoulProjectGraphPage({ params }: Props) {
  const { projectId } = await params
  return <GraphBuilderPage projectId={projectId} />
}
