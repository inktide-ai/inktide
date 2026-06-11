import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'

export interface ObsSceneParams {
  modelUrl:   string
  modelType:  string
  projectId?: string
  channelId?: string | null
  sceneUrl?:  string | null
  bg?:        string
  // fallback for OBS Browser Source configured before projectId was introduced:
  rendererSettings?: SceneRendererSettings
  baselineMood?: string
}

export function buildObsSceneUrl(origin: string, params: ObsSceneParams): string {
  const search = new URLSearchParams({ modelUrl: params.modelUrl, modelType: params.modelType })
  if (params.projectId)         search.set('projectId', params.projectId)
  if (params.channelId)         search.set('channelId', params.channelId)
  if (params.sceneUrl)          search.set('sceneUrl',  params.sceneUrl)
  if (params.bg)                search.set('bg',        params.bg)
  if (params.rendererSettings)  search.set('settings',  JSON.stringify(params.rendererSettings))
  if (params.baselineMood)      search.set('mood',      params.baselineMood)
  return `${origin}/obs/scene?${search.toString()}`
}
