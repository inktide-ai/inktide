'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import {
  cancelInvite,
  listPendingInvites,
  resendInvite,
  sendInvites,
  type InviteDto,
  type OrgRole,
} from '@/api/organization'
import { ApiError } from '@/api/client'

interface Props {
  open: boolean
  onClose: () => void
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'))
}

export default function InviteMembersModal({ open, onClose }: Props) {
  const [emailInput, setEmailInput] = useState('')
  const [role, setRole] = useState<OrgRole>('member')
  const [pendingInvites, setPendingInvites] = useState<InviteDto[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listPendingInvites()
      .then(r => setPendingInvites(r.invites))
      .catch(() => setPendingInvites([]))
      .finally(() => setLoading(false))
  }, [open])

  const handleSend = useCallback(async () => {
    const emails = parseEmails(emailInput)
    if (emails.length === 0) {
      setError('Enter at least one valid email address.')
      return
    }
    setSending(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const result = await sendInvites({ emails, role })
      setPendingInvites(result.invites)
      setEmailInput('')
      setSuccessMsg(`Invitation${emails.length > 1 ? 's' : ''} sent.`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to send invites.')
    } finally {
      setSending(false)
    }
  }, [emailInput, role])

  const handleResend = useCallback(async (inviteId: string) => {
    try {
      await resendInvite(inviteId)
      setSuccessMsg('Invite resent.')
    } catch {
      setError('Failed to resend invite.')
    }
  }, [])

  const handleCancel = useCallback(async (inviteId: string) => {
    try {
      await cancelInvite(inviteId)
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
    } catch {
      setError('Failed to cancel invite.')
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[2000]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-[14px] overflow-hidden outline-none"
          style={{
            width: 'min(540px, 95vw)',
            maxHeight: '85vh',
            background: 'var(--menu-panel-bg)',
            boxShadow: 'var(--menu-panel-shadow)',
          }}
        >
          <Dialog.Title className="sr-only">Invite team members</Dialog.Title>

          {/* Header */}
          <div
            className="flex items-start justify-between px-6 pt-5 pb-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Invite Members
              </h2>
              <p className="mt-0.5 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                Send email invitations to collaborate in your workspace.
              </p>
            </div>
            <Dialog.Close
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e =>
                ((e.target as HTMLElement).style.background = 'var(--surface-2)')
              }
              onMouseLeave={e =>
                ((e.target as HTMLElement).style.background = 'transparent')
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          </div>

          {/* Input area */}
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <label
              className="block text-[14px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email addresses
            </label>
            <textarea
              ref={textareaRef}
              value={emailInput}
              onChange={e => {
                setEmailInput(e.target.value)
                setError(null)
                setSuccessMsg(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="alice@example.com, bob@example.com"
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-[14px] resize-none outline-none"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="mt-3 flex items-center gap-2">
              <Select.Root value={role} onValueChange={v => setRole(v as OrgRole)}>
                <Select.Trigger
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[14px] outline-none cursor-pointer"
                  style={{
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    minWidth: '110px',
                  }}
                >
                  <Select.Value />
                  <Select.Icon>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="ml-auto"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-[3000] rounded-lg p-1"
                    style={{
                      background: 'var(--menu-panel-bg)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--menu-panel-shadow)',
                    }}
                  >
                    <Select.Viewport>
                      {(['member', 'admin'] as OrgRole[]).map(r => (
                        <Select.Item
                          key={r}
                          value={r}
                          className="flex items-center px-3 py-1.5 text-[14px] rounded-md cursor-pointer outline-none select-none"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={e =>
                            ((e.currentTarget as HTMLElement).style.background =
                              'var(--surface-2)')
                          }
                          onMouseLeave={e =>
                            ((e.currentTarget as HTMLElement).style.background = 'transparent')
                          }
                        >
                          <Select.ItemText>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !emailInput.trim()}
                className="ml-auto h-9 px-4 rounded-lg text-[14px] font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent-primary)' }}
              >
                {sending ? 'Sending…' : 'Send Invites'}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-[14px]" style={{ color: '#f87171' }}>
                {error}
              </p>
            )}
            {successMsg && (
              <p className="mt-2 text-[14px]" style={{ color: '#4ade80' }}>
                {successMsg}
              </p>
            )}
          </div>

          {/* Pending invites list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="text-[14px] font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Pending Invites ({loading ? '…' : pendingInvites.length})
            </p>
            {loading ? (
              <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
                Loading…
              </p>
            ) : pendingInvites.length === 0 ? (
              <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
                No pending invitations.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingInvites.map(inv => (
                  <PendingInviteRow
                    key={inv.id}
                    invite={inv}
                    onResend={handleResend}
                    onCancel={handleCancel}
                  />
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PendingInviteRow({
  invite,
  onResend,
  onCancel,
}: {
  invite: InviteDto
  onResend: (id: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const expiresDate = new Date(invite.expiresAt)
  const isExpired = expiresDate < new Date()

  return (
    <li
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--surface-1)' }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[14px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {invite.email}
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
          {' · '}
          {isExpired ? 'Expired' : `Expires ${expiresDate.toLocaleDateString()}`}
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await onResend(invite.id)
          setBusy(false)
        }}
        className="shrink-0 text-[14px] disabled:opacity-50 hover:underline"
        style={{ color: 'var(--accent-primary)' }}
      >
        Resend
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await onCancel(invite.id)
          setBusy(false)
        }}
        className="shrink-0 text-[14px] disabled:opacity-50 transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
        onMouseLeave={e =>
          ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')
        }
      >
        Cancel
      </button>
    </li>
  )
}
