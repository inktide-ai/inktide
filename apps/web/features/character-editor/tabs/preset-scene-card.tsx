'use client'
import { useState } from 'react'

const TAG_COLORS: Record<string, { text: string; bg: string; border: string; activeBorder: string; activeBg: string }> = {
  'Синтвейв':    { text: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.35)',  activeBorder: 'rgba(167,139,250,0.45)',  activeBg: 'rgba(167,139,250,0.06)' },
  'Природа':     { text: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.35)',   activeBorder: 'rgba(74,222,128,0.45)',   activeBg: 'rgba(74,222,128,0.06)'  },
  'Городской':   { text: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.35)',   activeBorder: 'rgba(56,189,248,0.45)',   activeBg: 'rgba(56,189,248,0.06)'  },
  'Sci-Fi':      { text: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.35)',  activeBorder: 'rgba(129,140,248,0.45)',  activeBg: 'rgba(129,140,248,0.06)' },
  'Аниме':       { text: '#f472b6', bg: 'rgba(244,114,182,0.1)',  border: 'rgba(244,114,182,0.35)',  activeBorder: 'rgba(244,114,182,0.45)',  activeBg: 'rgba(244,114,182,0.06)' },
  'Фэнтези':     { text: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.35)',   activeBorder: 'rgba(251,146,60,0.45)',   activeBg: 'rgba(251,146,60,0.06)'  },
  'Приключение': { text: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.35)',   activeBorder: 'rgba(251,146,60,0.45)',   activeBg: 'rgba(251,146,60,0.06)'  },
  'Экшн':        { text: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.35)',  activeBorder: 'rgba(248,113,113,0.45)',  activeBg: 'rgba(248,113,113,0.06)' },
  'Уютная':      { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.35)',   activeBorder: 'rgba(251,191,36,0.45)',   activeBg: 'rgba(251,191,36,0.06)'  },
}

export interface PresetScene {
  id: string
  name: string
  tagName: string
  description: string
  charGradient: string
}

export const PRESET_SCENES: PresetScene[] = [
  { id: 'preset-studio',  name: 'Студия',          tagName: 'Синтвейв',   description: 'Неоновые мониторы, японская эстетика, синтвейв-атмосфера', charGradient: 'linear-gradient(180deg,rgba(139,92,246,.12),rgba(139,92,246,.03))' },
  { id: 'preset-forest',  name: 'Лесная поляна',   tagName: 'Природа',    description: 'Тихий лес, мягкий свет сквозь листву',                     charGradient: 'linear-gradient(180deg,rgba(34,211,238,.09),rgba(34,211,238,.02))' },
  { id: 'preset-rooftop', name: 'Крыша города',    tagName: 'Городской',  description: 'Ночной мегаполис, неон и огни внизу',                       charGradient: 'linear-gradient(180deg,rgba(236,72,153,.1),rgba(236,72,153,.02))'  },
  { id: 'preset-cosmos',  name: 'Глубокий космос', tagName: 'Sci-Fi',     description: 'Туманности, звёзды и бесконечная тьма',                     charGradient: 'linear-gradient(180deg,rgba(99,102,241,.12),rgba(99,102,241,.03))' },
  { id: 'preset-ocean',   name: 'Подводный мир',   tagName: 'Природа',    description: 'Кораллы, caustic-свет и глубина океана',                    charGradient: 'linear-gradient(180deg,rgba(6,182,212,.11),rgba(6,182,212,.03))'  },
  { id: 'preset-sakura',  name: 'Сакура',          tagName: 'Аниме',      description: 'Цветущая сакура, тории, весенний рассвет',                  charGradient: 'linear-gradient(180deg,rgba(244,114,182,.12),rgba(244,114,182,.03))' },
  { id: 'preset-desert',  name: 'Пустыня',         tagName: 'Приключение',description: 'Закатное солнце над барханами, марево жары',                charGradient: 'linear-gradient(180deg,rgba(251,146,60,.12),rgba(251,146,60,.03))' },
  { id: 'preset-arctic',  name: 'Арктика',         tagName: 'Природа',    description: 'Северное сияние, лёд и звёздная ночь',                      charGradient: 'linear-gradient(180deg,rgba(56,189,248,.1),rgba(56,189,248,.02))'  },
  { id: 'preset-club',    name: 'Ночной клуб',     tagName: 'Городской',  description: 'Световые лучи, бас и танцпол в темноте',                    charGradient: 'linear-gradient(180deg,rgba(139,92,246,.13),rgba(139,92,246,.03))' },
  { id: 'preset-castle',  name: 'Замок',           tagName: 'Фэнтези',    description: 'Средневековые башни, факелы и лунный свет',                 charGradient: 'linear-gradient(180deg,rgba(251,191,36,.1),rgba(251,191,36,.02))'  },
  { id: 'preset-volcano', name: 'Вулкан',          tagName: 'Экшн',       description: 'Лавовые трещины, пепел и огненное небо',                    charGradient: 'linear-gradient(180deg,rgba(239,68,68,.12),rgba(239,68,68,.03))'   },
  { id: 'preset-library', name: 'Библиотека',      tagName: 'Уютная',     description: 'Высокие полки, тёплый свет лампы и тишина',                 charGradient: 'linear-gradient(180deg,rgba(251,191,36,.1),rgba(251,191,36,.02))'  },
]

