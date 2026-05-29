import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'

interface TemplateCardProps {
  title: string
  subtitle: string
  icon: ReactNode
}

export function TemplateCard({ title, subtitle, icon }: TemplateCardProps) {
  return (
    <Card className="flex w-full cursor-pointer flex-col items-start gap-3 px-4 py-3 hover:bg-[hsla(var(--bg-1),_1)] transition-colors">
      <span className="text-[var(--accent-hover)]">{icon}</span>
      <div>
        <p className="home-heading-font text-body font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="home-ui-font text-xs text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </Card>
  )
}
