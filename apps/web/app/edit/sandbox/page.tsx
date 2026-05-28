import ProjectPicker from '@/features/sandbox/project-picker'
import SandboxRunner from '@/widgets/sandbox/sandbox-runner'

interface Props {
  searchParams: Promise<{ projectId?: string }>
}

export default async function SandboxPage({ searchParams }: Props) {
  const { projectId } = await searchParams
  if (!projectId) return <ProjectPicker />
  return <SandboxRunner projectId={projectId} />
}
