'use client'

import type { AiCharacter } from '@/shared/lib/character'
import {
  C, INJECTED_CSS,
  Section, CollapsibleSection,
  TextCell, InputCell, SelectCell, CheckboxRow, InputGrid, Gap,
  LANGUAGE_OPTIONS, MOOD_OPTIONS,
} from './skills-tab-primitives'

interface SkillsTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const SkillsTab = ({ character, onUpdate }: SkillsTabProps) => {
  const { behavior: bh, autoPilot: ap } = character

  return (
    <div style={{ fontSize: 11, color: C.valueText }}>
      <style>{INJECTED_CSS}</style>

      {/* ── Basic ──────────────────────────────────────── */}
      <Section title="Basic">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <InputGrid legend="Name and ID">
            <TextCell
              label="Name"
              value={character.name}
              onChange={v => onUpdate({ name: v })}
            />
            <TextCell
              label="ID"
              value={character.slug}
              readOnly
            />
          </InputGrid>
          <TextCell
            label="Type"
            value="AI Soul"
            accent={C.accent}
            dark
            readOnly
          />
        </div>
      </Section>

      {/* ── Prompt ─────────────────────────────────────── */}
      <Section title="Prompt">
        <textarea
          value={character.systemPrompt}
          onChange={e => onUpdate({ systemPrompt: e.target.value })}
          placeholder="Core instructions for the character…"
          style={{
            width: '100%', minHeight: 108, resize: 'vertical',
            background: C.inputBg,
            border: `1px solid rgba(255,255,255,0.0)`,
            borderRadius: 5, padding: '7px 9px',
            color: C.valueText, fontSize: 11,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
            transition: 'border-color .12s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = C.inputBorderFocus }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.0)' }}
        />
        <div style={{
          marginTop: 5, textAlign: 'right',
          fontSize: 10, fontFamily: 'var(--font-mono)', color: C.sectionIcon,
        }}>
          {character.systemPrompt.length} chars
        </div>
      </Section>

      {/* ── Response ───────────────────────────────────── */}
      <Section title="Response">
        <InputGrid legend="Delay and max length">
          <InputCell
            label="Delay"
            value={bh.responseDelayMs}
            unit="ms"
            min={0} max={5000} step={100}
            onChange={v => onUpdate({ behavior: { ...bh, responseDelayMs: Math.min(5000, Math.max(0, v)) } })}
          />
          <InputCell
            label="Max"
            value={bh.maxResponseLength}
            unit="ch"
            min={50} max={2000} step={50}
            onChange={v => onUpdate({ behavior: { ...bh, maxResponseLength: Math.min(2000, Math.max(50, v)) } })}
          />
          {/* Row 2: Language select | Emotion — 2×2 grid */}
          <SelectCell
            value={bh.language}
            options={LANGUAGE_OPTIONS}
            onChange={v => onUpdate({ behavior: { ...bh, language: v } })}
          />
          <InputCell
            label="Emotion"
            value={parseFloat(bh.emotionIntensityScale.toFixed(2))}
            min={0} max={1} step={0.01}
            onChange={v => onUpdate({ behavior: { ...bh, emotionIntensityScale: Math.min(1, Math.max(0, v)) } })}
          />
        </InputGrid>

        <Gap />

        <CheckboxRow
          label="Auto-moderate"
          checked={bh.autoModerate}
          onChange={v => onUpdate({ behavior: { ...bh, autoModerate: v } })}
        />
        <CheckboxRow
          label="Typing simulation"
          checked={bh.typingSimulation}
          onChange={v => onUpdate({ behavior: { ...bh, typingSimulation: v } })}
        />
      </Section>

      {/* ── Live mode (collapsed by default) ──────────── */}
      <CollapsibleSection title="Live mode">
        {(collapse) => (
          /* Single 3-column grid: [1fr] [1fr] [24px]
             All rows share the same column widths → perfect alignment */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 24px',
            gridAutoRows: '28px',
            columnGap: 4,
            rowGap: 4,
            alignItems: 'center',
          }}>
            {/* Row 1: Idle | Interval | − */}
            <InputCell
              label="Idle"
              value={ap.idleTimeoutSeconds}
              unit="s"
              min={30} max={600} step={10}
              onChange={v => onUpdate({ autoPilot: { ...ap, idleTimeoutSeconds: Math.min(600, Math.max(30, v)) } })}
            />
            <InputCell
              label="Interval"
              value={ap.minIntervalSeconds}
              unit="s"
              min={10} max={300} step={10}
              onChange={v => onUpdate({ autoPilot: { ...ap, minIntervalSeconds: Math.min(300, Math.max(10, v)) } })}
            />
            <button
              type="button"
              onClick={collapse}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.rowLabel, transition: 'color .12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.valueText }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.rowLabel }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M7 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Row 2: Neutral spans cols 1-2, col 3 empty */}
            <div style={{ gridColumn: '1 / 3' }}>
              <SelectCell
                value={ap.mood}
                options={MOOD_OPTIONS}
                onChange={v => onUpdate({ autoPilot: { ...ap, mood: v } })}
              />
            </div>
            <div />
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}

export default SkillsTab
