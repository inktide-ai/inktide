'use client'
import { useQuery } from '@tanstack/react-query'
import { listCardModels, listCardScenes } from '@/features/soul/api/index'
import { queryKeys } from '@/shared/lib/query/keys'
import { inferModelType } from '@/lib/utils/model-type'
import { buildObsSceneUrl } from '@/lib/utils/obs-url'
import type { ProjectListItem } from '@/features/projects/api/projects'

const STALE = 5 * 60_000

export function useProjectPreviewUrl(project: ProjectListItem): string | null {
  const soulId = project.active_soul_id

  const { data: models } = useQuery({
    queryKey: queryKeys.souls.models(soulId ?? ''),
    queryFn: () => listCardModels(soulId!),
    enabled: !!soulId,
    staleTime: STALE,
  })

  const { data: scenes } = useQuery({
    queryKey: queryKeys.souls.scenes(soulId ?? ''),
    queryFn: () => listCardScenes(soulId!),
    enabled: !!soulId,
    staleTime: STALE,
  })

  if (!soulId || !models) return null
  const model = models.find(m => m.id === project.active_model_id) ?? models.find(m => m.is_active) ?? models[0] ?? null
  if (!model) return null

  // mirror SceneFullscreen: if no explicit scene override, fall back to soul's first scene
  const sceneUrl = project.active_scene_id
    ? scenes?.find(s => s.id === project.active_scene_id)?.public_url
    : scenes?.[0]?.public_url

  return buildObsSceneUrl('', {
    modelUrl:  model.public_url,
    modelType: inferModelType(model.original_file_name),
    sceneUrl,
    bg:        'transparent',
  })
}
