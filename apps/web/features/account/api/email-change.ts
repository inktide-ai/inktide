import { apiFetch, jsonOrThrow } from '@/api/client'

export async function requestEmailChange(newEmail: string): Promise<void> {
  const res = await apiFetch('/api/v1/me/email-change/request', {
    method: 'POST',
    body: JSON.stringify({ newEmail }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null) as { detail?: string } | null
    throw new Error(data?.detail ?? 'Failed to send verification code.')
  }
}

export async function verifyEmailChange(code: string): Promise<{ newEmail: string }> {
  const res = await apiFetch('/api/v1/me/email-change/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  if (res.status === 400) {
    const data = await res.json().catch(() => null) as { detail?: string } | null
    throw new Error(data?.detail ?? 'Invalid or expired code.')
  }
  return jsonOrThrow<{ newEmail: string }>(res)
}
