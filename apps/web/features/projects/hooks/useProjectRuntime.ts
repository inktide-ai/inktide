'use client'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProject,
  updateProject,
  bindSoul as apiBind,
  unbindSoul as apiUnbind,
  type Project,
  type UpdateProjectRequest,
} from '@/features/projects/api/projects'
import type { ProjectListItem } from '@/entities/project/api'
import type { AiCardResponse, AiCardModelResponse } from '@/shared/types/soul-api'
import { getCard, listCardModels } from '@/entities/soul/api'
import { listProjectScenes, type ProjectSceneResponse } from '@/features/projects/api/scenes'
import { listProjectChannels, type ProjectChannelResponse } from '@/features/projects/api/channels'
import { queryKeys } from '@/shared/lib/query/keys'
import { buildProjectPreviewUrl } from '@/features/projects/lib/project-preview'

function buildUpdate(project: Project | null, overrides: Partial<UpdateProjectRequest>): UpdateProjectRequest {
  return {
    name: project?.name ?? '',
    description: project?.description ?? null,
    status: project?.status,
    active_model_id: project?.active_model_id ?? null,
    active_scene_id: project?.active_scene_id ?? null,
    system_prompt: project?.system_prompt ?? null,
    ...overrides,
  }
}

export interface ProjectRuntime {
  project: Project | null
  soul: AiCardResponse | null
  models: AiCardModelResponse[]
  scenes: ProjectSceneResponse[]
  activeModel: AiCardModelResponse | null
  activeScene: ProjectSceneResponse | null
  activeChannels: ProjectChannelResponse[]
  previewUrl: string | null
  loading: boolean
  bindSoul(soulId: string): Promise<void>
  unbindSoul(): Promise<void>
  setActiveModel(modelId: string | null): Promise<void>
  setActiveScene(sceneId: string | null): Promise<void>
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
    queryKey: ['project-runtime', 'soul', soulId ?? ''],
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
    queryKey: queryKeys.projects.scenes(projectId),
    queryFn: () => listProjectScenes(projectId),
    staleTime: 60_000,
    enabled: !!projectId,
  })

  const channelsQuery = useQuery({
    queryKey: queryKeys.projects.channels(projectId),
    queryFn: () => listProjectChannels(projectId),
    staleTime: 60_000,
    enabled: !!projectId,
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
    () => (channelsQuery.data ?? []).filter(c => c.is_active && c.channel_id),
    [channelsQuery.data],
  )

  const previewUrl = useMemo(
    () =>
      activeModel
        ? buildProjectPreviewUrl(activeModel, activeScene, activeChannels[0]?.channel_id)
        : null,
    [activeModel, activeScene, activeChannels],
  )

  const loading = projectQuery.isLoading || (!!soulId && (soulQuery.isLoading || modelsQuery.isLoading))

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    qc.invalidateQueries({ predicate: q => q.queryKey[0] === 'projects' && typeof q.queryKey[1] === 'object' })
    qc.invalidateQueries({ queryKey: queryKeys.projects.scenes(projectId) })
    qc.invalidateQueries({ queryKey: queryKeys.projects.channels(projectId) })
    if (soulId) {
      qc.invalidateQueries({ queryKey: queryKeys.souls.models(soulId) })
    }
  }

  function patchProjectCache(patch: Partial<ProjectListItem>) {
    const detail = qc.getQueryData<Project>(queryKeys.projects.detail(projectId))
    if (detail) qc.setQueryData(queryKeys.projects.detail(projectId), { ...detail, ...patch })
    qc.setQueriesData<ProjectListItem[]>(
      { predicate: q => q.queryKey[0] === 'projects' && typeof q.queryKey[1] === 'object' },
      old => old?.map(p => p.id === projectId ? { ...p, ...patch } : p),
    )
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
    mutationFn: (modelId: string | null) =>
      updateProject(projectId, buildUpdate(project, { active_model_id: modelId })),
    onMutate: (modelId) => patchProjectCache({ active_model_id: modelId }),
    onError: (_err, _modelId, _ctx) => invalidateAll(),
    onSettled: invalidateAll,
  })

  const setActiveSceneMutation = useMutation({
    mutationFn: (sceneId: string | null) =>
      updateProject(projectId, buildUpdate(project, { active_scene_id: sceneId })),
    onMutate: (sceneId) => patchProjectCache({ active_scene_id: sceneId }),
    onError: (_err, _sceneId, _ctx) => invalidateAll(),
    onSettled: invalidateAll,
  })

  const updateProjectMetaMutation = useMutation({
    mutationFn: (data: { name: string; description?: string | null }) =>
      updateProject(projectId, buildUpdate(project, { name: data.name, description: data.description })),
    onSuccess: invalidateAll,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      updateProject(projectId, buildUpdate(project, { status: project?.status === 'active' ? 'paused' : 'active' })),
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
    bindSoul: async (id) => { await bindSoulMutation.mutateAsync(id) },
    unbindSoul: async () => { await unbindSoulMutation.mutateAsync() },
    setActiveModel: async (id) => { await setActiveModelMutation.mutateAsync(id) },
    setActiveScene: async (id) => { await setActiveSceneMutation.mutateAsync(id) },
    updateProjectMeta: async (data) => { await updateProjectMetaMutation.mutateAsync(data) },
    toggleStatus: async () => { await toggleStatusMutation.mutateAsync() },
  }
}
