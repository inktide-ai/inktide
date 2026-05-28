import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'
import type {
  AiCardSceneResponse,
  BeginModelUploadResponse,
  CustomSceneTagDto,
  RunPreset,
  CreateRunPresetRequest,
} from '@/shared/types/soul-api'

export async function listCardScenes(cardId: string): Promise<AiCardSceneResponse[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes`)
  return jsonOrThrow<AiCardSceneResponse[]>(res)
}

export async function presignSceneUpload(
  cardId: string,
  body: { file_name: string; content_type: string; size_bytes: number },
): Promise<BeginModelUploadResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/presign`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<BeginModelUploadResponse>(res)
}

export async function completeSceneUpload(
  cardId: string,
  body: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
    tag?: string | null
  },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

export async function listCustomSceneTags(cardId: string): Promise<CustomSceneTagDto[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/custom-tags`)
  return jsonOrThrow<CustomSceneTagDto[]>(res)
}

export async function addCustomSceneTag(cardId: string, label: string, color?: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/custom-tags`, {
    method: 'POST',
    body: JSON.stringify({ label, color: color ?? null }),
  })
  await emptyOrThrow(res)
}

export async function patchCardSceneTag(
  cardId: string,
  sceneId: string,
  body: { tag: string | null },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

export async function putCardSceneMetadata(
  cardId: string,
  sceneId: string,
  body: {
    display_name?: string | null
    description?: string | null
    tag?: string | null
  },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}/metadata`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

// uploadCardSceneFile перенесён в services/upload/CardSceneUploader.ts + PresignedUploadService.ts
// OCP: паттерн presign→PUT→complete написан один раз, не дублируется здесь

export async function deleteCardScene(cardId: string, sceneId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

export async function reorderScene(
  cardId: string,
  sceneId: string,
  body: { previous_id: string | null; next_id: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}/position`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return emptyOrThrow(res)
}

// ── Run presets (Scenes) ── runtime configuration overlay layer ──────────────

export async function listRunPresets(cardId: string): Promise<RunPreset[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets`)
  return jsonOrThrow<RunPreset[]>(res)
}

export async function createRunPreset(cardId: string, body: CreateRunPresetRequest): Promise<RunPreset> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<RunPreset>(res)
}

export async function updateRunPreset(
  cardId: string,
  presetId: string,
  body: Partial<CreateRunPresetRequest> & { name: string },
): Promise<RunPreset> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/${presetId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<RunPreset>(res)
}

export async function deleteRunPreset(cardId: string, presetId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/${presetId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

export async function activateRunPreset(cardId: string, presetId: string): Promise<RunPreset> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/${presetId}/activate`, { method: 'POST' })
  return jsonOrThrow<RunPreset>(res)
}

export async function deactivateRunPreset(cardId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/active`, { method: 'DELETE' })
  await emptyOrThrow(res)
}
