import { cn } from '@/lib/utils'

export function DiscordIcon() {
  return (
    <svg width="22" height="17" viewBox="0 0 71 55" fill="#fff" aria-hidden>
      <path d="M60.1 4.9A58.5 58.5 0 0045.5 1a40 40 0 00-1.9 3.9 54.1 54.1 0 00-16.2 0A41 41 0 0025.4 1 58.5 58.5 0 0010.9 4.9C1.6 18.8-1 32.4.3 45.8a59 59 0 0018 9.1 44 44 0 003.8-6.2 38.1 38.1 0 01-6-2.9l1.5-1.2c11.5 5.3 24 5.3 35.4 0l1.5 1.2a38.1 38.1 0 01-6 2.9 44 44 0 003.8 6.2 58.8 58.8 0 0018-9.1c1.5-15.6-2.5-29.1-10.2-40.9zM23.7 37.7c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.5 0 6.4 3.2 6.4 7.1 0 3.9-2.9 7.1-6.4 7.1zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1 6.4 3.2 6.4 7.1c0 3.9-2.9 7.1-6.4 7.1z"/>
    </svg>
  )
}

export function TwitchIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 28" fill="#fff" aria-hidden>
      <path d="M2.1 0L0 5.25V24.5h6.3V28h3.5l3.5-3.5h5.25l7-7V0H2.1zm19.6 13.3l-4.2 4.2h-5.25l-3.5 3.5v-3.5H3.5V2.1h18.2v11.2z"/>
      <path d="M9.8 5.95H11.9v6.3H9.8z"/>
      <path d="M15.75 5.95h2.1v6.3h-2.1z"/>
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="currentColor"
      />
    </svg>
  )
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <div className={cn(
      'relative w-9 h-5 rounded-[10px] shrink-0 transition-[background] duration-200 ease cursor-default',
      on ? 'bg-[var(--color-online)]' : 'bg-white/[0.12]',
    )}>
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left] duration-200 ease shadow-[0_1px_3px_rgba(0,0,0,0.35)]',
        on ? 'left-[18px]' : 'left-0.5',
      )} />
    </div>
  )
}
