'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { useProjectRuntime, type ProjectRuntime } from './hooks/useProjectRuntime'

const ProjectRuntimeContext = createContext<ProjectRuntime | null>(null)

export function ProjectRuntimeProvider({
  projectId,
  children,
}: {
  projectId: string
  children: ReactNode
}) {
  const runtime = useProjectRuntime(projectId)
  return (
    <ProjectRuntimeContext.Provider value={runtime}>
      {children}
    </ProjectRuntimeContext.Provider>
  )
}

export function useProjectRuntimeContext(): ProjectRuntime {
  const ctx = useContext(ProjectRuntimeContext)
  if (!ctx) throw new Error('useProjectRuntimeContext must be used inside ProjectRuntimeProvider')
  return ctx
}
