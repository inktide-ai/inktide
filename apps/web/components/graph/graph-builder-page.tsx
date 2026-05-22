'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getGraph, saveGraph, graphDtoToFlow } from '@/api/graph'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Controls,
  ConnectionMode,
  type NodeProps,
  type Connection,
  type ReactFlowInstance,
  type Node as RFNode,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PipelineNode } from './nodes/pipeline-node'
import type { PipelineNodeData } from './nodes/pipeline-node'
import { NODE_DEFINITIONS, DATA_TYPE_COLOR, type PipelineNodeType } from './nodes/node-definitions'
import NodeInspectorPanel from './node-inspector/NodeInspectorPanel'
import { SourceNode } from './nodes/source-node'
import { AgentContextNode } from './nodes/agent-context-node'
import { ProcessNode } from './nodes/process-node'
import { OutputNode } from './nodes/output-node'
import { FloatingEdge } from './edges/floating-edge'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = 'select' | 'pan' | 'connect' | 'lock'
type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

const STATUS_COLOR: Record<SaveStatus, string> = {
  saved:  '#4B5563',
  saving: '#6366F1',
  dirty:  '#F59E0B',
  error:  '#EF4444',
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 10)   return 'just now'
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

const LS_KEY = (id: string) => `inktide_graph_${id}`

// ── ThemeNode (generic — kept for backward compat) ────────────────────────────

interface ThemeNodeData {
  label: string
  sub?: string
  badge?: string
  badgeColor?: string
  isStart?: boolean
}

