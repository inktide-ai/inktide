'use client'

import { useState } from 'react'
import { MoreHorizontal, FolderOpen, Download, Trash2, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu'
import { deleteProject, useProjectExport } from '@/features/projects'
import { queryKeys } from '@/shared/lib/query/keys'
import { cn } from '@/lib/utils'

const panelClass = cn(
  'z-[3000] min-w-[180px] overflow-hidden rounded-md p-1',
  'border border-[var(--border-default)] bg-[var(--menu-panel-bg)]',
  'text-body text-[var(--text-primary)] shadow-md',
  'data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out',
)

const rowClass = cn(
  'flex cursor-default select-none items-center gap-2 rounded-[6px] px-2.5 py-[7px] outline-none text-sm',
  'text-[var(--text-secondary)] data-[highlighted]:bg-[var(--surface-1)] data-[highlighted]:text-[var(--text-primary)]',
)

const deleteClass = cn(
  rowClass,
  'text-[var(--stat-accent-danger)] data-[highlighted]:bg-[var(--surface-1)] data-[highlighted]:text-[var(--stat-accent-danger)]',
)

interface ProjectCardMenuProps {
  projectId: string
  projectName: string
}

export function ProjectCardMenu({ projectId, projectName }: ProjectCardMenuProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { exportAndDownload, exportingId } = useProjectExport()
  const qc = useQueryClient()
  const isExporting = exportingId === projectId

  function handleOpenChange(open: boolean) {
    if (!open) setConfirming(false)
  }

  async function handleDelete(e: Event) {
    e.preventDefault()
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    try {
      await deleteProject(projectId)
      await qc.invalidateQueries({ queryKey: queryKeys.projects.all() })
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal size={15} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent className={panelClass} align="end" sideOffset={6}>
          <DropdownMenuItem
            className={rowClass}
            onSelect={() => window.open(`/projects/${projectId}`, '_blank')}
          >
            <FolderOpen size={14} className="shrink-0" />
            Open in new tab
          </DropdownMenuItem>

          <DropdownMenuItem
            className={rowClass}
            disabled={isExporting}
            onSelect={e => {
              e.preventDefault()
              exportAndDownload(projectId, projectName)
            }}
          >
            {isExporting
              ? <Loader2 size={14} className="shrink-0 animate-spin" />
              : <Download size={14} className="shrink-0" />
            }
            {isExporting ? 'Exporting…' : 'Export project'}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 h-px bg-[var(--border-subtle)]" />

          <DropdownMenuItem
            className={deleteClass}
            disabled={deleting}
            onSelect={handleDelete}
          >
            <Trash2 size={14} className="shrink-0" />
            {deleting ? 'Deleting…' : confirming ? 'Confirm delete' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
