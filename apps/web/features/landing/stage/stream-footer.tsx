'use client'

import type { CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Rewind } from 'lucide-react'
import { DEVELOPER_ROUTE, PRICING_ROUTE, REGISTER_ROUTE } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { Timecode, digits, display, hatch, mono, ribbonStrip } from './broadcast'

// The end of the stream, in three layers like the ZZZ footer: the accounts in a row under
// the ribbon's END mark (with a REWIND tab, the site's "back to top"), one call to action
// next to a streamer's "thanks for watching", and the fine print centred on black.

const EMAIL = 'hello@inktide.ai'

type Social = { label: string; href: string; icon: ReactNode }

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-full">
    <path d={d} />
  </svg>
)

// Same accounts as the main landing footer.
export const SOCIALS: Social[] = [
  {
    label: 'Discord',
    href: 'https://discord.gg/inktide',
    icon: icon(
      'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z',
    ),
  },
  {
    label: 'Telegram',
    href: 'https://t.me/inktide',
    icon: icon(
      'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
    ),
  },
  {
    label: 'VK',
    href: 'https://vk.com/inktide',
    icon: icon(
      'M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.576c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z',
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/inktide-ai/inktide',
    icon: icon(
      'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z',
    ),
  },
]

// Privacy and Terms point at pages that don't exist yet.
const LINKS = [
  { label: 'Pricing', href: PRICING_ROUTE },
  { label: 'Docs', href: DEVELOPER_ROUTE },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

const CREDITS = [
  { role: 'Starring', name: 'Quackie' },
  { role: 'Chat', name: 'You' },
]

const flat = { ...display, textShadow: 'none' }

/** Quackie signing off: the waving ChatGPT still, cut flat at the bottom to stand on the seam. */
const HOST = { src: '/images/landing/footer/quackie-bye.png', w: 1207, h: 1160 }

export default function StreamFooter() {
  return (
    <footer
      // Stage units, as in the scenes: sizes follow the height on screens wider than 16:9.
      style={{ '--u': 'min(1vw, 1.7778svh)' } as CSSProperties}
      className="relative isolate overflow-x-clip bg-[#0B0D12] text-[var(--q-cream)]"
    >
      {/* The ribbon closes over the seam, hiding wherever the scene above is cut off. */}
      <div aria-hidden style={ribbonStrip} className="absolute inset-x-0 top-0 z-20 h-[46px] -translate-y-1/2">
        <span
          style={digits}
          className="absolute right-[18%] top-1/2 flex h-[58px] -translate-y-1/2 items-center gap-2.5 rounded-[10px] bg-[var(--q-duck)] px-4 text-[30px] text-[var(--q-bg)]"
        >
          <span className="size-[18px] rounded-[3px] bg-[var(--q-bg)]" />
          END
        </span>
      </div>

      <Rewinder />

      {/* Layer 1: the accounts, big, like the row under the ZZZ nav. */}
      <div className="flex items-center justify-end gap-7 border-b border-[rgb(255_248_231/0.08)] px-6 pb-7 pt-24 sm:gap-10 sm:px-[6.5vw] lg:pt-14">
        {SOCIALS.map(s => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="size-8 text-[rgb(255_248_231/0.45)] transition-[color,transform] duration-200 hover:-translate-y-0.5 hover:text-[var(--q-duck)] sm:size-9"
          >
            {s.icon}
          </a>
        ))}
      </div>

      {/* Layer 2: the streamer's sign-off and the one thing to do next, on a last slab of road. */}
      <div className="relative grid gap-12 px-6 py-16 sm:px-[6.5vw] lg:grid-cols-[1fr_auto] lg:items-end lg:gap-[3vw] lg:py-[calc(var(--u)*7)]">
        <div
          aria-hidden
          style={hatch}
          className="pointer-events-none absolute -left-[14%] bottom-[8%] top-[12%] -z-10 hidden w-[66%] -skew-x-[22.8deg] rounded-[44px] lg:block"
        />
        <div>
          <h2 style={display} className="text-[clamp(56px,9vw,150px)] uppercase lg:text-[calc(var(--u)*9)]">
            Thanks for
            <br />
            <span className="text-[var(--q-duck)]">watching.</span>
          </h2>
          <p className={cn(mono, 'mt-7 flex items-center gap-3 text-[13px] tracking-[0.14em] text-[var(--q-cream-dim)]')}>
            <span className="size-2.5 rounded-full bg-[var(--q-red)]" />
            YOU WATCHED
            <span className="text-[16px] tracking-[0.06em] text-[var(--q-cream)]">
              <Timecode />
            </span>
          </p>
        </div>

        <div className="flex flex-col items-start gap-5 lg:mr-[calc(var(--u)*26)] lg:items-end lg:pb-3">
          <p style={flat} className="text-[clamp(28px,2.6vw,40px)] uppercase lg:text-right">
            Your turn to
            <br />
            go live.
          </p>
          <Link
            href={REGISTER_ROUTE}
            className={cn(
              mono,
              'inline-flex w-full items-center justify-center gap-3 rounded-full bg-[var(--q-duck)] px-8 py-4 text-[16px] font-semibold text-[#1A1300] sm:w-auto',
              'transition-transform duration-200 hover:-translate-y-0.5',
            )}
          >
            <span className="size-2 rounded-full bg-[#1A1300]" />
            Go live
          </Link>
          {/* On desktop the links drop to their own line, so this column stays narrow. */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-[var(--q-cream-dim)] lg:flex-col lg:items-end">
            <span>or hang out with us on</span>
            <span className="flex items-center gap-2">
              {[SOCIALS[0], SOCIALS[1]].map((s, i) => (
                <span key={s.label} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden>·</span>}
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--q-cream)] underline decoration-[rgb(255_248_231/0.3)] underline-offset-4 transition-colors hover:decoration-[var(--q-duck)]"
                  >
                    <span className="size-4">{s.icon}</span>
                    {s.label}
                  </a>
                </span>
              ))}
            </span>
          </p>
        </div>

        {/* The host signs off, standing on the seam on its own yellow plate, like in the scenes. */}
        <div className="relative mx-auto -mb-16 w-[min(78vw,320px)] lg:absolute lg:bottom-0 lg:right-[4vw] lg:m-0 lg:w-[calc(var(--u)*25)]">
          <div
            aria-hidden
            className="absolute inset-x-[10%] bottom-0 top-[24%] -z-10 -skew-x-[22.8deg] rounded-t-[36px] bg-[var(--q-duck)]"
          />
          <Image
            src={HOST.src}
            alt="Quackie waving goodbye"
            width={HOST.w}
            height={HOST.h}
            sizes="(min-width: 1024px) 25vw, 78vw"
            className="relative h-auto w-full [filter:drop-shadow(-10px_6px_0_var(--q-bg))]"
          />
        </div>
      </div>

      {/* Layer 3: the fine print, centred on black. */}
      <div className="bg-black px-6 pb-12 pt-14 text-center sm:px-[6.5vw]">
        <div className="flex flex-col items-center gap-7">
          <Image
            src="/logo/quackie/quackie-logo-dark.svg"
            alt="Quackie"
            width={1890}
            height={344}
            unoptimized
            className="h-8 w-auto"
          />

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[15px] text-[var(--q-cream-dim)]">
            {LINKS.map(l => (
              <Link key={l.label} href={l.href} className="transition-colors hover:text-[var(--q-cream)]">
                {l.label}
              </Link>
            ))}
            <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-[var(--q-cream)]">
              {EMAIL}
            </a>
          </nav>

          {/* The end credits, rolled into one line. */}
          <dl className={cn(mono, 'flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em]')}>
            {CREDITS.map(c => (
              <div key={c.role} className="flex gap-2">
                <dt className="text-[rgb(255_248_231/0.4)]">{c.role}</dt>
                <dd className="text-[var(--q-cream)]">{c.name}</dd>
              </div>
            ))}
          </dl>

          <p className="text-[13px] text-[rgb(255_248_231/0.4)]">© {new Date().getFullYear()} Quackie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

/** Back to the top, as a tab hanging off the ribbon — rewinding the stream to 00. */
function Rewinder() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'group absolute left-6 top-[23px] z-10 flex w-[96px] flex-col items-center gap-1 rounded-b-[22px] bg-[var(--q-cream)] pb-3.5 pt-4 text-[var(--q-bg)] sm:left-[6.5vw] sm:w-[112px]',
        'transition-[padding] duration-200 hover:pt-6',
      )}
    >
      <Rewind className="size-8 transition-transform duration-200 group-hover:-translate-x-1" strokeWidth={2.4} />
      <span style={flat} className="text-[22px] uppercase">
        Rewind
      </span>
    </button>
  )
}
