import GraphBuilderPage from '@/features/graph/graph-builder-page'
import SoulPicker from '@/features/graph/soul-picker'

interface Props {
  searchParams: Promise<{ characterId?: string; projectId?: string }>
}

export default async function Page({ searchParams }: Props) {
  const { characterId, projectId } = await searchParams
  const id = projectId ?? characterId
  if (!id) return <SoulPicker />
  return <GraphBuilderPage projectId={id} />
}