function ThemeNode({ data, selected }: NodeProps) {
  const d = data as unknown as ThemeNodeData
  return (
    <div style={{
      background: '#252524',
      border: `1px solid ${selected ? '#6b6b67' : '#3E3E3B'}`,
      borderRadius: 9, padding: '9px 13px',
      minWidth: 117, maxWidth: 153,
      boxShadow: selected
        ? '0 0 0 1.5px #6b6b67, 0 6px 22px rgba(0,0,0,0.5)'
        : '0 4px 14px rgba(0,0,0,0.4)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      userSelect: 'none',
    }}>
      {!d.isStart && <Handle type="target" position={Position.Left} style={handleStyle} />}
      {d.badge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <span style={{ background: d.badgeColor ?? '#555', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
            {d.badge}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#c8c8c4', letterSpacing: 0.1 }}>{d.label}</span>
        </div>
      )}
      {!d.badge && (
        <div style={{ fontSize: 10, fontWeight: 600, color: '#c8c8c4', marginBottom: d.sub ? 4 : 0 }}>{d.label}</div>
      )}
      {d.sub && <div style={{ fontSize: 10, color: '#7a7a76', lineHeight: 1.4 }}>{d.sub}</div>}
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

const handleStyle = {
  width: 10, height: 10, borderRadius: '50%',
  background: 'radial-gradient(circle at center, #fff 38%, rgba(255,255,255,0.55) 38%)',
  border: '1.5px solid rgba(255,255,255,0.45)',
}

const nodeTypes = {
  theme:        ThemeNode,
  pipeline:     PipelineNode,
  source:       SourceNode,
  agentContext: AgentContextNode,
  process:      ProcessNode,
  outputNode:   OutputNode,
}

const edgeTypes = {
  floating: FloatingEdge,
}

// ── Premium default pipeline ──────────────────────────────────────────────────
// Layout: sources (x=80) → input (x=340) → agentContext (x=590) → llm (x=960) → tts (x=1160) → output (x=1360)
// All process/output nodes centered at y=220, which aligns with the AgentContext card mid-point.

const initialNodes = [
  // Source column — stacked vertically
  { id: 'n-discord',  type: 'source',  position: { x: 80,   y: 100 }, data: { platform: 'discord' } },
  { id: 'n-telegram', type: 'source',  position: { x: 80,   y: 230 }, data: { platform: 'telegram' } },
  { id: 'n-twitch',   type: 'source',  position: { x: 80,   y: 360 }, data: { platform: 'twitch' } },

  // Input aggregator
  { id: 'n-input',    type: 'process', position: { x: 340,  y: 220 }, data: { label: 'Input', subLabel: 'INPUT', accent: '#EAB308', icon: 'input' } },

  // Agent Context group card
  { id: 'n-context',  type: 'agentContext', position: { x: 590, y: 80 }, data: {} },

  // Right pipeline
  { id: 'n-llm',      type: 'process', position: { x: 960,  y: 220 }, data: { label: 'LLM', subLabel: 'LLM', accent: '#6366F1', icon: 'llm' } },
  { id: 'n-tts',      type: 'process', position: { x: 1160, y: 220 }, data: { label: 'TTS', subLabel: 'TTS', accent: '#10B981', icon: 'tts' } },
  { id: 'n-output',   type: 'outputNode', position: { x: 1360, y: 220 }, data: {} },
]

const mkFloat = (id: string, source: string, target: string) => ({
  id, source, target,
  type: 'floating',
  style: { stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1.5 },
})

const initialEdges = [
  mkFloat('e-discord-input',   'n-discord',  'n-input'),
  mkFloat('e-telegram-input',  'n-telegram', 'n-input'),
  mkFloat('e-twitch-input',    'n-twitch',   'n-input'),
  mkFloat('e-input-context',   'n-input',    'n-context'),
  mkFloat('e-context-llm',     'n-context',  'n-llm'),
  mkFloat('e-llm-tts',         'n-llm',      'n-tts'),
  mkFloat('e-tts-output',      'n-tts',      'n-output'),
]

// ── Migration: pipeline → premium node types ──────────────────────────────────

const PLUGIN_TYPES = new Set(['emotion', 'memory', 'filter'])

function migrateLegacyNodes(nodes: RFNode[], edges: Edge[]): { nodes: RFNode[]; edges: Edge[] } {
  if (!nodes.some(n => n.type === 'pipeline')) return { nodes, edges }

  const removedIds = new Set<string>()
  const newNodes = nodes.flatMap(n => {
    if (n.type !== 'pipeline') return [n]
    const pt = (n.data as PipelineNodeData).pipelineType
    switch (pt) {
      case 'discord':         return [{ ...n, type: 'source',      data: { platform: 'discord' } }]
      case 'telegram':        return [{ ...n, type: 'source',      data: { platform: 'telegram' } }]
      case 'twitch':          return [{ ...n, type: 'source',      data: { platform: 'twitch' } }]
      case 'input':           return [{ ...n, type: 'process',     data: { label: 'Input', subLabel: 'INPUT', accent: '#EAB308', icon: 'input' } }]
      case 'context_builder': return [{ ...n, type: 'agentContext',data: {} }]
      case 'llm':             return [{ ...n, type: 'process',     data: { label: 'LLM', subLabel: 'LLM', accent: '#6366F1', icon: 'llm' } }]
      case 'tts':             return [{ ...n, type: 'process',     data: { label: 'TTS', subLabel: 'TTS', accent: '#10B981', icon: 'tts' } }]
      case 'output':          return [{ ...n, type: 'outputNode',  data: {} }]
      default:
        if (PLUGIN_TYPES.has(pt)) { removedIds.add(n.id); return [] }
        return [n]
    }
  })
  const newEdges = edges
    .filter(e => !removedIds.has(e.source) && !removedIds.has(e.target))
    .map(e => ({ ...e, type: 'floating', style: { stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1.5 } }))
  return { nodes: newNodes, edges: newEdges }
}

// ── Panel icons (14px) ────────────────────────────────────────────────────────

const PIcArrowIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M10.25 2.9996C10.6641 2.9996 10.9998 3.33557 11 3.7496C11 4.16382 10.6642 4.4996 10.25 4.4996H5.25C4.83592 4.4996 4.50021 4.83557 4.5 5.2496V18.7496C4.5 19.1638 4.83579 19.4996 5.25 19.4996H18.75C19.1642 19.4996 19.5 19.1638 19.5 18.7496V13.7496C19.5002 13.3356 19.8359 12.9996 20.25 12.9996C20.6641 12.9996 20.9998 13.3356 21 13.7496V18.7496C21 19.9922 19.9926 20.9996 18.75 20.9996H5.25C4.00736 20.9996 3 19.9922 3 18.7496V5.2496C3.00021 4.00714 4.00749 2.9996 5.25 2.9996H10.25ZM19.7197 3.21933C20.0126 2.92685 20.4875 2.92678 20.7803 3.21933C21.073 3.51219 21.0729 3.98705 20.7803 4.27988L16.0576 8.9996H19.25C19.6641 8.9996 19.9998 9.33557 20 9.7496C20 10.1638 19.6642 10.4996 19.25 10.4996H14.25C14.0756 10.4996 13.9174 10.4374 13.79 10.3375C13.7808 10.3303 13.7717 10.3228 13.7627 10.315C13.7341 10.2904 13.7072 10.2646 13.6826 10.2359C13.6741 10.2261 13.6661 10.2158 13.6582 10.2057C13.5606 10.079 13.5 9.92186 13.5 9.7496V4.7496C13.5002 4.33557 13.8359 3.9996 14.25 3.9996C14.6641 3.9996 14.9998 4.33557 15 4.7496V7.93515L19.7197 3.21933Z" fill="currentColor"/>
  </svg>
)
const PIcThinking = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 11.5858 2.33579 11.25 2.75 11.25C3.16421 11.25 3.5 11.5858 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5C11.5858 3.5 11.25 3.16421 11.25 2.75C11.25 2.33579 11.5858 2 12 2ZM12 6.4502C12.4142 6.4502 12.75 6.78598 12.75 7.2002V11.5361L15.9355 13.1289C16.306 13.3142 16.4557 13.7653 16.2705 14.1357C16.0851 14.5059 15.635 14.6558 15.2646 14.4707L11.665 12.6709C11.411 12.5439 11.2501 12.284 11.25 12V7.2002C11.25 6.78598 11.5858 6.4502 12 6.4502ZM3.375 7.7793C3.85821 7.7793 4.24993 8.1711 4.25 8.6543C4.25 9.13755 3.85825 9.5293 3.375 9.5293C2.89175 9.5293 2.5 9.13755 2.5 8.6543C2.50007 8.1711 2.89179 7.7793 3.375 7.7793ZM5.47852 4.60352C5.96154 4.60378 6.35352 4.99543 6.35352 5.47852C6.35325 5.96138 5.96138 6.35325 5.47852 6.35352C4.99543 6.35352 4.60378 5.96154 4.60352 5.47852C4.60352 4.99527 4.99527 4.60352 5.47852 4.60352ZM8.625 2.5C9.10825 2.5 9.5 2.89175 9.5 3.375C9.5 3.85825 9.10825 4.25 8.625 4.25C8.14175 4.25 7.75 3.85825 7.75 3.375C7.75 2.89175 8.14175 2.5 8.625 2.5Z" fill="currentColor"/>
  </svg>
)
const PIcVoice = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M10.25 2C10.6642 2 11 2.33579 11 2.75V21.25C11 21.6642 10.6642 22 10.25 22C9.83579 22 9.5 21.6642 9.5 21.25V2.75C9.5 2.33579 9.83579 2 10.25 2ZM17.75 5.25C18.1642 5.25 18.5 5.58579 18.5 6V18C18.5 18.4142 18.1642 18.75 17.75 18.75C17.3358 18.75 17 18.4142 17 18V6C17 5.58579 17.3358 5.25 17.75 5.25ZM6.5 7.25C6.91421 7.25 7.25 7.58579 7.25 8V16C7.25 16.4142 6.91421 16.75 6.5 16.75C6.08579 16.75 5.75 16.4142 5.75 16V8C5.75 7.58579 6.08579 7.25 6.5 7.25ZM14 7.25C14.4142 7.25 14.75 7.58579 14.75 8V16C14.75 16.4142 14.4142 16.75 14 16.75C13.5858 16.75 13.25 16.4142 13.25 16V8C13.25 7.58579 13.5858 7.25 14 7.25ZM2.75 10.25C3.16421 10.25 3.5 10.5858 3.5 11V13C3.5 13.4142 3.16421 13.75 2.75 13.75C2.33579 13.75 2 13.4142 2 13V11C2 10.5858 2.33579 10.25 2.75 10.25ZM21.25 10.25C21.6642 10.25 22 10.5858 22 11V13C22 13.4142 21.6642 13.75 21.25 13.75C20.8358 13.75 20.5 13.4142 20.5 13V11C20.5 10.5858 20.8358 10.25 21.25 10.25Z" fill="currentColor"/>
  </svg>
)
const PIcArrowOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M10.25 3C10.6642 3 11 3.33579 11 3.75C11 4.16421 10.6642 4.5 10.25 4.5H5.25C4.83579 4.5 4.5 4.83579 4.5 5.25V18.75C4.5 19.1642 4.83579 19.5 5.25 19.5H18.75C19.1642 19.5 19.5 19.1642 19.5 18.75V13.75C19.5 13.3358 19.8358 13 20.25 13C20.6642 13 21 13.3358 21 13.75V18.75C21 19.9926 19.9926 21 18.75 21H5.25C4.00736 21 3 19.9926 3 18.75V5.25C3 4.00736 4.00736 3 5.25 3H10.25ZM20.25 3C20.6642 3 21 3.33579 21 3.75V8.75C21 9.16421 20.6642 9.5 20.25 9.5C19.8358 9.5 19.5 9.16421 19.5 8.75V5.54883L14.7803 10.2764C14.4876 10.569 14.0127 10.5689 13.7197 10.2764C13.427 9.98367 13.4272 9.5088 13.7197 9.21582L18.4277 4.5H15.25C14.8358 4.5 14.5 4.16421 14.5 3.75C14.5 3.33579 14.8358 3 15.25 3H20.25Z" fill="currentColor"/>
  </svg>
)
const PIcLightning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12.25 10.25L14.0352 4.41843C14.4406 3.09414 12.7114 2.19134 11.8565 3.28093L5.15342 11.8241C4.38109 12.8084 5.08236 14.25 6.33353 14.25H11.75L10.0219 19.6646C9.60158 20.9817 11.3144 21.9057 12.1843 20.8311L18.7717 12.6938C19.5656 11.7131 18.8676 10.25 17.6058 10.25H12.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)
const PIcMemory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 3C16.8325 3 20.75 6.91751 20.75 11.75C20.75 16.5825 16.8325 20.5 12 20.5H6.11621L6.72461 21.1084C7.01747 21.4013 7.0174 21.876 6.72461 22.1689C6.43172 22.4618 5.95696 22.4618 5.66406 22.1689L3.71973 20.2246C3.42695 19.9317 3.42687 19.4569 3.71973 19.1641L5.66406 17.2197C5.95692 16.9269 6.43171 16.9269 6.72461 17.2197C7.0175 17.5126 7.0175 17.9874 6.72461 18.2803L6.00488 19H12C16.0041 19 19.25 15.7541 19.25 11.75C19.25 7.74594 16.0041 4.5 12 4.5C7.99594 4.5 4.75 7.74594 4.75 11.75V12C4.75 12.4142 4.41421 12.75 4 12.75C3.58579 12.75 3.25 12.4142 3.25 12V11.75C3.25 6.91751 7.16751 3 12 3ZM15.8105 10.9551C15.9735 10.5743 16.4142 10.3977 16.7949 10.5605C17.1757 10.7235 17.3523 11.1642 17.1895 11.5449C16.7471 12.5783 15.884 13.4999 14.7002 13.5C13.9702 13.5 13.3621 13.1496 12.8994 12.6387C12.4368 13.1492 11.8293 13.5 11.0996 13.5C10.3699 13.4999 9.76238 13.1494 9.2998 12.6387C8.83717 13.1494 8.22978 13.5 7.5 13.5C7.08579 13.5 6.75 13.1642 6.75 12.75C6.75 12.3358 7.08579 12 7.5 12C7.81873 12 8.27875 11.7297 8.61035 10.9551C8.72843 10.6792 8.99973 10.5001 9.2998 10.5C9.59996 10.5 9.87115 10.6791 9.98926 10.9551C10.3207 11.7295 10.7809 11.9998 11.0996 12C11.4184 12 11.8793 11.7298 12.2109 10.9551L12.2617 10.8564C12.3968 10.6372 12.6377 10.5 12.9004 10.5C13.2004 10.5002 13.4718 10.6793 13.5898 10.9551C13.9214 11.7296 14.3815 12 14.7002 12C15.0189 11.9999 15.479 11.7296 15.8105 10.9551Z" fill="currentColor"/>
  </svg>
)
const PIcFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M9.25 15.5C9.66421 15.5 10 15.8358 10 16.25V17H20.25C20.6642 17 21 17.3358 21 17.75C21 18.1642 20.6642 18.5 20.25 18.5H10V19.25C10 19.6642 9.66421 20 9.25 20C8.83579 20 8.5 19.6642 8.5 19.25V16.25C8.5 15.8358 8.83579 15.5 9.25 15.5ZM5.75 17C6.16421 17 6.5 17.3358 6.5 17.75C6.5 18.1642 6.16421 18.5 5.75 18.5H3.75C3.33579 18.5 3 18.1642 3 17.75C3 17.3358 3.33579 17 3.75 17H5.75ZM17 9.75C17.4142 9.75 17.75 10.0858 17.75 10.5V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H17.75V13.5C17.75 13.9142 17.4142 14.25 17 14.25C16.5858 14.25 16.25 13.9142 16.25 13.5V10.5C16.25 10.0858 16.5858 9.75 17 9.75ZM13.25 11.25C13.6642 11.25 14 11.5858 14 12C14 12.4142 13.6642 12.75 13.25 12.75H3.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25H13.25ZM12 4C12.4142 4 12.75 4.33579 12.75 4.75V5.5H20.25C20.6642 5.5 21 5.83579 21 6.25C21 6.66421 20.6642 7 20.25 7H12.75V7.75C12.75 8.16421 12.4142 8.5 12 8.5C11.5858 8.5 11.25 8.16421 11.25 7.75V4.75C11.25 4.33579 11.5858 4 12 4ZM8.25 5.5C8.66421 5.5 9 5.83579 9 6.25C9 6.66421 8.66421 7 8.25 7H3.75C3.33579 7 3 6.66421 3 6.25C3 5.83579 3.33579 5.5 3.75 5.5H8.25Z" fill="currentColor"/>
  </svg>
)

