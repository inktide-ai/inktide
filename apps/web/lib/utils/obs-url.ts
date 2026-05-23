export interface ObsSceneParams {
  modelUrl:  string
  modelType: string
  channelId?: string | null
  sceneUrl?:  string | null
  bg?:        string
}

export function buildObsSceneUrl(origin: string, params: ObsSceneParams): string {
  const search = new URLSearchParams({ modelUrl: params.modelUrl, modelType: params.modelType })
  if (params.channelId) search.set('channelId', params.channelId)
  if (params.sceneUrl)  search.set('sceneUrl',  params.sceneUrl)
  if (params.bg)        search.set('bg',        params.bg)
  return `${origin}/obs/scene?${search.toString()}`
}
