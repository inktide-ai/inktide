'use client'

import type { ProjectListItem } from '@/entities/project/api'
import { useProjectExport } from './hooks/useProjectExport'

function MenuDivider() {
  return <div className="mx-3 my-0.5 h-px bg-[var(--menu-divider)]" />
}

interface SaveProjectMenuProps {
  open: boolean
  onClose: () => void
  projects: ProjectListItem[]
  panel: 'workspace' | 'profile'
}

export function SaveProjectMenu({ open, onClose, projects, panel }: SaveProjectMenuProps) {
  const { exportAndDownload, exportingId } = useProjectExport()

  if (!open) return null

  const panelPositionClass = panel === 'workspace' ? 'left-0 right-0' : 'left-3 right-3'

  async function handleExport(project: ProjectListItem) {
    onClose()
    await exportAndDownload(project.id, project.name)
  }

  return (
    <>
      <div className="fixed inset-0 z-[98]" onClick={onClose} aria-hidden />
      <div
        className={`absolute top-full z-[99] mt-1.5 overflow-hidden rounded-2xl ${panelPositionClass}`}
        style={{
          background: 'var(--menu-panel-bg)',
          boxShadow: 'var(--menu-panel-shadow)',
          animation: 'sidebarMenuIn 0.16s cubic-bezier(0.2,0.9,0.2,1)',
        }}
        role="menu"
        aria-label="Save project"
      >
        <div className="px-3 pt-3 pb-2">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.07em]">
            Выберите проект
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="px-4 py-3 text-body text-[var(--text-tertiary)]">
            Нет проектов для сохранения
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
            {projects.map(project => {
              const isLoading = exportingId === project.id
              const soul = project.active_soul
              return (
                <button
                  key={project.id}
                  type="button"
                  role="menuitem"
                  disabled={isLoading}
                  onClick={() => handleExport(project)}
                  className="flex w-full items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-[7px] text-left text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                >
                  {/* Soul avatar or project icon */}
                  <span className="h-[18px] w-[18px] flex-shrink-0 overflow-hidden rounded-[3px]">
                    {soul?.avatar_url ? (
                      <img
                        src={soul.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center rounded-[3px] bg-[var(--surface-3)] text-[8px] font-bold text-[var(--text-tertiary)]">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <span className="flex-1 truncate">{project.name}</span>

                  {isLoading ? (
                    <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-[var(--text-tertiary)] border-t-transparent" />
                  ) : (
                    <span className="flex-shrink-0 text-body text-[var(--text-tertiary)]">.inkt</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <MenuDivider />

        <div className="px-3 py-2">
          <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
            Файл .inkt содержит конфигурацию проекта и персонажа
          </p>
        </div>
      </div>
      <style>{`@keyframes sidebarMenuIn{from{opacity:0;transform:translateY(-6px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </>
  )
}