// ── Categorized Add-Node panel ────────────────────────────────────────────────

const PANEL_CATEGORIES: {
  label: string
  items: { type: PipelineNodeType; icon: React.ReactNode; shortcut: string }[]
}[] = [
  {
    label: 'Connectors',
    items: [
      { type: 'discord',  icon: <PIcArrowIn />,  shortcut: 'D' },
      { type: 'twitch',   icon: <PIcArrowIn />,  shortcut: 'W' },
      { type: 'telegram', icon: <PIcArrowIn />,  shortcut: 'G' },
    ],
  },
  {
    label: 'Core',
    items: [
      { type: 'input',           icon: <PIcArrowIn />,  shortcut: 'I' },
      { type: 'context_builder', icon: <PIcFilter />,   shortcut: 'C' },
      { type: 'output',          icon: <PIcArrowOut />, shortcut: 'O' },
    ],
  },
  {
    label: 'Models',
    items: [
      { type: 'llm', icon: <PIcThinking />, shortcut: 'L' },
    ],
  },
  {
    label: 'Processors',
    items: [
      { type: 'tts', icon: <PIcVoice />, shortcut: 'T' },
    ],
  },
  {
    label: 'Plugins',
    items: [
      { type: 'emotion', icon: <PIcLightning />, shortcut: 'E' },
      { type: 'memory',  icon: <PIcMemory />,    shortcut: 'M' },
      { type: 'filter',  icon: <PIcFilter />,    shortcut: 'F' },
    ],
  },
]

