import { useState } from 'react'
import styles from './SceneTab.module.css'

/* ── Tag colour palette (by display name) ────────────────────────────── */
const TAG_COLORS: Record<string, { text: string; bg: string; border: string; activeBorder: string; activeBg: string }> = {
  'Синтвейв':   { text: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.35)',  activeBorder: 'rgba(167,139,250,0.45)',  activeBg: 'rgba(167,139,250,0.06)' },
  'Природа':    { text: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.35)',   activeBorder: 'rgba(74,222,128,0.45)',   activeBg: 'rgba(74,222,128,0.06)'  },
  'Городской':  { text: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.35)',   activeBorder: 'rgba(56,189,248,0.45)',   activeBg: 'rgba(56,189,248,0.06)'  },
  'Sci-Fi':     { text: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.35)',  activeBorder: 'rgba(129,140,248,0.45)',  activeBg: 'rgba(129,140,248,0.06)' },
  'Аниме':      { text: '#f472b6', bg: 'rgba(244,114,182,0.1)',  border: 'rgba(244,114,182,0.35)',  activeBorder: 'rgba(244,114,182,0.45)',  activeBg: 'rgba(244,114,182,0.06)' },
  'Фэнтези':    { text: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.35)',   activeBorder: 'rgba(251,146,60,0.45)',   activeBg: 'rgba(251,146,60,0.06)'  },
  'Приключение':{ text: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.35)',   activeBorder: 'rgba(251,146,60,0.45)',   activeBg: 'rgba(251,146,60,0.06)'  },
  'Экшн':       { text: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.35)',  activeBorder: 'rgba(248,113,113,0.45)',  activeBg: 'rgba(248,113,113,0.06)' },
  'Уютная':     { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.35)',   activeBorder: 'rgba(251,191,36,0.45)',   activeBg: 'rgba(251,191,36,0.06)'  },
}

/* ── Preset data ─────────────────────────────────────────────────────── */
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
  { id: 'preset-rooftop', name: 'Крыша города',    tagName: 'Городской',  description: 'Ночной мегаполис, неон и огни внизу',                       charGradient: 'linear-gradient(180deg,rgba(236,72,153,.1),rgba(236,72,153,.02))' },
  { id: 'preset-cosmos',  name: 'Глубокий космос', tagName: 'Sci-Fi',     description: 'Туманности, звёзды и бесконечная тьма',                     charGradient: 'linear-gradient(180deg,rgba(99,102,241,.12),rgba(99,102,241,.03))' },
  { id: 'preset-ocean',   name: 'Подводный мир',   tagName: 'Природа',    description: 'Кораллы, caustic-свет и глубина океана',                    charGradient: 'linear-gradient(180deg,rgba(6,182,212,.11),rgba(6,182,212,.03))' },
  { id: 'preset-sakura',  name: 'Сакура',          tagName: 'Аниме',      description: 'Цветущая сакура, тории, весенний рассвет',                  charGradient: 'linear-gradient(180deg,rgba(244,114,182,.12),rgba(244,114,182,.03))' },
  { id: 'preset-desert',  name: 'Пустыня',         tagName: 'Приключение',description: 'Закатное солнце над барханами, марево жары',                charGradient: 'linear-gradient(180deg,rgba(251,146,60,.12),rgba(251,146,60,.03))' },
  { id: 'preset-arctic',  name: 'Арктика',         tagName: 'Природа',    description: 'Северное сияние, лёд и звёздная ночь',                      charGradient: 'linear-gradient(180deg,rgba(56,189,248,.1),rgba(56,189,248,.02))' },
  { id: 'preset-club',    name: 'Ночной клуб',     tagName: 'Городской',  description: 'Световые лучи, бас и танцпол в темноте',                    charGradient: 'linear-gradient(180deg,rgba(139,92,246,.13),rgba(139,92,246,.03))' },
  { id: 'preset-castle',  name: 'Замок',           tagName: 'Фэнтези',    description: 'Средневековые башни, факелы и лунный свет',                 charGradient: 'linear-gradient(180deg,rgba(251,191,36,.1),rgba(251,191,36,.02))' },
  { id: 'preset-volcano', name: 'Вулкан',          tagName: 'Экшн',       description: 'Лавовые трещины, пепел и огненное небо',                    charGradient: 'linear-gradient(180deg,rgba(239,68,68,.12),rgba(239,68,68,.03))' },
  { id: 'preset-library', name: 'Библиотека',      tagName: 'Уютная',     description: 'Высокие полки, тёплый свет лампы и тишина',                 charGradient: 'linear-gradient(180deg,rgba(251,191,36,.1),rgba(251,191,36,.02))' },
]

