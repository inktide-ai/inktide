'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProject,
  updateProject,
  bindSoul as apiBind,
  unbindSoul as apiUnbind,
  type Project,
} from '@/api/projects'
import { getCard, listCardModels, listCardScenes, type AiCardResponse, type AiCardModelResponse, type AiCardSceneResponse, type ChannelResponse } from '@/api/soul'
import { queryKeys } from '@/lib/query/keys'
import { buildProjectPreviewUrl } from '@/lib/project-preview'

export interface ProjectRuntime {
  project: Project | null
  soul: AiCardResponse | null
  models: AiCardModelResponse[]
  scenes: AiCardSceneResponse[]
  activeModel: AiCardModelResponse | null
  activeScene: AiCardSceneResponse | null
  activeChannels: ChannelResponse[]
  previewUrl: string | null
  loading: boolean
  bindSoul(soulId: string): Promise<void>
  unbindSoul(): Promise<void>
  setActiveModel(modelId: string): Promise<void>
  setActiveScene(sceneId: string): Promise<void>
  updateProjectMeta(data: { name: string; description?: string | null }): Promise<void>
  toggleStatus(): Promise<void>
}

export function useProjectRuntime(projectId: string): ProjectRuntime {
  const qc = useQueryClient()

  const projectQuery = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
    staleTime: 0,
    enabled: !!projectId,
  })

  const project = projectQuery.data ?? null
  const soulId = project?.active_soul_id ?? null

  const soulQuery = useQuery({
    queryKey: queryKeys.souls.detail(soulId ?? ''),
    queryFn: () => getCard(soulId!),
    staleTime: 60_000,
    enabled: !!soulId,
  })

  const modelsQuery = useQuery({
    queryKey: queryKeys.souls.models(soulId ?? ''),
    queryFn: () => listCardModels(soulId!),
    staleTime: 60_000,
    enabled: !!soulId,
  })

  const scenesQuery = useQuery({
    queryKey: queryKeys.souls.scenes(soulId ?? ''),
    queryFn: () => listCardScenes(soulId!),
    staleTime: 60_000,
    enabled: !!soulId,
  })

  const models = modelsQuery.data ?? []
  const scenes = scenesQuery.data ?? []
  const soul = soulQuery.data ?? null

  const activeModel = useMemo(
    () =>
      models.find(m => m.id === project?.active_model_id) ??
      models.find(m => m.is_active) ??
      models[0] ??
      null,
    [models, project?.active_model_id],
  )

  const activeScene = useMemo(
    () =>
      scenes.find(s => s.id === project?.active_scene_id) ??
      scenes[0] ??
      null,
    [scenes, project?.active_scene_id],
  )

  const activeChannels = useMemo(
    () => (soul?.channels ?? []).filter(c => c.is_active && c.channel_id),
    [soul?.channels],
  )

  const previewUrl = useMemo(
    () =>
      activeModel
        ? buildProjectPreviewUrl(activeModel, activeScene, activeChannels[0]?.channel_id)
        : null,
    [activeModel, activeScene, activeChannels],
  )

  const loading = projectQuery.isLoading || (!!soulId && soulQuery.isLoading)

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    if (soulId) {
      qc.invalidateQueries({ queryKey: queryKeys.souls.models(soulId) })
      qc.invalidateQueries({ queryKey: queryKeys.souls.scenes(soulId) })
    }
  }

  const bindSoulMutation = useMutation({
    mutationFn: (newSoulId: string) => apiBind(projectId, newSoulId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    },
  })

  const unbindSoulMutation = useMutation({
    mutationFn: () => apiUnbind(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    },
  })

  const setActiveModelMutation = useMutation({
    mutationFn: (modelId: string) =>
      updateProject(projectId, { name: project?.name ?? '', active_model_id: modelId }),
    onSuccess: invalidateAll,
  })

  const setActiveSceneMutation = useMutation({
    mutationFn: (sceneId: string) =>
      updateProject(projectId, { name: project?.name ?? '', active_scene_id: sceneId }),
    onSuccess: invalidateAll,
  })

  const updateProjectMetaMutation = useMutation({
    mutationFn: (data: { name: string; description?: string | null }) =>
      updateProject(projectId, { name: data.name, description: data.description }),
    onSuccess: invalidateAll,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      updateProject(projectId, {
        name: project?.name ?? '',
        status: project?.status === 'active' ? 'paused' : 'active',
      }),
    onSuccess: invalidateAll,
  })

  return {
    project,
    soul,
    models,
    scenes,
    activeModel,
    activeScene,
    activeChannels,
    previewUrl,
    loading,
    bindSoul: (id) => bindSoulMutation.mutateAsync(id).then(() => {}),
    unbindSoul: () => unbindSoulMutation.mutateAsync().then(() => {}),
    setActiveModel: (id) => setActiveModelMutation.mutateAsync(id).then(() => {}),
    setActiveScene: (id) => setActiveSceneMutation.mutateAsync(id).then(() => {}),
    updateProjectMeta: (data) => updateProjectMetaMutation.mutateAsync(data).then(() => {}),
    toggleStatus: () => toggleStatusMutation.mutateAsync().then(() => {}),
  }
}
