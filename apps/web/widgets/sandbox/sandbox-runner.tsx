'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { SceneFullscreen } from '@/widgets/scene-fullscreen'
import { useProjectRuntime, useProjectSnapshotCapture } from '@/features/projects' // fsd:cross-feature-ok - sandbox is always a sub-view of a project runtime

interface SandboxRunnerProps {
  projectId: string
}

export default function SandboxRunner({ projectId }: SandboxRunnerProps) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { selected, selectCard, loading: soulLoading } = useCharactersContext()

  const { project, activeModel, activeScene, loading } = useProjectRuntime(projectId)
  const onCanvasReady = useProjectSnapshotCapture({
    projectId,
    sceneUrl: activeScene?.public_url ?? null,
    captureImmediately: !project?.preview_url,
  })

  useEffect(() => {
    if (project?.active_soul_id && selected?.id !== project.active_soul_id) {
      selectCard(project.active_soul_id)
    }
  }, [project?.active_soul_id, selected?.id, selectCard])

  if (loading || soulLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  if (!project?.active_soul_id) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[14px] text-[var(--text-tertiary)]">
        <p>{t('sandbox.noSoulBoundDesc')}</p>
        <button
          type="button"
          onClick={() => router.push('/edit/sandbox')}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-[14px] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronLeft size={14} />
          {t('sandbox.backToProjects')}
        </button>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-[var(--text-tertiary)]">
        {t('sandbox.loadingSoul')}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SceneFullscreen
        character={selected}
        cardId={selected.id}
        projectId={projectId}
        overrideModelUrl={activeModel?.public_url ?? null}
        overrideSceneUrl={activeScene?.public_url ?? null}
        onFirstRender={onCanvasReady}
        showChat
      />
    </div>
  )
}
