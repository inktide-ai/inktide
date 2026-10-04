'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { digits, palette } from './broadcast'
import ClipsScene from './clips-scene'
import CustomizeScene from './customize-scene'
import ListenScene from './listen-scene'
import RememberScene from './remember-scene'
import StartingSoonScene from './starting-soon-scene'
import StreamFooter from './stream-footer'
import StreamHeader from './stream-header'
import Track from './track'

// The landing as one ordinary scrolling page: the scenes stack over a single
// background track, a header is pinned on top, and a pager on the right edge says
// which chapter is on screen.

export default function StreamPage() {
  const ref = useRef<HTMLDivElement>(null)
  const chapter = useChapter(ref)
  const [onAir, setOnAir] = useState(false)

  // When a scroll comes to rest near the top of a scene, the page settles onto it.
  // Proximity only: it never takes the wheel, and scenes opt in on desktop alone.
  // The app's global `overflow-x: hidden` makes <body> a scroll container of its own,
  // which would claim the scenes' snap points; `clip` crops the same without that.
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const overflowX = body.style.overflowX
    root.classList.add('snap-y', 'snap-proximity')
    body.style.overflowX = 'clip'
    return () => {
      root.classList.remove('snap-y', 'snap-proximity')
      body.style.overflowX = overflowX
    }
  }, [])

  return (
    <div ref={ref} style={palette} className="relative isolate overflow-clip bg-[var(--q-bg)]">
      <Track />
      <StreamHeader
        chapter={chapter.chapters[chapter.index]}
        onAir={onAir}
        onJump={c => chapter.goTo(chapter.chapters.indexOf(c))}
      />
      <StartingSoonScene onLiveChange={setOnAir} />
      <ListenScene />
      <RememberScene />
      <ClipsScene />
      <CustomizeScene />
      <StreamFooter />
      <SidePager {...chapter} />
    </div>
  )
}

/** The chapter whose section holds the middle of the viewport. Chapters keep the
 *  numbers their scenes carry, so the pager skips any that aren't built yet. */
function useChapter(container: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<{ index: number; chapters: string[] }>({ index: 0, chapters: [] })

  useEffect(() => {
    const root = container.current
    if (!root) return
    const update = () => {
      const sections = [...root.querySelectorAll<HTMLElement>('[data-chapter]')]
      const middle = window.innerHeight / 2
      const index = sections.filter(s => s.getBoundingClientRect().top <= middle).length - 1
      setState({ index: Math.max(index, 0), chapters: sections.map(s => s.dataset.chapter ?? '') })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [container])

  const goTo = (i: number) => {
    const sections = container.current?.querySelectorAll<HTMLElement>('[data-chapter]')
    sections?.[i]?.scrollIntoView({ behavior: 'smooth' })
  }

  return { ...state, goTo }
}

function SidePager({ index, chapters, goTo }: ReturnType<typeof useChapter>) {
  const count = chapters.length
  if (!count) return null
  const arrow = 'grid size-8 place-items-center text-[var(--q-cream)] transition-colors hover:text-[var(--q-duck)] disabled:opacity-25'

  return (
    <nav
      aria-label="Chapters"
      className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-l-2xl bg-[#0B0D12] py-3 pl-2.5 pr-2 ring-1 ring-[rgb(255_248_231/0.12)] lg:flex"
    >
      <button type="button" aria-label="Previous chapter" disabled={index === 0} onClick={() => goTo(index - 1)} className={arrow}>
        <ChevronUp className="size-5" />
      </button>
      <span style={digits} aria-current="step" className="text-[22px] text-[var(--q-duck)]">
        {chapters[index]}
      </span>
      <button
        type="button"
        aria-label="Next chapter"
        disabled={index === count - 1}
        onClick={() => goTo(index + 1)}
        className={arrow}
      >
        <ChevronDown className="size-5" />
      </button>
      <span style={digits} className={cn('text-[13px] text-[rgb(255_248_231/0.4)]', index === count - 1 && 'invisible')}>
        {chapters[index + 1]}
      </span>
    </nav>
  )
}
