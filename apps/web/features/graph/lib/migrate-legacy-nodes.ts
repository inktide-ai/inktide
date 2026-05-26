import type { Node as RFNode, Edge } from '@xyflow/react'
import type { PipelineNodeData } from '../nodes/pipeline-node'

const PLUGIN_TYPES = new Set(['emotion', 'memory', 'filter'])

export function migrateLegacyNodes(nodes: RFNode[], edges: Edge[]): { nodes: RFNode[]; edges: Edge[] } {
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