function ThumbnailDecorations({ id }: { id: string }) {
  const tb = 'absolute rounded-full blur-[32px] pointer-events-none'
  switch (id) {
    case 'preset-studio': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#07050f' }} />
      <div className={tb} style={{ width: 110, height: 110, top: -25, left: '5%',   background: 'rgba(139,92,246,.28)' }} />
      <div className={tb} style={{ width: 80,  height: 80,  bottom: -15, right: '5%',  background: 'rgba(34,211,238,.18)' }} />
      <div className={tb} style={{ width: 60,  height: 60,  top: 5, right: '22%', background: 'rgba(236,72,153,.13)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.55),rgba(236,72,153,.4),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 14, width: 28, height: 18, border: '1px solid rgba(139,92,246,.25)', borderRadius: 2, background: 'rgba(139,92,246,.05)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, right: 14, width: 22, height: 14, border: '1px solid rgba(34,211,238,.2)', borderRadius: 2, background: 'rgba(34,211,238,.04)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 8, fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(236,72,153,.65)', textShadow: '0 0 8px rgba(236,72,153,.3)', zIndex: 3 }}>ブリン</div>
      <div style={{ position: 'absolute', top: 10, right: 12, width: 14, height: 14, border: '1.5px solid rgba(34,211,238,.32)', borderRadius: 2, transform: 'rotate(22deg)', zIndex: 3 }} />
    </>
    case 'preset-forest': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#040d08' }} />
      <div className={tb} style={{ width: 100, height: 100, top: -20, right: '10%', background: 'rgba(34,197,94,.2)' }} />
      <div className={tb} style={{ width: 70,  height: 70,  bottom: -10, left: '5%',  background: 'rgba(34,211,238,.14)' }} />
      <div style={{ position: 'absolute', top: 12, right: 20, width: 18, height: 18, borderRadius: '50%', background: 'rgba(250,204,21,.22)', boxShadow: '0 0 16px rgba(250,204,21,.18)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(34,197,94,.3),rgba(34,211,238,.25),transparent)', zIndex: 3 }} />
    </>
    case 'preset-rooftop': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#0a050c' }} />
      <div className={tb} style={{ width: 110, height: 110, top: -22, left: '20%', background: 'rgba(236,72,153,.19)' }} />
      <div className={tb} style={{ width: 70,  height: 70,  bottom: -10, right: '8%', background: 'rgba(251,146,60,.14)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(236,72,153,.38),rgba(251,146,60,.25),transparent)', zIndex: 3 }} />
    </>
    case 'preset-cosmos': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#02020e' }} />
      <div className={tb} style={{ width: 100, height: 100, top: -15, left: '30%', background: 'rgba(99,102,241,.22)' }} />
      <div className={tb} style={{ width: 60,  height: 60,  bottom: -5, right: '15%', background: 'rgba(167,139,250,.14)' }} />
      <div style={{ position: 'absolute', top: 14, right: 16, width: 20, height: 20, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,rgba(167,139,250,.5),rgba(99,102,241,.2))', boxShadow: '0 0 12px rgba(99,102,241,.25)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,.4),rgba(167,139,250,.3),transparent)', zIndex: 3 }} />
    </>
    case 'preset-ocean': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#020a10' }} />
      <div className={tb} style={{ width: 100, height: 100, top: -10, left: '20%', background: 'rgba(6,182,212,.22)' }} />
      <div className={tb} style={{ width: 70,  height: 70,  bottom: -10, right: '10%', background: 'rgba(34,211,238,.16)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(6,182,212,.35),rgba(34,211,238,.25),transparent)', zIndex: 3 }} />
    </>
    case 'preset-sakura': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#0d050d' }} />
      <div className={tb} style={{ width: 110, height: 110, top: -20, left: '15%', background: 'rgba(244,114,182,.22)' }} />
      <div className={tb} style={{ width: 60,  height: 60,  bottom: -5, right: '20%', background: 'rgba(251,207,232,.12)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(244,114,182,.4),rgba(244,114,182,.25),transparent)', zIndex: 3 }} />
    </>
    case 'preset-desert': return <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0d0703 0%,#150a04 100%)' }} />
      <div className={tb} style={{ width: 100, height: 100, top: -10, left: '30%', background: 'rgba(251,146,60,.25)' }} />
      <div className={tb} style={{ width: 70,  height: 70,  top: -5, right: '10%', background: 'rgba(253,186,116,.18)' }} />
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle,rgba(253,186,116,.6),rgba(251,146,60,.3))', boxShadow: '0 0 20px rgba(251,146,60,.3)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(251,146,60,.45),rgba(253,186,116,.3),transparent)', zIndex: 3 }} />
    </>
    case 'preset-arctic': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#03070f' }} />
      <div className={tb} style={{ width: 110, height: 110, top: -20, left: '10%', background: 'rgba(56,189,248,.18)' }} />
      <div className={tb} style={{ width: 80,  height: 80,  top: -10, right: '5%', background: 'rgba(99,102,241,.14)' }} />
      <div style={{ position: 'absolute', top: 8, left: -5, right: -5, height: 4, background: 'linear-gradient(90deg,transparent,rgba(34,211,238,.22),rgba(99,102,241,.18),rgba(56,189,248,.2),transparent)', borderRadius: 4, filter: 'blur(2px)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(56,189,248,.4),rgba(34,211,238,.3),transparent)', zIndex: 3 }} />
    </>
    case 'preset-club': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#06030f' }} />
      <div className={tb} style={{ width: 80, height: 80, top: -10, left: '5%',   background: 'rgba(139,92,246,.25)' }} />
      <div className={tb} style={{ width: 70, height: 70, top: -5,  right: '5%',  background: 'rgba(56,189,248,.2)'  }} />
      <div className={tb} style={{ width: 50, height: 50, bottom: -5, left: '40%', background: 'rgba(236,72,153,.18)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.5),rgba(56,189,248,.35),transparent)', zIndex: 3 }} />
    </>
    case 'preset-castle': return <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#060408 0%,#0a0710 100%)' }} />
      <div className={tb} style={{ width: 90, height: 90, top: -15, left: '20%', background: 'rgba(251,191,36,.14)' }} />
      <div className={tb} style={{ width: 60, height: 60, bottom: -5, right: '15%', background: 'rgba(167,139,250,.12)' }} />
      <div style={{ position: 'absolute', top: 12, right: 16, width: 14, height: 14, borderRadius: '50%', background: 'rgba(253,224,71,.12)', boxShadow: '0 0 12px rgba(253,224,71,.1)', zIndex: 3 }} />
    </>
    case 'preset-volcano': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#0d0202' }} />
      <div className={tb} style={{ width: 120, height: 120, bottom: -20, left: '20%', background: 'rgba(239,68,68,.22)' }} />
      <div className={tb} style={{ width: 70,  height: 70,  top: -10, right: '10%', background: 'rgba(251,146,60,.16)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,.5),rgba(251,146,60,.35),transparent)', zIndex: 3 }} />
    </>
    case 'preset-library': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#080603' }} />
      <div className={tb} style={{ width: 90, height: 90, top: -10, left: '30%', background: 'rgba(251,191,36,.16)' }} />
      <div className={tb} style={{ width: 60, height: 60, bottom: -5, right: '20%', background: 'rgba(234,179,8,.1)' }} />
      <div style={{ position: 'absolute', top: 8, right: 14, width: 12, height: 12, borderRadius: '50%', background: 'rgba(251,191,36,.25)', boxShadow: '0 0 14px rgba(251,191,36,.2)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.38),rgba(234,179,8,.25),transparent)', zIndex: 3 }} />
    </>
    default: return null
  }
}

