import type { ReactNode } from 'react'
import { AlertTriangle, Info, Lightbulb } from 'lucide-react'
import sanitizeHtml from 'sanitize-html'
import { codeToHtml } from 'shiki'
import { CopyButton } from './copy-button'

const SHIKI_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['pre', 'code', 'span'],
  allowedAttributes: {
    pre:  ['class', 'style', 'tabindex'],
    code: ['class', 'style'],
    span: ['class', 'style'],
  },
}


export function DocPage({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1300px] px-6 py-8">{children}</div>
    </div>
  )
}


export function PageTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold text-[var(--text-tertiary)]">{eyebrow}</p>
      )}
      <h1 className="home-heading-font text-[2.75rem] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--text-primary)]">
        {children}
      </h1>
    </div>
  )
}

export function PageSubtitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-10 text-[1.125rem] leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  )
}


function slugify(node: ReactNode): string {
  return String(node)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

export function SectionHeading({ children }: { children: ReactNode }) {
  const id = slugify(children)
  return (
    <h2
      id={id}
      className="group relative mt-14 mb-4 flex items-center home-heading-font text-[1.625rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]"
    >
      <a
        href={`#${id}`}
        className="absolute -left-5 opacity-0 transition-opacity group-hover:opacity-100 text-[var(--text-tertiary)] select-none"
        aria-hidden
      >
        #
      </a>
      {children}
    </h2>
  )
}

export function SubHeading({ children }: { children: ReactNode }) {
  const id = slugify(children)
  return (
    <h3
      id={id}
      className="group relative mt-8 mb-3 flex items-center text-[1.125rem] font-semibold text-[var(--text-primary)]"
    >
      <a
        href={`#${id}`}
        className="absolute -left-4 opacity-0 transition-opacity group-hover:opacity-100 text-[var(--text-tertiary)] text-sm select-none"
        aria-hidden
      >
        #
      </a>
      {children}
    </h3>
  )
}


export function Prose({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">{children}</p>
  )
}

export function SectionDivider() {
  return (
    <div className="my-16 h-px bg-gradient-to-r from-[var(--border-subtle)] via-[var(--border-subtle)] to-transparent" />
  )
}


function inferLang(label?: string): string {
  if (!label) return 'typescript'
  const l = label.toLowerCase()
  if (l.includes('.tsx')) return 'tsx'
  if (l.includes('.ts') || l.includes('typescript')) return 'typescript'
  if (l.includes('bash') || l.includes('shell') || l.includes('docker') || l.includes('.env') || l.includes('npm')) return 'bash'
  if (l.includes('json')) return 'json'
  if (l.includes('http') || l.includes('curl')) return 'http'
  if (l.includes('css')) return 'css'
  if (l.includes('sql')) return 'sql'
  return 'typescript'
}

export async function CodeBlock({ children, label, lang }: { children: string; label?: string; lang?: string }) {
  const resolvedLang = lang ?? inferLang(label)
  let html: string
  try {
    html = await codeToHtml(children.trim(), {
      lang: resolvedLang,
      theme: 'github-dark',
      colorReplacements: { '#24292e': 'transparent' },
    })
  } catch {
    html = await codeToHtml(children.trim(), { lang: 'text', theme: 'github-dark', colorReplacements: { '#24292e': 'transparent' } })
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2">
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{label ?? resolvedLang}</span>
        <CopyButton text={children.trim()} />
      </div>
      <div
        className="overflow-x-auto bg-[var(--bg-0)] [&>pre]:px-5 [&>pre]:py-4 [&>pre]:text-[13px] [&>pre]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html, SHIKI_SANITIZE_OPTIONS) }}
      />
    </div>
  )
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-1.5 py-0.5 font-mono text-[0.8125rem] text-[var(--text-secondary)]">
      {children}
    </code>
  )
}


export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
        {cols.map(c => (
          <th key={c} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-[var(--border-subtle)] last:border-0 transition-colors hover:bg-[var(--surface-1)]">{children}</tr>
}

export function Td({ children, mono, accent }: { children: ReactNode; mono?: boolean; accent?: boolean }) {
  return (
    <td className={`px-4 py-3 ${mono ? 'font-mono text-xs' : 'text-sm'} ${accent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
      {children}
    </td>
  )
}

export function TdBold({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">{children}</td>
}

export function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    POST:   'bg-green-500/10 text-green-400 border border-green-500/20',
    PUT:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    PATCH:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border border-red-500/20',
  }
  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${styles[method] ?? ''}`}>
      {method}
    </span>
  )
}


const INFO_VARIANTS = {
  info: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    leftBorder: '[border-left-color:#3b82f6]',
    icon: Info,
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-400',
    defaultLabel: 'Note',
  },
  tip: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    leftBorder: '[border-left-color:#10b981]',
    icon: Lightbulb,
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-400',
    defaultLabel: 'Tip',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    leftBorder: '[border-left-color:#f59e0b]',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-400',
    defaultLabel: 'Warning',
  },
}

export function InfoBox({ children, variant = 'info', title }: {
  children: ReactNode
  variant?: 'info' | 'tip' | 'warning'
  title?: string
}) {
  const v = INFO_VARIANTS[variant]
  const Icon = v.icon
  const label = title ?? v.defaultLabel
  return (
    <div className={`my-6 rounded-xl border px-5 py-4 [border-left-width:3px] ${v.border} ${v.bg} ${v.leftBorder}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={13} className={`shrink-0 ${v.iconColor}`} />
        <span className={`text-xs font-bold ${v.titleColor}`}>{label}</span>
      </div>
      <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
    </div>
  )
}


export function Step({ n, title, desc, children }: {
  n: number
  title: string
  desc?: string
  children?: ReactNode
}) {
  return (
    <div className="relative mb-8 pl-11">
      <div className="absolute left-[13px] top-8 h-[calc(100%-8px)] w-px bg-[var(--border-subtle)]" />
      <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-1)] font-mono text-xs font-semibold ring-1 ring-[var(--border-default)] text-[var(--text-primary)]">
        {n}
      </div>
      <p className="mb-1 pt-0.5 text-[0.9375rem] font-bold text-[var(--text-primary)]">{title}</p>
      {desc && <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>}
      {children}
    </div>
  )
}

export function SubStep({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] font-mono text-xs font-medium text-[var(--text-secondary)]">
        {n}
      </span>
      <span className="text-sm text-[var(--text-secondary)]">{children}</span>
    </li>
  )
}


export interface NextStep {
  href: string
  icon: ReactNode
  title: string
  description: string
}

export function NextStepsGrid({ items }: { items: NextStep[] }) {
  return (
    <div className="mt-16 border-t border-[var(--border-subtle)] pt-10">
      <h2 className="home-heading-font mb-6 text-[1.375rem] font-bold text-[var(--text-primary)]">
        Next steps
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(item => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] p-5 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-1)]"
          >
            <span className="text-[var(--accent-primary)]">{item.icon}</span>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{item.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
