'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  { key: 'overview',   href: ''           },
  { key: 'character',  href: '/character' },
  { key: 'scene',      href: '/scene'      },
  { key: 'background', href: '/background' },
  { key: 'channels',   href: '/channels'  },
  { key: 'emotion',    href: '/emotion'   },
  { key: 'skills',     href: '/skills'    },
  { key: 'plugins',    href: '/plugins'   },
  { key: 'memory',     href: '/memory'    },
  { key: 'sandbox',    href: '/sandbox',  buildHref: (pid: string) => `/edit/sandbox?projectId=${pid}` },
  { key: 'obs',        href: '/obs'       },
  { key: 'settings',   href: '/settings'  },
] satisfies { key: string; href: string; buildHref?: (pid: string) => string }[]

interface Props {
  base: string
  projectId: string
  pathname: string
}

export function ProjectNavLinks({ base, projectId, pathname }: Props) {
  const { t } = useTranslation('common')
  return (
    <>
      {NAV_ITEMS.map(({ key, href, buildHref }) => {
        const to = buildHref ? buildHref(projectId) : `${base}${href}`
        const active = buildHref
          ? pathname.startsWith('/edit/sandbox')
          : href === '' ? pathname === base : pathname.startsWith(`${base}${href}`)
        return (
          <Link
            key={key}
            href={to}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t(`projectDetail.tabs.${key}`)}
          </Link>
        )
      })}
    </>
  )
}
