import { cn } from '@/lib/utils'
import { getBannerGradient } from '@/components/profile/banner-presets'

interface SidebarProjectItemProps {
  name: string
  slug: string
  avatarUrl?: string | null
  accentColor: string
  bannerIdx?: number
  isSelected?: boolean
  isActive?: boolean
  onClick: () => void
  className?: string
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,6}$/

export function SidebarProjectItem({
  name, slug, avatarUrl, accentColor, bannerIdx = 0,
  isSelected, isActive, onClick, className,
}: SidebarProjectItemProps) {
  const safeAccent = HEX_COLOR_RE.test(accentColor) ? accentColor : '#6b7280'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-left transition-colors w-full',
        isSelected
          ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
          : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-secondary)]',
        className,
      )}
    >
      <div className="relative flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden"
          style={avatarUrl ? undefined : { background: getBannerGradient(bannerIdx) }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : name.charAt(0)}
        </div>
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px] border-[var(--sidebar-bg)] bg-green-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-xs font-medium">{name}</span>
          <span
            className="flex-shrink-0 text-[10px] px-1.5 py-px rounded"
            style={{ background: `${safeAccent}20`, color: safeAccent }}
          >
            bot
          </span>
        </div>
        <div className="text-[14px] truncate opacity-60">/{slug}</div>
      </div>
    </button>
  )
}