/* ── Per-preset thumbnail decorations ───────────────────────────────── */
function ThumbnailDecorations({ id }: { id: string }) {
  switch (id) {

    case 'preset-studio': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#07050f' }} />
      <div className={styles.tb} style={{ width: 110, height: 110, top: -25, left: '5%', background: 'rgba(139,92,246,.28)' }} />
      <div className={styles.tb} style={{ width: 80,  height: 80,  bottom: -15, right: '5%', background: 'rgba(34,211,238,.18)' }} />
      <div className={styles.tb} style={{ width: 60,  height: 60,  top: 5, right: '22%', background: 'rgba(236,72,153,.13)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 14, right: 14, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.55),rgba(236,72,153,.4),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 14, width: 28, height: 18, border: '1px solid rgba(139,92,246,.25)', borderRadius: 2, background: 'rgba(139,92,246,.05)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, right: 14, width: 22, height: 14, border: '1px solid rgba(34,211,238,.2)', borderRadius: 2, background: 'rgba(34,211,238,.04)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 8, fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(236,72,153,.65)', textShadow: '0 0 8px rgba(236,72,153,.3)', zIndex: 3 }}>ブリン</div>
      <div style={{ position: 'absolute', top: 10, right: 12, width: 14, height: 14, border: '1.5px solid rgba(34,211,238,.32)', borderRadius: 2, transform: 'rotate(22deg)', zIndex: 3 }} />
    </>

    case 'preset-forest': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#040d08' }} />
      <div className={styles.tb} style={{ width: 100, height: 100, top: -20, right: '10%', background: 'rgba(34,197,94,.2)' }} />
      <div className={styles.tb} style={{ width: 70,  height: 70,  bottom: -10, left: '5%', background: 'rgba(34,211,238,.14)' }} />
      <div style={{ position: 'absolute', top: 12, right: 20, width: 18, height: 18, borderRadius: '50%', background: 'rgba(250,204,21,.22)', boxShadow: '0 0 16px rgba(250,204,21,.18)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(34,197,94,.3),rgba(34,211,238,.25),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 10, display: 'flex', gap: 4, alignItems: 'flex-end', zIndex: 3 }}>
        <div style={{ width: 10, height: 32, borderRadius: '50% 50% 0 0', background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.18)' }} />
        <div style={{ width: 8,  height: 24, borderRadius: '50% 50% 0 0', background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.14)' }} />
        <div style={{ width: 12, height: 38, borderRadius: '50% 50% 0 0', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.16)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 20, right: 10, display: 'flex', gap: 3, alignItems: 'flex-end', zIndex: 3 }}>
        <div style={{ width: 9, height: 28, borderRadius: '50% 50% 0 0', background: 'rgba(34,197,94,.11)', border: '1px solid rgba(34,197,94,.15)' }} />
        <div style={{ width: 7, height: 20, borderRadius: '50% 50% 0 0', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.12)' }} />
      </div>
    </>

    case 'preset-rooftop': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#0a050c' }} />
      <div className={styles.tb} style={{ width: 110, height: 110, top: -22, left: '20%', background: 'rgba(236,72,153,.19)' }} />
      <div className={styles.tb} style={{ width: 70,  height: 70,  bottom: -10, right: '8%', background: 'rgba(251,146,60,.14)' }} />
      <div style={{ position: 'absolute', top: 10, right: 18, width: 16, height: 16, borderRadius: '50%', background: 'rgba(253,224,71,.15)', boxShadow: '0 0 14px rgba(253,224,71,.12)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(236,72,153,.38),rgba(251,146,60,.25),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 8, display: 'flex', gap: 2, alignItems: 'flex-end', zIndex: 3 }}>
        {([20, 34, 16, 26, 12, 30] as number[]).map((h, i) => (
          <div key={i} style={{ width: [7,10,6,8,5,9][i], height: h, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '1px 1px 0 0' }} />
        ))}
      </div>
    </>

    case 'preset-cosmos': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#02020e' }} />
      <div className={styles.tb} style={{ width: 100, height: 100, top: -15, left: '30%', background: 'rgba(99,102,241,.22)' }} />
      <div className={styles.tb} style={{ width: 60,  height: 60,  bottom: -5, right: '15%', background: 'rgba(167,139,250,.14)' }} />
      {/* Stars */}
      {([{t:18,l:22},{t:12,l:44},{t:30,l:68},{t:8,l:90},{t:42,l:110},{t:24,l:132},{t:36,l:156},{t:14,l:170},{t:50,l:52},{t:6,l:78}] as {t:number;l:number}[]).map((s,i) => (
        <div key={i} style={{ position: 'absolute', top: s.t, left: s.l, width: 2, height: 2, borderRadius: '50%', background: `rgba(255,255,255,${.18 + (i % 3) * .1})`, zIndex: 3 }} />
      ))}
      <div style={{ position: 'absolute', top: 14, right: 16, width: 20, height: 20, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,rgba(167,139,250,.5),rgba(99,102,241,.2))', boxShadow: '0 0 12px rgba(99,102,241,.25)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 20, right: 8, width: 36, height: 8, border: '1.5px solid rgba(167,139,250,.22)', borderRadius: '50%', transform: 'rotateX(60deg)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,.4),rgba(167,139,250,.3),transparent)', zIndex: 3 }} />
    </>

    case 'preset-ocean': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#020a10' }} />
      <div className={styles.tb} style={{ width: 100, height: 100, top: -10, left: '20%', background: 'rgba(6,182,212,.22)' }} />
      <div className={styles.tb} style={{ width: 70,  height: 70,  bottom: -10, right: '10%', background: 'rgba(34,211,238,.16)' }} />
      <div style={{ position: 'absolute', top: 8,  left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(34,211,238,.18),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 16, left: '10%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(34,211,238,.1),transparent)', zIndex: 3 }} />
      {/* Bubbles */}
      {([{t:12,l:18,s:5},{t:24,l:28,s:3},{t:8,l:42,s:4},{t:18,r:22,s:4},{t:6,r:36,s:3}] as any[]).map((b,i) => (
        <div key={i} style={{ position: 'absolute', top: b.t, left: b.l, right: b.r, width: b.s, height: b.s, borderRadius: '50%', border: `1px solid rgba(34,211,238,${.25+i*.01})`, zIndex: 3 }} />
      ))}
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(6,182,212,.35),rgba(34,211,238,.25),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 12, width: 8,  height: 16, borderRadius: '4px 4px 0 0', background: 'rgba(244,114,182,.12)', border: '1px solid rgba(244,114,182,.18)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 22, width: 6,  height: 10, borderRadius: '3px 3px 0 0', background: 'rgba(251,146,60,.1)',   border: '1px solid rgba(251,146,60,.16)',  zIndex: 3 }} />
    </>

    case 'preset-sakura': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#0d050d' }} />
      <div className={styles.tb} style={{ width: 110, height: 110, top: -20, left: '15%', background: 'rgba(244,114,182,.22)' }} />
      <div className={styles.tb} style={{ width: 60,  height: 60,  bottom: -5, right: '20%', background: 'rgba(251,207,232,.12)' }} />
      {/* Torii gate silhouette */}
      <div style={{ position: 'absolute', bottom: 20, right: 14, width: 22, height: 36, zIndex: 3 }}>
        <div style={{ position: 'absolute', bottom: 0, left: 2,  width: 3, height: 34, background: 'rgba(239,68,68,.2)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 2, width: 3, height: 34, background: 'rgba(239,68,68,.2)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: 4, left: 0, right: 0, height: 2, background: 'rgba(239,68,68,.28)', borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: 9, left: 2, right: 2, height: 1.5, background: 'rgba(239,68,68,.2)', borderRadius: 1 }} />
      </div>
      {/* Petals */}
      <div style={{ position: 'absolute', top: 14, left: 16, width: 6, height: 6, borderRadius: '50% 0 50% 0', background: 'rgba(244,114,182,.3)',   transform: 'rotate(20deg)',  zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 22, left: 30, width: 5, height: 5, borderRadius: '50% 0 50% 0', background: 'rgba(244,114,182,.22)',  transform: 'rotate(-15deg)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 10, left: 50, width: 4, height: 4, borderRadius: '50% 0 50% 0', background: 'rgba(251,207,232,.28)',  transform: 'rotate(35deg)',  zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 28, right: 30, width: 5, height: 5, borderRadius: '50% 0 50% 0', background: 'rgba(244,114,182,.2)', transform: 'rotate(-25deg)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(244,114,182,.4),rgba(244,114,182,.25),transparent)', zIndex: 3 }} />
    </>

    case 'preset-desert': return <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0d0703 0%,#150a04 100%)' }} />
      <div className={styles.tb} style={{ width: 100, height: 100, top: -10, left: '30%', background: 'rgba(251,146,60,.25)' }} />
      <div className={styles.tb} style={{ width: 70,  height: 70,  top: -5, right: '10%', background: 'rgba(253,186,116,.18)' }} />
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle,rgba(253,186,116,.6),rgba(251,146,60,.3))', boxShadow: '0 0 20px rgba(251,146,60,.3)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', width: 60, height: 2, background: 'linear-gradient(90deg,transparent,rgba(253,186,116,.12),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: -10, right: -10, height: 28, borderRadius: '50% 50% 0 0', background: 'rgba(251,146,60,.08)', borderTop: '1px solid rgba(251,146,60,.12)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: '30%', right: -10, height: 18, borderRadius: '50% 50% 0 0', background: 'rgba(251,146,60,.06)', borderTop: '1px solid rgba(251,146,60,.09)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(251,146,60,.45),rgba(253,186,116,.3),transparent)', zIndex: 3 }} />
    </>

    case 'preset-arctic': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#03070f' }} />
      <div className={styles.tb} style={{ width: 110, height: 110, top: -20, left: '10%', background: 'rgba(56,189,248,.18)' }} />
      <div className={styles.tb} style={{ width: 80,  height: 80,  top: -10, right: '5%', background: 'rgba(99,102,241,.14)' }} />
      <div className={styles.tb} style={{ width: 60,  height: 60,  bottom: 0, right: '30%', background: 'rgba(34,211,238,.1)' }} />
      {/* Aurora bands */}
      <div style={{ position: 'absolute', top: 8,  left: -5, right: -5, height: 4, background: 'linear-gradient(90deg,transparent,rgba(34,211,238,.22),rgba(99,102,241,.18),rgba(56,189,248,.2),transparent)', borderRadius: 4, filter: 'blur(2px)', zIndex: 3 }} />
      <div style={{ position: 'absolute', top: 16, left: '10%', right: '20%', height: 3, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,.15),rgba(34,211,238,.12),transparent)', borderRadius: 3, filter: 'blur(1px)', zIndex: 3 }} />
      {/* Stars */}
      {([{t:22,l:20},{t:14,l:38},{t:30,l:60},{t:18,r:28},{t:26,r:16}] as any[]).map((s,i) => (
        <div key={i} style={{ position: 'absolute', top: s.t, left: s.l, right: s.r, width: 2, height: 2, borderRadius: '50%', background: `rgba(255,255,255,${[.45,.35,.4,.38,.3][i]})`, zIndex: 3 }} />
      ))}
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(56,189,248,.4),rgba(34,211,238,.3),transparent)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, height: 10, background: 'linear-gradient(180deg,rgba(56,189,248,.06),rgba(56,189,248,.02))', borderTop: '1px solid rgba(56,189,248,.1)', zIndex: 3 }} />
    </>

    case 'preset-club': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#06030f' }} />
      <div className={styles.tb} style={{ width: 80, height: 80, top: -10, left: '5%',  background: 'rgba(139,92,246,.25)' }} />
      <div className={styles.tb} style={{ width: 70, height: 70, top: -5,  right: '5%', background: 'rgba(56,189,248,.2)' }} />
      <div className={styles.tb} style={{ width: 50, height: 50, bottom: -5, left: '40%', background: 'rgba(236,72,153,.18)' }} />
      {/* Spotlights */}
      <div style={{ position: 'absolute', top: 0, left: '25%', width: 2, height: 50, background: 'linear-gradient(180deg,rgba(139,92,246,.3),transparent)', zIndex: 3, transform: 'rotate(-8deg)' }} />
      <div style={{ position: 'absolute', top: 0, left: '45%', width: 2, height: 55, background: 'linear-gradient(180deg,rgba(56,189,248,.28),transparent)',  zIndex: 3, transform: 'rotate(5deg)' }} />
      <div style={{ position: 'absolute', top: 0, right: '25%',width: 2, height: 48, background: 'linear-gradient(180deg,rgba(236,72,153,.25),transparent)',  zIndex: 3, transform: 'rotate(12deg)' }} />
      {/* Disco ball */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)', zIndex: 3 }} />
      {/* Speaker cabinet */}
      <div style={{ position: 'absolute', bottom: 20, left: 10, width: 18, height: 22, border: '1px solid rgba(139,92,246,.2)', borderRadius: 3, background: 'rgba(139,92,246,.06)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 24, left: 14, width: 10, height: 10, borderRadius: '50%', border: '1px solid rgba(139,92,246,.22)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.5),rgba(56,189,248,.35),transparent)', zIndex: 3 }} />
    </>

    case 'preset-castle': return <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#060408 0%,#0a0710 100%)' }} />
      <div className={styles.tb} style={{ width: 90, height: 90, top: -15, left: '20%', background: 'rgba(251,191,36,.14)' }} />
      <div className={styles.tb} style={{ width: 60, height: 60, bottom: -5, right: '15%', background: 'rgba(167,139,250,.12)' }} />
      <div style={{ position: 'absolute', bottom: 26, left: 16, width: 8, height: 8, borderRadius: '50%', background: 'rgba(251,191,36,.3)', boxShadow: '0 0 10px rgba(251,191,36,.2)', zIndex: 3 }} />
      {/* Battlements */}
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, height: 18, zIndex: 3, display: 'flex', alignItems: 'flex-end' }}>
        {([10,18,10,18,10,18,10] as number[]).map((h,i) => (
          <div key={i} style={{ flex: i%2===0?1:undefined, width: i%2===1?8:undefined, height: h, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.065)', borderBottom: 'none' }} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 12, right: 16, width: 14, height: 14, borderRadius: '50%', background: 'rgba(253,224,71,.12)', boxShadow: '0 0 12px rgba(253,224,71,.1)', zIndex: 3 }} />
    </>

    case 'preset-volcano': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#0d0202' }} />
      <div className={styles.tb} style={{ width: 120, height: 120, bottom: -20, left: '20%', background: 'rgba(239,68,68,.22)' }} />
      <div className={styles.tb} style={{ width: 70,  height: 70,  top: -10, right: '10%', background: 'rgba(251,146,60,.16)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(180deg,transparent,rgba(239,68,68,.15))', zIndex: 3 }} />
      {/* Lava cracks */}
      <div style={{ position: 'absolute', bottom: 20, left: '20%', right: '30%', height: 2, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,.4),rgba(251,146,60,.5),transparent)', borderRadius: 2, zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 28, left: '35%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(251,146,60,.3),transparent)', zIndex: 3 }} />
      {/* Volcano triangle */}
      <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', borderLeft: '28px solid transparent', borderRight: '28px solid transparent', borderBottom: '38px solid rgba(255,255,255,.035)', zIndex: 3 }} />
      {/* Smoke */}
      <div className={styles.tb} style={{ width: 30, height: 30, top: 5, left: '50%', transform: 'translateX(-50%)', background: 'rgba(100,100,100,.15)', filter: 'blur(12px)' }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,.5),rgba(251,146,60,.35),transparent)', zIndex: 3 }} />
    </>

    case 'preset-library': return <>
      <div style={{ position: 'absolute', inset: 0, background: '#080603' }} />
      <div className={styles.tb} style={{ width: 90, height: 90, top: -10, left: '30%', background: 'rgba(251,191,36,.16)' }} />
      <div className={styles.tb} style={{ width: 60, height: 60, bottom: -5, right: '20%', background: 'rgba(234,179,8,.1)' }} />
      {/* Shelf lines */}
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 20, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'flex-start' }}>
        {[.1,.08,.1].map((o,i) => <div key={i} style={{ height: 3, background: `rgba(251,191,36,${o})`, borderRadius: 1 }} />)}
      </div>
      {/* Book spines */}
      <div style={{ position: 'absolute', bottom: 20, left: 8, display: 'flex', gap: 2, alignItems: 'flex-end', zIndex: 3 }}>
        {(['rgba(239,68,68,.18)','rgba(56,189,248,.15)','rgba(34,197,94,.14)','rgba(251,191,36,.2)','rgba(167,139,250,.15)','rgba(244,114,182,.14)','rgba(251,146,60,.16)'] as string[]).map((bg,i) => (
          <div key={i} style={{ width: [5,4,6,4,5,4,6][i], height: [14,10,16,12,14,10,15][i], background: bg, borderRadius: 1 }} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 8, right: 14, width: 12, height: 12, borderRadius: '50%', background: 'rgba(251,191,36,.25)', boxShadow: '0 0 14px rgba(251,191,36,.2)', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.38),rgba(234,179,8,.25),transparent)', zIndex: 3 }} />
    </>

    default: return null
  }
}

/* ── Component ───────────────────────────────────────────────────────── */
interface PresetSceneCardProps {
  preset: PresetScene
  animationDelay?: number
}

export function PresetSceneCard({ preset, animationDelay = 0 }: PresetSceneCardProps) {
  const [hovered, setHovered] = useState(false)
  const tag = TAG_COLORS[preset.tagName] ?? TAG_COLORS['Синтвейв']

  const cardStyle = hovered
    ? { borderColor: tag.border }
    : {}

  return (
    <div
      className={styles.pgCard}
      style={{ animationDelay: `${animationDelay}ms`, ...cardStyle }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Thumbnail ── */}
      <div className={styles.pgThumb}>
        <ThumbnailDecorations id={preset.id} />

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, zIndex: 2, background: 'linear-gradient(transparent, var(--bg-card, #13151a))', pointerEvents: 'none' }} />

        {/* Character silhouette */}
        <div className={styles.tChar}>
          <div className={styles.tCharBody} style={{ background: preset.charGradient }} />
        </div>
      </div>

      {/* ── Card body ── */}
      <div className={styles.pgBody}>
        <div className={styles.pgMeta}>
          <div className={styles.pgName} title={preset.name}>{preset.name}</div>
          <span className={styles.pgTag} style={{ color: tag.text, background: tag.bg, border: `1px solid ${tag.border}` }}>
            {preset.tagName}
          </span>
        </div>
        <div className={styles.pgDesc}>{preset.description}</div>
        <div className={styles.pgFooter}>
          <div className={styles.pgRadio} />
          <span className={styles.csBadge} style={{ fontSize: '0.625rem' }}>Скоро</span>
        </div>
      </div>
    </div>
  )
}
