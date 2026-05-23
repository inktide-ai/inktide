import { API_BASE_URL } from './config'

export interface DemoChatRequest {
  text: string
  history?: Array<{ role: number; content: string }>
}

export interface DemoChatResponse {
  text: string
  model: string
}

export async function sendDemoMessage(req: DemoChatRequest): Promise<DemoChatResponse> {
  const url = `${API_BASE_URL}/api/v1/demo/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; detail?: string }
    throw new Error(body.error ?? body.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}
