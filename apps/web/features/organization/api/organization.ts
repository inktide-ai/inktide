import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'

export type OrgRole = 'member' | 'admin'
export type InviteStatus = 'pending' | 'accepted' | 'expired'

export interface InviteDto {
  id: string
  email: string
  role: OrgRole
  status: InviteStatus
  expiresAt: string
  createdAt: string
}

export interface PendingInvitesResponse {
  organizationId: string
  invites: InviteDto[]
}

export interface AcceptInviteResponse {
  result: 'success' | 'already_member' | 'expired' | 'invalid'
  organizationId?: string
  organizationName?: string
}

export async function listPendingInvites(): Promise<PendingInvitesResponse> {
  const res = await apiFetch('/api/v1/organization/invites')
  return jsonOrThrow<PendingInvitesResponse>(res)
}

export async function sendInvites(body: {
  emails: string[]
  role: OrgRole
}): Promise<PendingInvitesResponse> {
  const res = await apiFetch('/api/v1/organization/invites', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<PendingInvitesResponse>(res)
}

export async function resendInvite(inviteId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/organization/invites/${inviteId}/deliveries`, {
    method: 'POST',
  })
  return emptyOrThrow(res)
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/organization/invites/${inviteId}`, {
    method: 'DELETE',
  })
  return emptyOrThrow(res)
}

export async function acceptInvite(token: string): Promise<AcceptInviteResponse> {
  const res = await apiFetch('/api/v1/organization/invites/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  return jsonOrThrow<AcceptInviteResponse>(res)
}
