'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from '@/shared/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectIcon, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText } from '@/shared/ui/select'
import {
  cancelInvite,
  listPendingInvites,
  resendInvite,
  sendInvites,
  type InviteDto,
  type OrgRole,
} from '@/features/organization/api/organization'
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
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
    >
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[4px]"
        />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 flex flex-col w-[min(540px,95vw)] max-h-[85vh] rounded-[14px] overflow-hidden outline-none bg-[var(--menu-panel-bg)] shadow-[var(--menu-panel-shadow)]"
        >
          <DialogTitle className="sr-only">Invite team members</DialogTitle>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Invite Members
              </h2>
              <p className="mt-0.5 text-body text-[var(--text-secondary)]">
                Send email invitations to collaborate in your workspace.
              </p>
            </div>
            <DialogClose
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
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
            </DialogClose>
          </div>

          {/* Input area */}
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
            <label className="block text-body font-medium mb-1.5 text-[var(--text-secondary)]">
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
              className="w-full rounded-lg px-3 py-2.5 text-body resize-none outline-none bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-primary)]"
            />
            <div className="mt-3 flex items-center gap-2">
              <Select value={role} onValueChange={v => setRole(v as OrgRole)}>
                <SelectTrigger
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-body outline-none cursor-pointer border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] min-w-[110px]"
                >
                  <SelectValue />
                  <SelectIcon>
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
                  </SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent
                    className="z-[3000] rounded-lg p-1 bg-[var(--menu-panel-bg)] border border-[var(--border-subtle)] shadow-[var(--menu-panel-shadow)]"
                  >
                    <SelectViewport>
                      {(['member', 'admin'] as OrgRole[]).map(r => (
                        <SelectItem
                          key={r}
                          value={r}
                          className="flex items-center px-3 py-1.5 text-body rounded-md cursor-pointer outline-none select-none text-[var(--text-primary)] data-[highlighted]:bg-[var(--surface-2)]"
                        >
                          <SelectItemText>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </SelectItemText>
                        </SelectItem>
                      ))}
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </Select>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !emailInput.trim()}
                className="ml-auto h-9 px-4 rounded-lg text-body font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent-primary)]"
              >
                {sending ? 'Sending…' : 'Send Invites'}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-body text-[var(--color-error-mid)]">
                {error}
              </p>
            )}
            {successMsg && (
              <p className="mt-2 text-body text-[var(--color-online)]">
                {successMsg}
              </p>
            )}
          </div>

          {/* Pending invites list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="text-body font-medium mb-3 text-[var(--text-secondary)]">
              Pending Invites ({loading ? '…' : pendingInvites.length})
            </p>
            {loading ? (
              <p className="text-body text-[var(--text-tertiary)]">
                Loading…
              </p>
            ) : pendingInvites.length === 0 ? (
              <p className="text-body text-[var(--text-tertiary)]">
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
        </DialogContent>
      </DialogPortal>
    </Dialog>
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
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[var(--surface-1)]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-[var(--text-primary)]">
          {invite.email}
        </p>
        <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
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
        className="shrink-0 text-body disabled:opacity-50 hover:underline text-[var(--accent-primary)]"
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
        className="shrink-0 text-body disabled:opacity-50 transition-colors text-[var(--text-tertiary)] hover:text-[var(--color-error-mid)]"
      >
        Cancel
      </button>
    </li>
  )
}
