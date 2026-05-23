import SandboxRunner from '@/components/sandbox/sandbox-runner'

interface Props {
  params: Promise<{ id: string; projectId: string }>
}

export default async function SoulProjectSandboxPage({ params }: Props) {
  const { projectId } = await params
  return <SandboxRunner projectId={projectId} />
}
