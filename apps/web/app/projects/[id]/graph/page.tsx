import GraphBuilderPage from '@/components/graph/graph-builder-page'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectGraphPage({ params }: Props) {
  const { id } = await params
  return <GraphBuilderPage projectId={id} />
}
