'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Docs', href: '#', active: true },
  { label: 'API', href: '#api', active: false },
  { label: 'Pricing', href: '/pricing', active: false },
  { label: 'Blog', href: '#blog', active: false },
];

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function Navigation() {
  const router = useRouter();
  const { isLoggedIn, userEmail, user, loginWithKeycloak, registerWithKeycloak, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme ?? 'dark';
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation('landing');
  const hidden = useHideOnScroll();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleNavItem = useCallback((href: string) => {
    closeMobile();
    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(href);
    }
  }, [closeMobile, router]);

  const avatarInitial =
    (user?.nickname?.trim() || user?.userName || userEmail || '?')
      .replace(/^\./, '')
      .charAt(0)
      .toUpperCase() || '?';
  const profileName = user?.nickname?.trim() || user?.userName || userEmail || 'Profile';

  const menuItemClass = cn(
    'font-[family-name:var(--font-ui)] text-[var(--nav-item-color)] text-[0.9rem] font-medium',
    'py-[0.4rem] px-[0.875rem] rounded-[7px] bg-transparent border-none cursor-pointer whitespace-nowrap no-underline',
    'transition-[color,background] duration-[180ms]',
    'hover:text-[var(--nav-item-hover-color)] hover:bg-[var(--nav-item-hover-bg)]',
  );

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-[1000] px-4 md:px-8 h-[60px]',
          'bg-[var(--nav-bg)] [backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)]',
          'border-b border-[var(--nav-border-color)]',
          'transition-transform duration-[350ms] ease-[ease]',
          hidden ? '-translate-y-full' : 'translate-y-0',
        )}
      >
        <div className="max-w-[1400px] h-full mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="inktide"
              className="flex items-center gap-[0.55rem] bg-transparent border-none p-0 flex-shrink-0 cursor-pointer"
            >
              <img
                src="/logo/icon_main_white.svg"
                className="h-7 w-auto object-contain -mt-1 transition-[filter] duration-[250ms]"
                alt=""
                aria-hidden
              />
            </button>
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavItem(item.href)}
                  className={cn(menuItemClass, item.active && '!text-[var(--nav-item-active-color)] !bg-[var(--nav-item-active-bg)]')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-[0.625rem] flex-shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center justify-center w-[34px] h-[34px] bg-transparent border-none rounded-lg text-[var(--nav-theme-btn-color)] cursor-pointer flex-shrink-0 transition-[color,background] duration-[180ms] hover:text-[var(--nav-theme-btn-hover)] hover:bg-[var(--nav-item-hover-bg)]"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  className="flex items-center gap-2 py-[0.4rem] px-[0.875rem] bg-white/[0.08] border border-white/10 rounded-lg text-[var(--nav-login-color)] font-[family-name:var(--font-ui)] text-sm font-medium cursor-pointer transition-[background] duration-[180ms] hover:bg-white/[0.13]"
                  title={userEmail ?? undefined}
                  onClick={() => router.push('/edit/sandbox')}
                >
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-red)] text-xs font-bold text-white overflow-hidden flex-shrink-0"
                    aria-hidden
                  >
                    {user?.pictureUrl ? (
                      <img src={user.pictureUrl} alt="" className="w-full h-full object-cover block" />
                    ) : (
                      avatarInitial
                    )}
                  </span>
                  <span className="text-sm">{t('nav.profile')}</span>
                </button>
                <button
                  type="button"
                  className="py-[0.45rem] px-[1.1rem] bg-transparent border border-[var(--nav-login-border)] rounded-lg text-[var(--nav-login-color)] font-[family-name:var(--font-ui)] text-sm font-medium cursor-pointer whitespace-nowrap transition-[border-color,color] duration-[180ms]"
                  onClick={logout}
                >
                  {t('nav.logOut')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="py-[0.45rem] px-[1.1rem] bg-transparent border border-[var(--nav-login-border)] rounded-lg text-[var(--nav-login-color)] font-[family-name:var(--font-ui)] text-sm font-medium cursor-pointer whitespace-nowrap transition-[border-color,background,color] duration-[180ms] hover:bg-[var(--nav-login-hover-bg)]"
                  onClick={loginWithKeycloak}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="py-[0.45rem] px-[1.1rem] bg-[var(--nav-signup-bg)] border-none rounded-lg text-[var(--nav-signup-color)] font-[family-name:var(--font-ui)] text-sm font-semibold cursor-pointer whitespace-nowrap transition-[background] duration-[180ms] hover:bg-[var(--nav-signup-hover-bg)]"
                  onClick={registerWithKeycloak}
                >
                  Sign up for free
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex lg:hidden flex-col justify-center gap-[5px] w-9 h-9 p-[6px] bg-transparent border-none cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('nav.toggleMenu')}
            aria-expanded={mobileOpen}
          >
            <span className={cn('block w-full h-0.5 bg-[var(--nav-login-color)] rounded-[1px] transition-[transform,opacity] duration-300', mobileOpen && 'translate-y-[7px] rotate-45')} />
            <span className={cn('block w-full h-0.5 bg-[var(--nav-login-color)] rounded-[1px] transition-[transform,opacity] duration-300', mobileOpen && 'opacity-0')} />
            <span className={cn('block w-full h-0.5 bg-[var(--nav-login-color)] rounded-[1px] transition-[transform,opacity] duration-300', mobileOpen && '-translate-y-[7px] -rotate-45')} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/65 [backdrop-filter:blur(4px)] [-webkit-backdrop-filter:blur(4px)] lg:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[1001] w-[300px] max-w-[88vw]',
          'bg-[var(--landing-drawer-bg)] border-l border-white/[0.07]',
          'flex flex-col overflow-y-auto overflow-x-hidden',
          'transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]',
          'lg:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
          <a href="#" onClick={closeMobile} aria-label="inktide" className="flex items-center gap-[0.55rem] no-underline">
            <img src="/logo/icon_main_white.svg" className="h-[22px] w-auto object-contain" alt="" aria-hidden />
            <span className="font-[family-name:var(--font-ui)] text-[1.1rem] font-bold text-white tracking-[-0.3px]">inktide</span>
          </a>
          <button
            type="button"
            onClick={closeMobile}
            aria-label={t('nav.closeMenu')}
            className="flex items-center justify-center w-8 h-8 bg-white/[0.06] border-none rounded-lg cursor-pointer text-white/55 transition-[background,color] duration-200 hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 14 14" className="w-[14px] h-[14px]" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden>
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col p-4 flex-1">
          <span className="font-[family-name:var(--font-ui)] text-[0.7rem] font-semibold tracking-[0.12em] uppercase text-white/[0.22] px-3 pt-2 pb-3">
            {t('nav.navigation')}
          </span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              type="button"
              className="font-[family-name:var(--font-ui)] text-[0.95rem] font-medium text-white/65 py-3 px-[0.875rem] rounded-[10px] bg-transparent border-none text-left cursor-pointer w-full transition-[background,color] duration-[180ms] hover:bg-white/[0.06] hover:text-white"
              onClick={() => handleNavItem(item.href)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-[0.625rem] p-5 border-t border-white/[0.06] flex-shrink-0">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 py-3 px-4 bg-white/[0.04] border border-white/[0.07] rounded-xl mb-1">
                <span className="w-[34px] h-[34px] rounded-full bg-[var(--accent-red)] flex items-center justify-center font-[family-name:var(--font-ui)] text-[0.85rem] font-bold text-white flex-shrink-0 overflow-hidden">
                  {user?.pictureUrl ? (
                    <img src={user.pictureUrl} alt="" className="w-full h-full object-cover block" />
                  ) : (
                    avatarInitial
                  )}
                </span>
                <span className="font-[family-name:var(--font-ui)] text-[0.9rem] font-semibold text-[var(--text-primary)]">
                  {profileName}
                </span>
              </div>
              <button
                type="button"
                className="w-full py-[0.8rem] px-5 bg-[var(--landing-mobile-primary-btn-bg)] border-none rounded-[10px] text-[var(--landing-mobile-primary-btn-text)] font-[family-name:var(--font-ui)] text-[0.925rem] font-semibold cursor-pointer transition-[background] duration-[180ms] hover:bg-[var(--landing-mobile-primary-btn-hover-bg)]"
                onClick={() => { closeMobile(); router.push('/edit/sandbox'); }}
              >
                {t('nav.goToProfile')}
              </button>
              <button
                type="button"
                className="w-full py-[0.8rem] px-5 bg-transparent border border-white/[0.18] rounded-[10px] text-white/70 font-[family-name:var(--font-ui)] text-[0.925rem] font-medium cursor-pointer transition-[border-color,color] duration-[180ms] hover:border-white/[0.35] hover:text-white"
                onClick={() => { closeMobile(); logout(); }}
              >
                {t('nav.logOut')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="w-full py-[0.8rem] px-5 bg-[var(--landing-mobile-primary-btn-bg)] border-none rounded-[10px] text-[var(--landing-mobile-primary-btn-text)] font-[family-name:var(--font-ui)] text-[0.925rem] font-semibold cursor-pointer transition-[background] duration-[180ms] hover:bg-[var(--landing-mobile-primary-btn-hover-bg)]"
                onClick={() => { closeMobile(); registerWithKeycloak(); }}
              >
                Sign up for free
              </button>
              <button
                type="button"
                className="w-full py-[0.8rem] px-5 bg-transparent border border-white/[0.18] rounded-[10px] text-white/70 font-[family-name:var(--font-ui)] text-[0.925rem] font-medium cursor-pointer transition-[border-color,color] duration-[180ms] hover:border-white/[0.35] hover:text-white"
                onClick={() => { closeMobile(); loginWithKeycloak(); }}
              >
                Log in
              </button>
            </>
          )}
        </div>

        <div className="px-6 py-[0.875rem] border-t border-white/[0.04] flex-shrink-0">
          <span className="font-[family-name:var(--font-mono)] text-[0.7rem] text-white/[0.18] tracking-[0.05em]">
            INKTIDE © 2026
          </span>
        </div>
      </div>
    </>
  );
}
