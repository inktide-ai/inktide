'use client'

import { useState, useCallback, useEffect } from 'react'
import { useShortcut } from '@/shared/lib/keyboard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { X } from 'lucide-react'
import type { Node as RFNode } from '@xyflow/react'
import { NODE_DEFINITIONS } from '../nodes/node-definitions'
import type { PipelineNodeData } from '../nodes/pipeline-node'
import {
  NODE_ICONS,
  MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH,
  Section, TextCell, InputGrid,
} from './inspector-primitives'
import { LlmCfg, LlmInspector, defaultLlmCfg } from './llm-inspector'

// ── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
  node: RFNode
  onClose: () => void
  onNameChange: (nodeId: string, name: string) => void
  onNodeDataChange?: (nodeId: string, patch: Record<string, unknown>) => void
}

export default function NodeInspectorPanel({ node, onClose, onNameChange, onNodeDataChange }: Props) {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const nodeData = node.data as PipelineNodeData
  const def = NODE_DEFINITIONS[nodeData.pipelineType]
  if (!def) return null   // new node types (process, source, agentContext, outputNode) have no pipeline config
  const name = (nodeData.name as string | undefined) ?? def.label

  const [llmCfg, setLlmCfg] = useState<LlmCfg>(() => defaultLlmCfg(nodeData))

  // Re-initialize when a different node is selected
  useEffect(() => {
    if (nodeData.pipelineType === 'llm')
      setLlmCfg(defaultLlmCfg(nodeData))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id])

  // Propagate LLM config changes back to node data, debounced 800ms.
  // Prevents partial API keys and rapid field edits from firing a graph save on every keystroke.
  const debouncedLlmCfg = useDebounce(llmCfg, 800)
  useEffect(() => {
    if (nodeData.pipelineType !== 'llm') return
    onNodeDataChange?.(node.id, debouncedLlmCfg as unknown as Record<string, unknown>)
  // node.id and onNodeDataChange intentionally excluded: stable values that must not reset
  // the debounce; node selection change is handled by the re-init effect above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLlmCfg, nodeData.pipelineType])

  const set = useCallback(<K extends keyof LlmCfg>(key: K, val: LlmCfg[K]) => {
    setLlmCfg(c => ({ ...c, [key]: val }))
  }, [])

  useShortcut('escape', onClose, { priority: 10 })

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    const onMove = (mv: MouseEvent) => {
      const delta = startX - mv.clientX
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + delta)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full relative bg-[var(--inspector-bg)] border-l border-[var(--border-subtle)] animate-[inspectorIn_0.2s_cubic-bezier(0.22,1,0.36,1)_both]"
      style={{ width: panelWidth }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-white/[0.08] transition-colors"
      />

      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0 h-10 pl-3 pr-2 border-b border-[var(--border-subtle)]">
        <span className="flex items-center justify-center shrink-0 text-[#8E8B86]">
          {NODE_ICONS[nodeData.pipelineType]}
        </span>
        <span className="flex-1 truncate text-sm font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {def.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent"
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto text-xs text-[var(--text-primary)]">

        {/* Basic — all nodes */}
        <Section title="Basic">
          <div className="flex flex-col gap-1">
            <InputGrid legend="Name and ID">
              <TextCell label="Name" value={name} onChange={v => onNameChange(node.id, v)} />
              <TextCell label="ID" value={node.id} readOnly />
            </InputGrid>
            <TextCell label="Type" value={def.label} dark readOnly />
          </div>
        </Section>

        {/* LLM — model + parameters */}
        {nodeData.pipelineType === 'llm' && (
          <LlmInspector llmCfg={llmCfg} set={set} />
        )}

      </div>
    </div>
  )
}
