'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LLM_PROVIDER_CATALOG, type LlmProviderCatalogEntry } from '@/shared/data/llm-providers'
import type { PipelineNodeData } from '../nodes/pipeline-node'
import {
  Section,
  TextCell,
  PasswordCell,
  TextAreaCell,
  InputCell,
  InputGrid,
} from './inspector-primitives'

// ── Provider icon ─────────────────────────────────────────────────────────────

function ProviderIcon({ id, size = 32 }: { id: string; size?: number }) {
  const entry = LLM_PROVIDER_CATALOG.find(p => p.id === id)
  const iconSrc = entry?.iconSrc ?? '/images/providers/brain/chatgpt.svg'
  const dark = entry?.darkIcon ?? false
  const r = Math.round(size * 0.28)
  return (
    <div
      className={cn('shrink-0 flex items-center justify-center overflow-hidden', dark ? 'bg-white' : 'bg-[#1C1F2A]')}
      style={{ width: size, height: size, borderRadius: r }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt={entry?.name ?? id} width={size * 0.68} height={size * 0.68}
        className="object-contain block" />
    </div>
  )
}

// ── Provider picker ───────────────────────────────────────────────────────────

function ProviderPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const pillRef   = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const currentEntry = LLM_PROVIDER_CATALOG.find(p => p.id === value)

  const openFlyout = () => {
    if (!pillRef.current) return
    const r = pillRef.current.getBoundingClientRect()
    setPos({ top: r.top, right: window.innerWidth - r.left + 8 })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        flyoutRef.current && !flyoutRef.current.contains(e.target as Node) &&
        pillRef.current  && !pillRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const providers: LlmProviderCatalogEntry[] = LLM_PROVIDER_CATALOG

  return (
    <>
      {/* Pill */}
      <div
        ref={pillRef}
        className={cn(
          'flex items-center h-7 rounded overflow-hidden transition-[border-color] duration-150',
          'bg-[var(--input-bg)]',
          open ? 'border border-[rgba(99,102,241,0.4)]' : 'border border-[var(--border-subtle)]',
        )}
      >
        <div className="flex items-center gap-1.5 flex-1 px-2 min-w-0">
          <ProviderIcon id={value} size={16} />
          <span className="text-[12px] text-[var(--text-primary)] truncate">
            {currentEntry?.name ?? value}
          </span>
        </div>
        <button
          type="button"
          onClick={openFlyout}
          className={cn(
            'shrink-0 w-6 h-full flex items-center justify-center border-none cursor-pointer',
            'border-l border-l-[var(--border-subtle)] transition-colors duration-100',
            open
              ? 'bg-[rgba(99,102,241,0.12)] text-[#818CF8]'
              : 'bg-transparent text-[var(--text-tertiary)] hover:bg-white/[0.05]',
          )}
        >
          <ChevronRight size={11} />
        </button>
      </div>

      {/* Flyout (portal) */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={flyoutRef}
          className={cn(
            'fixed z-[9999] rounded-[10px] p-2.5 min-w-[192px]',
            'bg-[var(--inspector-bg)] border border-[var(--border-default)]',
            '[box-shadow:0_16px_48px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.4)]',
            'animate-[providerIn_0.14s_cubic-bezier(0.22,1,0.36,1)_both]',
          )}
          style={{ top: pos.top, right: pos.right }}
        >
          <p className="mx-0.5 mb-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Model provider
          </p>
          <div className="grid grid-cols-5 gap-0.5 max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
            {providers.map(p => {
              const selected = p.id === value
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.name}
                  onClick={() => { onChange(p.id); setOpen(false) }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 rounded-md border-none cursor-pointer transition-colors duration-[80ms]',
                    selected
                      ? 'bg-[rgba(99,102,241,0.12)] outline outline-1 outline-[rgba(99,102,241,0.5)]'
                      : 'bg-transparent hover:bg-white/[0.06]',
                  )}
                >
                  <ProviderIcon id={p.id} size={36} />
                  <span className={cn(
                    'text-[9px] text-center max-w-[48px] truncate tracking-[-0.01em] leading-tight',
                    selected ? 'text-[#A5B4FC]' : 'text-[var(--text-tertiary)]',
                  )}>
                    {p.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// ── LLM config ────────────────────────────────────────────────────────────────

export interface LlmCfg {
  provider_id:      string
  base_url:         string
  api_key:          string
  model_id:         string
  system_prompt:    string
  temperature:      number
  max_tokens:       number
  top_p:            number
  freq_penalty:     number
  presence_penalty: number
}

export function defaultLlmCfg(nodeData: PipelineNodeData): LlmCfg {
  const d = nodeData as Record<string, unknown>
  return {
    provider_id:      (d.provider_id      as string)  ?? 'ollama',
    base_url:         (d.base_url         as string)  ?? 'http://localhost:11434',
    api_key:          (d.api_key          as string)  ?? '',
    model_id:         (d.model_id         as string)  ?? '',
    system_prompt:    (d.system_prompt    as string)  ?? '',
    temperature:      (d.temperature      as number)  ?? 0.7,
    max_tokens:       (d.max_tokens       as number)  ?? 512,
    top_p:            (d.top_p            as number)  ?? 1.0,
    freq_penalty:     (d.freq_penalty     as number)  ?? 0.0,
    presence_penalty: (d.presence_penalty as number)  ?? 0.0,
  }
}

// ── LLM inspector sections ────────────────────────────────────────────────────

interface LlmInspectorProps {
  llmCfg: LlmCfg
  set: <K extends keyof LlmCfg>(key: K, val: LlmCfg[K]) => void
}

export function LlmInspector({ llmCfg, set }: LlmInspectorProps) {
  const isOllama = llmCfg.provider_id === 'ollama'

  return (
    <>
      <Section title="Model">
        <div className="flex flex-col gap-1">

          {/* Provider */}
          <ProviderPicker
            value={llmCfg.provider_id}
            onChange={v => set('provider_id', v)}
          />

          {/* Ollama: Base URL */}
          {isOllama && (
            <TextCell
              label="Base URL"
              value={llmCfg.base_url}
              placeholder="http://localhost:11434"
              onChange={v => set('base_url', v)}
            />
          )}

          {/* Remote: API Key */}
          {!isOllama && (
            <PasswordCell
              label="API Key"
              value={llmCfg.api_key}
              onChange={v => set('api_key', v)}
            />
          )}

          {/* Model ID */}
          <TextCell
            label="Model"
            value={llmCfg.model_id}
            placeholder={isOllama ? 'llama3.2' : 'gpt-4o'}
            onChange={v => set('model_id', v)}
          />

          {/* System Prompt */}
          <TextAreaCell
            label="System prompt"
            value={llmCfg.system_prompt}
            placeholder="Override the character system prompt…"
            onChange={v => set('system_prompt', v)}
            rows={3}
          />

        </div>
      </Section>

      <Section title="Parameters">
        <InputGrid legend="LLM parameters">
          <InputCell
            label="Temp"
            value={llmCfg.temperature}
            min={0} max={2} step={0.05}
            onChange={v => set('temperature', Math.min(2, Math.max(0, v)))}
          />
          <InputCell
            label="Max tokens"
            value={llmCfg.max_tokens}
            min={64} max={4096} step={64}
            onChange={v => set('max_tokens', Math.min(4096, Math.max(64, v)))}
          />
          <InputCell
            label="Top P"
            value={llmCfg.top_p}
            min={0} max={1} step={0.05}
            onChange={v => set('top_p', Math.min(1, Math.max(0, v)))}
          />
          <InputCell
            label="Freq penalty"
            value={llmCfg.freq_penalty}
            min={0} max={2} step={0.05}
            onChange={v => set('freq_penalty', Math.min(2, Math.max(0, v)))}
          />
          <InputCell
            label="Presence penalty"
            value={llmCfg.presence_penalty}
            min={0} max={2} step={0.05}
            span
            onChange={v => set('presence_penalty', Math.min(2, Math.max(0, v)))}
          />
        </InputGrid>
      </Section>
    </>
  )
}
