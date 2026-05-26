'use client'

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SplitSectionProps {
  heading: React.ReactNode
  description: React.ReactNode
  reverse?: boolean
  imageDark?: string
  imageAlt?: string
}

function SplitSection({ heading, description, reverse = false, imageDark, imageAlt = '' }: SplitSectionProps) {
  const { ref: refLeft, isVisible: leftVisible } = useRevealOnScroll()
  const { ref: refRight, isVisible: rightVisible } = useRevealOnScroll()

  const visual = (
    <div
      ref={reverse ? refRight : refLeft}
      className={cn(
        'flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden min-h-[320px] flex items-center justify-center transition-all duration-700',
        (reverse ? rightVisible : leftVisible) ? 'opacity-100 translate-x-0' : reverse ? 'opacity-0 translate-x-8' : 'opacity-0 -translate-x-8',
      )}
    >
      {imageDark ? (
        <img src={imageDark} alt={imageAlt} className="w-full h-auto object-cover" />
      ) : (
        <span className="text-sm text-[var(--text-muted)]">Screenshot / Demo</span>
      )}
    </div>
  )

  const content = (
    <div
      ref={reverse ? refLeft : refRight}
      className={cn(
        'flex-1 flex flex-col gap-6 max-w-lg transition-all duration-700',
        (reverse ? leftVisible : rightVisible) ? 'opacity-100 translate-x-0' : reverse ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8',
      )}
    >
      <h2 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] leading-tight">{heading}</h2>
      <p className="text-[var(--text-muted)] leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        <Button onClick={() => (window.location.href = '/register')}>Get started →</Button>
        <Button variant="ghost">Learn more</Button>
      </div>
    </div>
  )

  return (
    <section className="py-20 px-6">
      <div className={cn('max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-12', reverse && 'lg:flex-row-reverse')}>
        {visual}
        {content}
      </div>
    </section>
  )
}

export default SplitSection
