import { getTranslations } from '@/lib/i18n-server'
import { getServerUser } from '@/lib/auth-server'
import { NavigationScrollShell } from './navigation-scroll-shell'
import NavigationActions from './navigation-actions'
import type { NavItem } from './navigation-actions'
import { cn } from '@/lib/utils'

const menuItemClass = cn(
  'relative inline-flex items-center',
  'font-[family-name:var(--font-ui)] text-[var(--nav-item-color)] text-[0.9rem] font-medium',
  'py-[0.4rem] px-[0.875rem] rounded-[7px] no-underline whitespace-nowrap',
  'transition-[color,background] duration-[180ms]',
  'hover:text-[var(--nav-item-hover-color)] hover:bg-[var(--nav-item-hover-bg)]',
)

export default async function Navigation() {
  const t = await getTranslations('landing')
  const serverUser = await getServerUser()

  const navItems: NavItem[] = [
    { label: t('nav.itemPreview'), href: '#',        active: true  },
    { label: t('nav.itemPricing'), href: '#pricing', active: false },
    { label: 'Следите за нами',    href: '#follow',  active: false },
  ]

  return (
    <NavigationScrollShell>
      <div className="max-w-[1400px] h-full mx-auto flex items-center justify-between gap-8">

        <div className="flex items-center gap-3">
          <a
            href="/"
            aria-label="inktide"
            className="flex items-center gap-[0.55rem] no-underline flex-shrink-0"
          >
            <img src="/logo/icon_main_white.svg" className="logo-dark  h-7 w-auto object-contain -mt-1" alt="" aria-hidden />
            <img src="/logo/icon_main.svg"       className="logo-light h-7 w-auto object-contain -mt-1" alt="" aria-hidden />
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(menuItemClass, item.active && '!text-[var(--nav-item-active-color)]')}
              >
                {item.label}
                <span
                  aria-hidden
                  className={cn(
                    'absolute bottom-0 left-3 right-3 h-[2px] rounded-full',
                    'origin-center transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                    item.active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0',
                  )}
                  style={{ backgroundColor: 'var(--nav-item-active-indicator)', boxShadow: '0 0 8px color-mix(in srgb, var(--nav-item-active-indicator) 32%, transparent)' }}
                />
              </a>
            ))}
          </div>
        </div>

        <NavigationActions
          navItems={navItems}
          isLoggedIn={!!serverUser}
          userName={serverUser?.name ?? null}
          userPicture={serverUser?.picture ?? null}
        />

      </div>
    </NavigationScrollShell>
  )
}
