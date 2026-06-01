'use client'
import { cn } from '@/lib/utils'

const TAG_CLASSES: Record<string, string> = {
  'Синтвейв':    'text-violet-400  bg-violet-400/10  border-violet-400/35',
  'Природа':     'text-green-400   bg-green-400/10   border-green-400/35',
  'Городской':   'text-sky-400     bg-sky-400/10     border-sky-400/35',
  'Sci-Fi':      'text-indigo-400  bg-indigo-400/10  border-indigo-400/35',
  'Аниме':       'text-pink-400    bg-pink-400/10    border-pink-400/35',
  'Фэнтези':     'text-orange-400  bg-orange-400/10  border-orange-400/35',
  'Приключение': 'text-lime-400    bg-lime-400/10    border-lime-400/35',
  'Экшн':        'text-red-400     bg-red-400/10     border-red-400/35',
  'Уютная':      'text-amber-400   bg-amber-400/10   border-amber-400/35',
}

export interface PresetScene {
  id: string
  name: string
  tagName: string
  description: string
  charGradient: string
  imagePath?: string
}

export const PRESET_SCENES: PresetScene[] = [
  {
    id: 'preset-synthwave',
    name: 'Неоновый балкон',
    tagName: 'Синтвейв',
    description: 'Ночной мегаполис с балкона: неон, огни и city-vibes синтвейва',
    charGradient: 'linear-gradient(180deg,rgba(139,92,246,.18),rgba(139,92,246,.04))',
    imagePath: '/scenes/scene-synthwave.jpg',
  },
  {
    id: 'preset-nature',
    name: 'Город в джунглях',
    tagName: 'Природа',
    description: 'Брошенный город, поглощённый природой: гигантские деревья и туман',
    charGradient: 'linear-gradient(180deg,rgba(74,222,128,.14),rgba(74,222,128,.03))',
    imagePath: '/scenes/scene-nature.jpg',
  },
  {
    id: 'preset-urban',
    name: 'Ночная терраса',
    tagName: 'Городской',
    description: 'Панорама ночного мегаполиса с крыши: огни, дождь и тишина',
    charGradient: 'linear-gradient(180deg,rgba(56,189,248,.14),rgba(56,189,248,.03))',
    imagePath: '/scenes/scene-urban.jpg',
  },
  {
    id: 'preset-scifi',
    name: 'Колония на Марсе',
    tagName: 'Sci-Fi',
    description: 'Марсианская ночь: красные скалы, купола колонии и звёздное небо',
    charGradient: 'linear-gradient(180deg,rgba(99,102,241,.15),rgba(99,102,241,.04))',
    imagePath: '/scenes/scene-scifi.jpg',
  },
  {
    id: 'preset-anime-sakura',
    name: 'Цветение сакуры',
    tagName: 'Аниме',
    description: 'Японский сад в цвету: сакура, тории и мягкий весенний свет',
    charGradient: 'linear-gradient(180deg,rgba(244,114,182,.16),rgba(244,114,182,.04))',
    imagePath: '/scenes/scene-anime-sakura.jpg',
  },
  {
    id: 'preset-anime-bamboo',
    name: 'Бамбуковая ночь',
    tagName: 'Аниме',
    description: 'Густой бамбуковый лес ночью: лунный свет сквозь стебли',
    charGradient: 'linear-gradient(180deg,rgba(74,222,128,.12),rgba(244,114,182,.04))',
    imagePath: '/scenes/scene-anime-bamboo.jpg',
  },
  {
    id: 'preset-fantasy-islands',
    name: 'Летящие острова',
    tagName: 'Фэнтези',
    description: 'Парящие над облаками острова с древними руинами и каскадами',
    charGradient: 'linear-gradient(180deg,rgba(251,146,60,.14),rgba(251,146,60,.03))',
    imagePath: '/scenes/scene-fantasy-islands.jpg',
  },
  {
    id: 'preset-fantasy-tavern',
    name: 'Таверна у огня',
    tagName: 'Фэнтези',
    description: 'Средневековая таверна: камин, дубовые балки и аромат эля',
    charGradient: 'linear-gradient(180deg,rgba(251,146,60,.16),rgba(251,191,36,.04))',
    imagePath: '/scenes/scene-fantasy-tavern.jpg',
  },
  {
    id: 'preset-adventure',
    name: 'Затопленный город',
    tagName: 'Приключение',
    description: 'Подводный древний город: биолюминесцентные водоросли и тайны глубин',
    charGradient: 'linear-gradient(180deg,rgba(163,230,53,.13),rgba(163,230,53,.03))',
    imagePath: '/scenes/scene-adventure.jpg',
  },
  {
    id: 'preset-action',
    name: 'Подземный мегаполис',
    tagName: 'Экшн',
    description: 'Подземный город, вырубленный в скале: индустриальный, опасный, живой',
    charGradient: 'linear-gradient(180deg,rgba(239,68,68,.15),rgba(239,68,68,.04))',
    imagePath: '/scenes/scene-action.jpg',
  },
  {
    id: 'preset-cozy',
    name: 'Уютная библиотека',
    tagName: 'Уютная',
    description: 'Ночная библиотека с высокими полками, тёплой лампой и запахом книг',
    charGradient: 'linear-gradient(180deg,rgba(251,191,36,.14),rgba(251,191,36,.03))',
    imagePath: '/scenes/scene-cozy.jpg',
  },
]

interface PresetSceneCardProps {
  preset: PresetScene
  animationDelay?: number
}

export function PresetSceneCard({ preset, animationDelay = 0 }: PresetSceneCardProps) {
  const tagClass = TAG_CLASSES[preset.tagName] ?? TAG_CLASSES['Синтвейв']!

  return (
    <div
      className="group relative bg-(--bg-card) border border-(--bg-card) rounded-[0.875rem] overflow-hidden flex flex-col min-h-[188px] transition-[border-color,transform,box-shadow,background,opacity] duration-[180ms] select-none outline-none opacity-0 animate-[cardIn_0.32s_cubic-bezier(0.2,0.9,0.2,1)_forwards] hover:border-white/20"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="relative h-[124px] overflow-hidden shrink-0">
        {preset.imagePath ? (
          <>
            <img
              src={preset.imagePath}
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 pointer-events-none z-[1]" />
          </>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 h-9 z-[2] bg-[linear-gradient(transparent,var(--bg-card))] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[3]">
          <div className="w-[26px] h-[62px] rounded-[13px_13px_0_0] border border-white/[0.08] border-b-0 relative" style={{ background: preset.charGradient }} />
        </div>
      </div>

      <div className="flex flex-col flex-1 p-[0.625rem_0.875rem_0.75rem]">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-body font-semibold text-(--text-primary) leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0" title={preset.name}>{preset.name}</div>
          <span className={cn('text-caption font-semibold tracking-[0.03em] uppercase py-[2px] px-[6px] rounded-[4px] shrink-0 whitespace-nowrap border', tagClass)}>{preset.tagName}</span>
        </div>
        <div className="text-caption text-(--text-muted) leading-[1.45] mt-[0.1875rem] line-clamp-2">{preset.description}</div>
        <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
          <div className="w-[14px] h-[14px] rounded-full border-[1.5px] border-white/[0.16] shrink-0" />
        </div>
      </div>
    </div>
  )
}
