import type { AiCardModelResponse, AiCardSceneResponse } from '@/features/soul'
import { inferModelType } from '@/shared/lib/utils/model-type'
import { buildObsSceneUrl } from '@/shared/lib/utils/obs-url'

export function buildProjectPreviewUrl(
  model: AiCardModelResponse,
  scene: AiCardSceneResponse | null,
  channelId?: string | null,
): string {
  return buildObsSceneUrl('', {
    modelUrl:  model.public_url,
    modelType: inferModelType(model.original_file_name),
    sceneUrl:  scene?.public_url,
    channelId: channelId ?? undefined,
    bg:        'transparent',
  })
}
