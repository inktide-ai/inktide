'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { PipelineNode } from '../nodes/pipeline-node'
import { SourceNode } from '../nodes/source-node'
import { AgentContextNode } from '../nodes/agent-context-node'
import { ProcessNode } from '../nodes/process-node'
import { OutputNode } from '../nodes/output-node'
import { FloatingEdge } from '../edges/floating-edge'

// ── Node accent colors (mirror --node-* CSS vars) ─────────────────────────────
const NODE_ACCENT = {
  input: '#EAB308',
  llm:   '#6366F1',
  tts:   '#10B981',
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

export type Tool = 'select' | 'pan' | 'connect' | 'lock'
export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

export const STATUS_COLOR: Record<SaveStatus, string> = {
  saved:  'var(--graph-status-saved)',
  saving: 'var(--graph-status-saving)',
  dirty:  'var(--graph-status-dirty)',
  error:  'var(--graph-status-error)',
}

// ── Shared handle style ───────────────────────────────────────────────────────

export const handleStyle = {
  width: 10, height: 10, borderRadius: '50%',
  background: 'radial-gradient(circle at center, #fff 38%, rgba(255,255,255,0.55) 38%)',
  border: '1.5px solid rgba(255,255,255,0.45)',
}

// ── ThemeNode (generic — kept for backward compat) ────────────────────────────

interface ThemeNodeData {
  label: string
  sub?: string
  badge?: string
  badgeColor?: string
  isStart?: boolean
}

export function ThemeNode({ data, selected }: NodeProps) {
  const d = data as unknown as ThemeNodeData
  return (
    <div style={{
      background: 'var(--graph-node-surface)',
      border: `1px solid ${selected ? 'var(--graph-node-border-focus)' : 'var(--graph-node-border)'}`,
      borderRadius: 9, padding: '9px 13px',
      minWidth: 117, maxWidth: 153,
      boxShadow: selected
        ? '0 0 0 1.5px var(--graph-node-border-focus), 0 6px 22px rgba(0,0,0,0.5)'
        : '0 4px 14px rgba(0,0,0,0.4)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      userSelect: 'none',
    }}>
      {!d.isStart && <Handle type="target" position={Position.Left} style={handleStyle} />}
      {d.badge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <span style={{ background: d.badgeColor ?? 'var(--graph-node-border)', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
            {d.badge}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--graph-node-text)', letterSpacing: 0.1 }}>{d.label}</span>
        </div>
      )}
      {!d.badge && (
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--graph-node-text)', marginBottom: d.sub ? 4 : 0 }}>{d.label}</div>
      )}
      {d.sub && <div style={{ fontSize: 10, color: 'var(--graph-node-text-muted)', lineHeight: 1.4 }}>{d.sub}</div>}
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

// ── Node / edge type registries ───────────────────────────────────────────────

export const nodeTypes = {
  theme:        ThemeNode,
  pipeline:     PipelineNode,
  source:       SourceNode,
  agentContext: AgentContextNode,
  process:      ProcessNode,
  outputNode:   OutputNode,
}

export const edgeTypes = {
  floating: FloatingEdge,
}

// ── Premium default pipeline ──────────────────────────────────────────────────
// Layout: sources (x=80) → input (x=340) → agentContext (x=590) → llm (x=960) → tts (x=1160) → output (x=1360)
// All process/output nodes centered at y=220, which aligns with the AgentContext card mid-point.

export const initialNodes = [
  // Source column — stacked vertically
  { id: 'n-discord',  type: 'source',  position: { x: 80,   y: 100 }, data: { platform: 'discord' } },
  { id: 'n-telegram', type: 'source',  position: { x: 80,   y: 230 }, data: { platform: 'telegram' } },
  { id: 'n-twitch',   type: 'source',  position: { x: 80,   y: 360 }, data: { platform: 'twitch' } },

  // Input aggregator
  { id: 'n-input',    type: 'process', position: { x: 340,  y: 220 }, data: { label: 'Input', subLabel: 'INPUT', accent: NODE_ACCENT.input, icon: 'input' } },

  // Agent Context group card
  { id: 'n-context',  type: 'agentContext', position: { x: 590, y: 80 }, data: {} },

  // Right pipeline
  { id: 'n-llm',      type: 'process', position: { x: 960,  y: 220 }, data: { label: 'LLM', subLabel: 'LLM', accent: NODE_ACCENT.llm, icon: 'llm' } },
  { id: 'n-tts',      type: 'process', position: { x: 1160, y: 220 }, data: { label: 'TTS', subLabel: 'TTS', accent: NODE_ACCENT.tts, icon: 'tts' } },
  { id: 'n-output',   type: 'outputNode', position: { x: 1360, y: 220 }, data: {} },
]

const mkFloat = (id: string, source: string, target: string) => ({
  id, source, target,
  type: 'floating',
  style: { stroke: 'var(--graph-edge-stroke)', strokeWidth: 1.5 },
})

export const initialEdges = [
  mkFloat('e-discord-input',   'n-discord',  'n-input'),
  mkFloat('e-telegram-input',  'n-telegram', 'n-input'),
  mkFloat('e-twitch-input',    'n-twitch',   'n-input'),
  mkFloat('e-input-context',   'n-input',    'n-context'),
  mkFloat('e-context-llm',     'n-context',  'n-llm'),
  mkFloat('e-llm-tts',         'n-llm',      'n-tts'),
  mkFloat('e-tts-output',      'n-tts',      'n-output'),
]
