import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Card } from '@/shared/ui/card'

interface ProjectCardProps {
  title: string
  editedLabel: string
  coverUrl?: string
  previewUrl?: string | null
  icon: ReactNode
}

export function ProjectCard({ title, editedLabel, coverUrl, previewUrl, icon }: ProjectCardProps) {
  return (
    <Card className="w-[232px] flex-shrink-0 overflow-hidden">
      {previewUrl ? (
        <div className="relative h-[108px] w-full overflow-hidden bg-[var(--bg-2)]">
          <iframe
            src={previewUrl}
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
            title="Scene preview"
          />
        </div>
      ) : (
        <div
          className="h-[108px] w-full bg-cover bg-center"
          style={{
            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
            backgroundColor: 'var(--bg-2)',
          }}
        />
      )}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[var(--accent-hover)]">{icon}</span>
          <div className="min-w-0">
            <p className="home-heading-font truncate text-[14px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="home-ui-font truncate text-[12px] text-[var(--text-secondary)]">{editedLabel}</p>
          </div>
        </div>
        <button type="button" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <MoreHorizontal size={15} />
        </button>
      </div>
    </Card>
  )
}
