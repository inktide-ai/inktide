'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link2, Unlink, X } from 'lucide-react'
import { getCards, type AiCardListItem } from '@/api/soul'
import { bindSoul, unbindSoul } from '@/api/projects'
import type { ProjectActiveSoul } from '@/api/projects'
import { queryKeys } from '@/lib/query/keys'

interface SoulBindingPickerProps {
  projectId: string
  activeSoul: ProjectActiveSoul | null
  onChanged: (soul: ProjectActiveSoul | null) => void
  open?: boolean
  onOpenChange?: (v: boolean) => void
}

export function SoulBindingPicker({ projectId, activeSoul, onChanged, open: controlledOpen, onOpenChange }: SoulBindingPickerProps) {
  const qc = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [souls, setSouls] = useState<AiCardListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [binding, setBinding] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getCards()
      .then(setSouls)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleBind(soul: AiCardListItem) {
    if (binding) return
    setBinding(true)
    try {
      const updated = await bindSoul(projectId, soul.id)
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      qc.invalidateQueries({ queryKey: queryKeys.projects.all() })
      onChanged(updated.active_soul)
      setOpen(false)
    } catch (err) {
      console.error('Bind failed:', err)
    } finally {
      setBinding(false)
    }
  }

  async function handleUnbind() {
    if (binding) return
    setBinding(true)
    try {
      await unbindSoul(projectId)
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
      qc.invalidateQueries({ queryKey: queryKeys.projects.all() })
      onChanged(null)
    } catch (err) {
      console.error('Unbind failed:', err)
    } finally {
      setBinding(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {activeSoul ? (
          <>
            <div className="flex items-center gap-2">
              {activeSoul.avatar_url ? (
                <img src={activeSoul.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[14px] font-medium text-[var(--text-secondary)]">
                  {activeSoul.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[14px] font-medium text-[var(--text-primary)]">{activeSoul.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 text-[14px] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              Change
            </button>
            <button
              type="button"
              disabled={binding}
              onClick={handleUnbind}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 text-[14px] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              <Unlink size={12} />
              Unlink
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-4 text-[14px] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <Link2 size={14} />
            Link a Soul
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (!modalRef.current?.contains(e.target as Node)) setOpen(false) }}>
          <div ref={modalRef} className="w-[480px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-0)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Select a Soul</h3>
              <button type="button" onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-[hsla(var(--bg-1),_1)]" />
                  ))}
                </div>
              ) : souls.length === 0 ? (
                <p className="py-8 text-center text-[14px] text-[var(--text-tertiary)]">No souls found</p>
              ) : (
                <div className="space-y-1">
                  {souls.map(soul => (
                    <button
                      key={soul.id}
                      type="button"
                      disabled={binding}
                      onClick={() => handleBind(soul)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-1)] disabled:opacity-50 ${
                        activeSoul?.id === soul.id ? 'bg-[var(--sidebar-active)]' : ''
                      }`}
                    >
                      {soul.avatar_url ? (
                        <img src={soul.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[14px] font-medium text-[var(--text-secondary)]">
                          {soul.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium text-[var(--text-primary)]">{soul.name}</div>
                        {soul.description && (
                          <div className="truncate text-[12px] text-[var(--text-tertiary)]">{soul.description}</div>
                        )}
                      </div>
                      {activeSoul?.id === soul.id && (
                        <Link2 size={13} className="ml-auto shrink-0 text-[var(--accent-primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
