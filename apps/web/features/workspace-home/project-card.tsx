'use client'

import { useState, type ReactNode } from 'react'
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
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]   = useState(false)

  return (
    <Card className="w-[232px] flex-shrink-0 overflow-hidden">
      {previewUrl && !imgError ? (
        <div className="relative h-[128px] w-full overflow-hidden bg-[var(--card-bg)]">
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-[var(--surface-2)]" />}
          <img
            src={previewUrl}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ objectPosition: 'center 35%' }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div
          className="h-[128px] w-full bg-cover bg-center"
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
            <p className="home-heading-font truncate text-body font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="home-ui-font truncate text-xs text-[var(--text-secondary)]">{editedLabel}</p>
          </div>
        </div>
        <button type="button" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          <MoreHorizontal size={15} />
        </button>
      </div>
    </Card>
  )
}
