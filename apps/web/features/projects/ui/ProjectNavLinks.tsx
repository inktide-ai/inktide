'use client'
import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Overview',  href: ''           },
  { label: 'Character', href: '/character' },
  { label: 'Scene',      href: '/scene'      },
  { label: 'Background', href: '/background' },
  { label: 'Channels',  href: '/channels'  },
  { label: 'Emotion',   href: '/emotion'   },
  { label: 'Skills',    href: '/skills'    },
  { label: 'Plugins',   href: '/plugins'   },
  { label: 'Memory',    href: '/memory'    },
  { label: 'Sandbox',   href: '/sandbox',  buildHref: (pid: string) => `/edit/sandbox?projectId=${pid}` },
  { label: 'OBS',       href: '/obs'       },
  { label: 'Settings',  href: '/settings'  },
] satisfies { label: string; href: string; buildHref?: (pid: string) => string }[]

interface Props {
  base: string
  projectId: string
  pathname: string
}

export function ProjectNavLinks({ base, projectId, pathname }: Props) {
  return (
    <>
      {NAV_ITEMS.map(({ label, href, buildHref }) => {
        const to = buildHref ? buildHref(projectId) : `${base}${href}`
        const active = buildHref
          ? pathname.startsWith('/edit/sandbox')
          : href === '' ? pathname === base : pathname.startsWith(`${base}${href}`)
        return (
          <Link
            key={label}
            href={to}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
