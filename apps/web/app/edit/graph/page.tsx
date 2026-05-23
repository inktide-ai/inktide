import GraphBuilderPage from '@/components/graph/graph-builder-page'
import SoulPicker from '@/components/graph/soul-picker'

interface Props {
  searchParams: Promise<{ characterId?: string; projectId?: string }>
}

export default async function Page({ searchParams }: Props) {
  const { characterId, projectId } = await searchParams
  const id = projectId ?? characterId
  if (!id) return <SoulPicker />
  return <GraphBuilderPage projectId={id} />
}