interface PresetSceneCardProps {
  preset: PresetScene
  animationDelay?: number
}

export function PresetSceneCard({ preset, animationDelay = 0 }: PresetSceneCardProps) {
  const [hovered, setHovered] = useState(false)
  const tag = TAG_COLORS[preset.tagName] ?? TAG_COLORS['Синтвейв']!
  const cardStyle = hovered ? { borderColor: tag.border } : {}

  return (
    <div
      className="relative bg-[#13151A] border border-[#13151a] rounded-[0.875rem] overflow-hidden flex flex-col min-h-[188px] transition-[border-color,transform,box-shadow,background,opacity] duration-[180ms] select-none outline-none opacity-0 animate-[cardIn_0.32s_cubic-bezier(0.2,0.9,0.2,1)_forwards]"
      style={{ animationDelay: `${animationDelay}ms`, ...cardStyle }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-[124px] overflow-hidden shrink-0">
        <ThumbnailDecorations id={preset.id} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, zIndex: 2, background: 'linear-gradient(transparent, var(--bg-card, #13151a))', pointerEvents: 'none' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[3]">
          <div className="w-[26px] h-[62px] rounded-[13px_13px_0_0] border border-white/[0.08] border-b-0 relative" style={{ background: preset.charGradient }} />
        </div>
      </div>

      <div className="flex flex-col flex-1 p-[0.625rem_0.875rem_0.75rem]">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-[0.875rem] font-semibold text-(--text-primary) leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0" title={preset.name}>{preset.name}</div>
          <span className="text-[0.6875rem] font-semibold tracking-[0.03em] uppercase py-[2px] px-[6px] rounded-[4px] shrink-0 whitespace-nowrap" style={{ color: tag.text, background: tag.bg, border: `1px solid ${tag.border}` }}>{preset.tagName}</span>
        </div>
        <div className="text-[0.6875rem] text-(--text-muted) leading-[1.45] mt-[0.1875rem] line-clamp-2">{preset.description}</div>
        <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
          <div className="w-[14px] h-[14px] rounded-full border-[1.5px] border-white/[0.16] shrink-0" />
          <span className="text-[9.5px] font-semibold tracking-[0.05em] uppercase text-[rgba(251,191,36,0.65)] bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.16)] rounded-[4px] py-[2px] px-[7px] shrink-0" style={{ fontSize: '0.625rem' }}>Скоро</span>
        </div>
      </div>
    </div>
  )
}