interface AddNodePanelProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onAdd: (type: PipelineNodeType) => void
  onClose: () => void
}

function AddNodePanel({ anchorRef, onAdd, onClose }: AddNodePanelProps) {
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [anchorRef, onClose])

  return (
    <div
      style={{
        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, minWidth: 210,
        background: '#0F1117',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10, padding: '4px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4)',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {PANEL_CATEGORIES.map((cat, ci) => (
        <div key={cat.label}>
          {ci > 0 && (
            <div style={{ margin: '3px 6px', height: 1, background: 'rgba(255,255,255,0.06)' }} />
          )}
          <div style={{
            padding: '5px 10px 2px',
            fontSize: 10, fontWeight: 500,
            color: '#4B5563', letterSpacing: '0.01em',
          }}>
            {cat.label}
          </div>
          {cat.items.map(({ type, icon, shortcut }) => {
            const def = NODE_DEFINITIONS[type]
            return (
              <button
                key={type}
                onClick={() => { onAdd(type); onClose() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 6, border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  color: '#E6EAF2', transition: 'background 0.08s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ color: def.accent, flexShrink: 0, display: 'flex' }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 13, textAlign: 'left', letterSpacing: '-0.01em' }}>
                  {def.label}
                </span>
                <span style={{ fontSize: 11, color: '#4B5563', letterSpacing: '0.02em' }}>
                  {shortcut}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── SVG Icons (from /Users/nikx/Downloads/Icons, fill → currentColor) ────────

const IcLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C14.7614 2 17 4.23858 17 7V8.5H18.75C19.9926 8.5 21 9.50736 21 10.75V18.75C21 19.9926 19.9926 21 18.75 21H5.25C4.00736 21 3 19.9926 3 18.75V10.75C3 9.50736 4.00736 8.5 5.25 8.5H7V7C7 4.23858 9.23858 2 12 2ZM5.25 10C4.83579 10 4.5 10.3358 4.5 10.75V18.75C4.5 19.1642 4.83579 19.5 5.25 19.5H18.75C19.1642 19.5 19.5 19.1642 19.5 18.75V10.75C19.5 10.3358 19.1642 10 18.75 10H5.25ZM12 12C12.8284 12 13.5 12.6716 13.5 13.5C13.5 14.0953 13.152 14.6073 12.6494 14.8496L13.25 17.25H10.75L11.3496 14.8496C10.8474 14.6072 10.5 14.095 10.5 13.5C10.5 12.6716 11.1716 12 12 12ZM12 3.5C10.067 3.5 8.5 5.067 8.5 7V8.5H15.5V7C15.5 5.067 13.933 3.5 12 3.5Z" fill="currentColor"/>
  </svg>
)
const IcLockOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C14.7614 2.00001 17 4.23859 17 7V8.5H18.75C19.9926 8.5 21 9.50736 21 10.75V18.75C21 19.9926 19.9926 21 18.75 21H5.25C4.00736 21 3 19.9926 3 18.75V10.75C3 9.50736 4.00736 8.5 5.25 8.5H15.5V7C15.5 5.06701 13.933 3.50001 12 3.5C10.6635 3.5 9.50034 4.24895 8.91016 5.35352C8.71489 5.7187 8.26077 5.8563 7.89551 5.66113C7.53033 5.46587 7.39272 5.01175 7.58789 4.64648C8.42857 3.07328 10.0883 2 12 2ZM5.25 10C4.83579 10 4.5 10.3358 4.5 10.75V18.75C4.5 19.1642 4.83579 19.5 5.25 19.5H18.75C19.1642 19.5 19.5 19.1642 19.5 18.75V10.75C19.5 10.3358 19.1642 10 18.75 10H5.25ZM12 12C12.8284 12 13.5 12.6716 13.5 13.5C13.5 14.0953 13.152 14.6073 12.6494 14.8496L13.25 17.25H10.75L11.3496 14.8496C10.8474 14.6072 10.5 14.095 10.5 13.5C10.5 12.6716 11.1716 12 12 12Z" fill="currentColor"/>
  </svg>
)
const IcSelect = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 1L3 12.5L6 9.5L8.5 14.5L10 13.5L7.5 8.5L11.5 8.5L3 1Z" fill="currentColor"/>
  </svg>
)
const IcHand = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M11.875 2C12.8752 2 13.729 2.61898 14.0791 3.49414C14.3949 3.33886 14.7493 3.25 15.125 3.25C16.4367 3.25 17.5 4.31332 17.5 5.625V6.16797C17.7709 6.06046 18.0658 6 18.375 6C19.6867 6 20.75 7.06332 20.75 8.375V13.125C20.75 18.0265 16.7765 22 11.875 22C6.97347 22 3 18.0265 3 13.125V10.75C3 9.7835 3.7835 9 4.75 9H5C5.45058 9 5.87468 9.11065 6.25 9.30273V5.625C6.25 4.31332 7.31332 3.25 8.625 3.25C9.00034 3.25 9.35435 3.3391 9.66992 3.49414C10.0199 2.6188 10.8747 2 11.875 2ZM11.875 3.5C11.3918 3.5 11 3.89175 11 4.375V11C11 11.4142 10.6642 11.75 10.25 11.75C9.83579 11.75 9.5 11.4142 9.5 11V5.625C9.5 5.14175 9.10825 4.75 8.625 4.75C8.14175 4.75 7.75 5.14175 7.75 5.625V13.0098C9.56629 13.138 11 14.6511 11 16.5C11 16.9142 10.6642 17.25 10.25 17.25C9.83579 17.25 9.5 16.9142 9.5 16.5C9.5 15.3954 8.60457 14.5 7.5 14.5H7C6.58579 14.5 6.25 14.1642 6.25 13.75V11.75C6.25 11.0596 5.69036 10.5 5 10.5H4.75C4.61193 10.5 4.5 10.6119 4.5 10.75V13.125C4.5 17.1981 7.8019 20.5 11.875 20.5C15.9481 20.5 19.25 17.1981 19.25 13.125V8.375C19.25 7.89175 18.8582 7.5 18.375 7.5C17.8918 7.5 17.5 7.89175 17.5 8.375V11C17.5 11.4142 17.1642 11.75 16.75 11.75C16.3358 11.75 16 11.4142 16 11V5.625C16 5.14175 15.6082 4.75 15.125 4.75C14.6418 4.75 14.25 5.14175 14.25 5.625V11C14.25 11.4142 13.9142 11.75 13.5 11.75C13.0858 11.75 12.75 11.4142 12.75 11V4.375C12.75 3.89175 12.3582 3.5 11.875 3.5Z" fill="currentColor"/>
  </svg>
)
const IcAdd = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.9502C12.4142 2.9502 12.75 3.28598 12.75 3.7002V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H12.75V20.2998C12.7499 20.7139 12.4141 21.0498 12 21.0498C11.5859 21.0498 11.2501 20.7139 11.25 20.2998V12.75H3.7002C3.28598 12.75 2.9502 12.4142 2.9502 12C2.9502 11.5858 3.28598 11.25 3.7002 11.25H11.25V3.7002C11.25 3.28598 11.5858 2.9502 12 2.9502Z" fill="currentColor"/>
  </svg>
)
const IcConnector = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9.25 6C10.0784 6 10.75 6.67157 10.75 7.5V13.25H16.75C17.5784 13.25 18.25 13.9216 18.25 14.75V20.5C18.25 21.3284 17.5784 22 16.75 22H3.5C2.67157 22 2 21.3284 2 20.5V7.5C2 6.67157 2.67157 6 3.5 6H9.25ZM3.5 20.5H9.25V14.75H3.5V20.5ZM10.75 20.5H16.75V14.75H10.75V20.5ZM3.5 13.25H9.25V7.5H3.5V13.25ZM20.5 2C21.3284 2 22 2.67157 22 3.5V9.25C22 10.0267 21.4097 10.6654 20.6533 10.7422L20.5 10.75H14.75L14.5967 10.7422C13.8907 10.6705 13.3295 10.1093 13.2578 9.40332L13.25 9.25V3.5C13.25 2.67157 13.9216 2 14.75 2H20.5ZM14.75 9.25H20.5V3.5H14.75V9.25Z" fill="currentColor"/>
  </svg>
)
const IcTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M13.5469 2C14.2949 2 14.9772 2.42806 15.3027 3.10156L16.2197 5H21.25L21.3271 5.00391C21.7051 5.04253 22 5.36184 22 5.75C22 6.13816 21.7051 6.45747 21.3271 6.49609L21.25 6.5H19.4307L18.1016 20.2383C18.0046 21.2376 17.1642 22 16.1602 22H7.83984C6.83579 22 5.99537 21.2376 5.89844 20.2383L4.56934 6.5H2.75C2.33579 6.5 2 6.16421 2 5.75C2 5.33579 2.33579 5 2.75 5H7.75L8.5 3.2002L8.56152 3.06641C8.89192 2.41589 9.56199 2.00007 10.2998 2H13.5469ZM7.3916 20.0938C7.41411 20.3242 7.60824 20.5 7.83984 20.5H16.1602C16.3918 20.5 16.5859 20.3242 16.6084 20.0938L17.9238 6.5H6.07617L7.3916 20.0938ZM10.2002 10C10.6143 10.0001 10.9502 10.3359 10.9502 10.75V16.25L10.9463 16.3271C10.9077 16.705 10.5883 16.9999 10.2002 17C9.81204 17 9.49274 16.7051 9.4541 16.3271L9.4502 16.25V10.75C9.4502 10.3358 9.78598 10 10.2002 10ZM13.7998 10C14.214 10 14.5498 10.3358 14.5498 10.75V16.25C14.5498 16.6642 14.214 17 13.7998 17C13.3857 16.9999 13.0498 16.6641 13.0498 16.25V10.75C13.0498 10.3359 13.3857 10.0001 13.7998 10ZM10.2998 3.5C10.1409 3.50007 9.99566 3.58363 9.91504 3.7168L9.88477 3.77734L9.375 5H14.5547L13.9521 3.75391C13.877 3.59865 13.7194 3.5 13.5469 3.5H10.2998Z" fill="currentColor"/>
  </svg>
)

// ── Toolbar ───────────────────────────────────────────────────────────────────

interface ToolbarProps {
  active: Tool
  locked: boolean
  onTool: (t: Tool) => void
  onAddClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteSelected: () => void
  saveStatus?: SaveStatus
  lastSavedAt?: Date | null
}

const T_BG      = '#0F1117'
const T_BORDER  = 'rgba(255,255,255,0.10)'
const T_ICON    = '#6B7280'
const T_ACTIVE  = '#E6EAF2'
const T_ACT_BG  = 'rgba(255,255,255,0.08)'
const T_HOVER   = 'rgba(255,255,255,0.05)'
const T_DIV     = <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />

function Toolbar({ active, locked, onTool, onAddClick, onDeleteSelected, saveStatus, lastSavedAt }: ToolbarProps) {
  const btn = (
    tool: Tool,
    icon: React.ReactNode,
    title: string,
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
    danger = false,
  ) => {
    const isActive = active === tool
    const baseColor = danger ? '#a05050' : isActive ? T_ACTIVE : T_ICON
    return (
      <button
        key={title}
        title={title}
        onClick={onClick ?? (() => onTool(tool))}
        style={{
          width: 34, height: 34, border: 'none', borderRadius: 8,
          background: isActive ? T_ACT_BG : 'transparent',
          color: baseColor,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.1s, color 0.1s', flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!isActive) {
            ;(e.currentTarget as HTMLElement).style.background = danger ? 'rgba(200,60,60,0.10)' : T_HOVER
            ;(e.currentTarget as HTMLElement).style.color = danger ? '#e07070' : T_ACTIVE
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = baseColor
          }
        }}
      >
        {icon}
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', alignItems: 'center', gap: 1,
      background: T_BG, border: `1px solid ${T_BORDER}`, borderRadius: 12,
      padding: '4px 6px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {btn('lock', locked ? <IcLock /> : <IcLockOpen />, locked ? 'Unlock' : 'Lock')}
      {T_DIV}
      {btn('select', <IcSelect />, 'Select (V)')}
      {btn('pan',    <IcHand />,   'Pan (H)')}
      {T_DIV}
      {btn('select', <IcAdd />, 'Add node', onAddClick)}
      {btn('connect', <IcConnector />, 'Connect nodes')}
      {T_DIV}
      {btn('select', <IcTrash />, 'Delete selected', () => onDeleteSelected(), true)}
      {saveStatus && (
        <>
          {T_DIV}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 6px', fontSize: 11, letterSpacing: '0.01em',
            color: STATUS_COLOR[saveStatus],
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: STATUS_COLOR[saveStatus], flexShrink: 0,
            }} />
            {saveStatus === 'saving' ? 'Saving…'
             : saveStatus === 'dirty'  ? 'Unsaved'
             : saveStatus === 'error'  ? 'Save failed'
             : lastSavedAt ? `Saved ${timeAgo(lastSavedAt)}`
             : 'Saved'}
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

let nodeCounter = initialNodes.length + 1

interface GraphBuilderPageProps {
  projectId?: string
}

export default function GraphBuilderPage({ projectId }: GraphBuilderPageProps) {
  const characterId = projectId
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(initialNodes as RFNode[])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges as Edge[])
  const [tool, setTool]           = useState<Tool>('select')
  const [locked, setLocked]       = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<RFNode | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const addBtnRef = useRef<HTMLButtonElement | null>(null)
  const rfInstance = useRef<ReactFlowInstance | null>(null)

  // ── Persistence refs ────────────────────────────────────────────────────────
  const saveRef = useRef({ dirtyState: 'clean' as 'clean' | 'dirty' | 'saving', initialLoad: true })
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable refs so performSave closure doesn't go stale
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  // ── performSave ─────────────────────────────────────────────────────────────
  const performSave = useCallback(async () => {
    if (!characterId) return
    if (saveRef.current.dirtyState !== 'dirty') return

    saveRef.current.dirtyState = 'saving'
    setSaveStatus('saving')

    try {
      await saveGraph(characterId, nodesRef.current, edgesRef.current)
      saveRef.current.dirtyState = 'clean'
      setLastSavedAt(new Date())
      setSaveStatus('saved')
      localStorage.setItem(LS_KEY(characterId), JSON.stringify({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        savedAt: Date.now(),
      }))
    } catch (err) {
      saveRef.current.dirtyState = 'dirty'
      // 404 = backend ownership check failed (not a network/server error) — show Unsaved, not Save failed
      const is404 = err instanceof Error && 'status' in err && (err as { status: number }).status === 404
      setSaveStatus(is404 ? 'dirty' : 'error')
    }
  }, [characterId])

  // ── scheduleAutosave ────────────────────────────────────────────────────────
  const scheduleAutosave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => void performSave(), 600)
  }, [performSave])

  // ── markDirty helper ────────────────────────────────────────────────────────
  const markDirty = useCallback(() => {
    if (saveRef.current.initialLoad) return
    if (saveRef.current.dirtyState === 'clean') {
      saveRef.current.dirtyState = 'dirty'
      setSaveStatus('dirty')
    }
    scheduleAutosave()
  }, [scheduleAutosave])

  // ── Load on mount — localStorage first, backend authoritative ──────────────
  useEffect(() => {
    if (!characterId) return
    saveRef.current.initialLoad = true
    saveRef.current.dirtyState = 'clean'
    setSaveStatus('saved')

    // Phase 1: localStorage — zero latency
    let localTimestamp = 0
    let localLoaded = false
    try {
      const raw = localStorage.getItem(LS_KEY(characterId))
      if (raw) {
        const { nodes: ln, edges: le, savedAt } = JSON.parse(raw) as { nodes: RFNode[]; edges: Edge[]; savedAt: number }
        const { nodes: mn, edges: me } = migrateLegacyNodes(ln, le)
        setNodes(mn); setEdges(me)
        nodeCounter = mn.length + 1
        localTimestamp = savedAt ?? 0
        localLoaded = true
      }
    } catch { /* corrupt cache — ignore */ }

    // Phase 2: backend — wins if newer and local is clean
    getGraph(characterId)
      .then(dto => {
        if (!dto) return
        // Rule 1: if user made changes during load → preserve local
        if (saveRef.current.dirtyState === 'dirty') return
        const backendMs = new Date(dto.updatedAt).getTime()
        // Rule 2: backend newer → use backend
        // Rule 3: local up-to-date or backend unavailable → keep local
        if (!localLoaded || backendMs > localTimestamp) {
          const { nodes: bn, edges: be } = graphDtoToFlow(dto)
          const { nodes: mn, edges: me } = migrateLegacyNodes(bn, be)
          setNodes(mn); setEdges(me)
          nodeCounter = mn.length + 1
        }
      })
      .catch(console.error)
      // Delay clearing initialLoad so ReactFlow's first layout position events
      // (which fire after the async fetch resolves) don't mark the graph dirty.
      .finally(() => { setTimeout(() => { saveRef.current.initialLoad = false }, 300) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  // ── Change wrappers — dirty tracking via user interaction, not state ────────
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (!saveRef.current.initialLoad) {
      // Anything that isn't purely selection = structural change
      const isStructural = changes.some(c => c.type !== 'select')
      if (isStructural) markDirty()
    }
    onNodesChange(changes)
  }, [onNodesChange, markDirty])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (!saveRef.current.initialLoad && changes.length > 0) markDirty()
    onEdgesChange(changes)
  }, [onEdgesChange, markDirty])

  // ── Sync selectedNode with live node data so name edits persist ─────────────
  useEffect(() => {
    if (!selectedNode) return
    const live = nodes.find(n => n.id === selectedNode.id)
    if (live) setSelectedNode(live)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes])

  const isValidConnection = useCallback(
    (connection: Connection | Edge): boolean => {
      const sourceNode = nodes.find(n => n.id === connection.source)
      const targetNode = nodes.find(n => n.id === connection.target)
      if (!sourceNode || !targetNode) return false

      const sourceDef = NODE_DEFINITIONS[(sourceNode.data as PipelineNodeData).pipelineType]
      const targetDef = NODE_DEFINITIONS[(targetNode.data as PipelineNodeData).pipelineType]
      if (!sourceDef || !targetDef) return false

      const sourcePort = sourceDef.outputs.find(p => p.name === (connection.sourceHandle ?? undefined))
      const targetPort = targetDef.inputs.find(p => p.name === (connection.targetHandle ?? undefined))
      if (!sourcePort || !targetPort) return false

      return sourcePort.dataType === targetPort.dataType
    },
    [nodes],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source)
      const def = sourceNode
        ? NODE_DEFINITIONS[(sourceNode.data as PipelineNodeData).pipelineType]
        : null
      const port = def?.outputs.find(p => p.name === connection.sourceHandle)
      const color = port ? DATA_TYPE_COLOR[port.dataType] : 'rgba(255,255,255,0.22)'
      setEdges(eds => addEdge({ ...connection, type: 'floating', style: { stroke: color, strokeWidth: 1.5 } }, eds))
      markDirty()
    },
    [setEdges, nodes, markDirty],
  )

  const handleTool = (t: Tool) => {
    if (t === 'lock') { setLocked(l => !l); return }
    setTool(t)
  }

  const handleAddNode = (type: PipelineNodeType) => {
    const id = `node-${nodeCounter++}`
    const center = rfInstance.current
      ? rfInstance.current.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: 300 + Math.random() * 200, y: 200 }
    setNodes(ns => [...ns, { id, type: 'pipeline', position: center, data: { pipelineType: type } }])
    markDirty()
  }

  const handleNameChange = useCallback((nodeId: string, name: string) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, name } } : n))
    markDirty()
  }, [setNodes, markDirty])

  const handleNodeDataChange = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n))
    markDirty()
  }, [setNodes, markDirty])

  const handleDeleteSelected = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setNodes((ns: any[]) => ns.filter((n: any) => !n.selected))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEdges((es: any[]) => es.filter((e: any) => !e.selected))
    markDirty()
  }

  const panOnDrag = tool === 'pan' ? [0, 1, 2] : [1, 2]

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* ── Graph area ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-0)' }}>
        {/* Dot grid */}
        <div style={{
          pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <Toolbar
          active={tool}
          locked={locked}
          onTool={handleTool}
          onAddClick={() => setShowAddPanel(p => !p)}
          onDeleteSelected={handleDeleteSelected}
          saveStatus={characterId ? saveStatus : undefined}
          lastSavedAt={characterId ? lastSavedAt : undefined}
        />

        {showAddPanel && (
          <AddNodePanel
            anchorRef={addBtnRef}
            onAdd={handleAddNode}
            onClose={() => setShowAddPanel(false)}
          />
        )}

        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'transparent' }}>
          <style>{`
            .react-flow,
            .react-flow.dark,
            [data-testid="rf__wrapper"],
            .react-flow__renderer { background: transparent !important; }
            .react-flow__background { display: none; }
            .react-flow__attribution { display: none; }
            .react-flow__handle { transition: transform 0.15s ease, opacity 0.15s; }
            .react-flow__node .react-flow__handle { opacity: 0.8; }
            .react-flow__node:hover .react-flow__handle,
            .react-flow__node.selected .react-flow__handle { opacity: 1; }
            .react-flow__handle:hover {
              transform: scale(1.25) !important;
              opacity: 1 !important;
            }
            .react-flow__controls {
              background: #0F1117 !important; border: 1px solid rgba(255,255,255,0.10) !important;
              border-radius: 9px !important; overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
            }
            .react-flow__controls-button {
              background: #0F1117 !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important;
              color: #6B7280 !important;
            }
            .react-flow__controls-button:last-child { border-bottom: none !important; }
            .react-flow__controls-button:hover { background: rgba(255,255,255,0.05) !important; }
            .react-flow__controls-button svg { fill: #6B7280 !important; }
          `}</style>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onInit={inst => { rfInstance.current = inst as unknown as ReactFlowInstance }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.25 }}
            panOnScroll
            panOnDrag={panOnDrag as [number, ...number[]]}
            zoomOnScroll
            nodesDraggable={!locked}
            nodesConnectable={!locked}
            elementsSelectable={!locked}
            connectOnClick={tool === 'connect'}
            defaultEdgeOptions={{ type: 'floating', style: { stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1.5 } }}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_e, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
          >
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </div>

      {/* ── Node inspector panel ─────────────────────────────────────────── */}
      {selectedNode && (
        <NodeInspectorPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onNameChange={handleNameChange}
          onNodeDataChange={handleNodeDataChange}
        />
      )}
    </div>
  )
}
