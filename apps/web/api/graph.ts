import { apiFetch, jsonOrThrow } from './client'
import type { Node as RFNode, Edge } from '@xyflow/react'
import type { PipelineNodeData } from '@/features/graph/nodes/pipeline-node'
import type { PipelineNodeType, NodeDefinition } from '@/features/graph/nodes/node-definitions'

// ── Backend DTOs ──────────────────────────────────────────────────────────────

interface GraphNodeDto {
  id: string
  type: string
  providerId: string
  config: Record<string, unknown>
  position: { x: number; y: number }
}

interface GraphEdgeDto {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
}

interface GraphDefinitionDto {
  id: string
  projectId: string
  nodes: GraphNodeDto[]
  edges: GraphEdgeDto[]
  updatedAt: string
}

// ── pipelineType → (type, providerId) ────────────────────────────────────────

const PIPELINE_TYPE_MAP: Record<PipelineNodeType, { type: string; providerId: string }> = {
  input:           { type: 'input',           providerId: 'core'     },
  context_builder: { type: 'context_builder', providerId: 'core'     },
  discord:         { type: 'input',           providerId: 'discord'  },
  twitch:          { type: 'input',           providerId: 'twitch'   },
  telegram:        { type: 'input',           providerId: 'telegram' },
  llm:             { type: 'llm',             providerId: 'core'     },
  tts:             { type: 'tts',             providerId: 'core'     },
  output:          { type: 'output',          providerId: 'core'     },
  emotion:         { type: 'plugin',          providerId: 'emotion'  },
  memory:          { type: 'plugin',          providerId: 'memory'   },
  filter:          { type: 'plugin',          providerId: 'filter'   },
}

// (type, providerId) → pipelineType
const REVERSE_MAP: Record<string, PipelineNodeType> = Object.fromEntries(
  Object.entries(PIPELINE_TYPE_MAP).map(([pt, { type, providerId }]) => [
    `${type}:${providerId}`,
    pt as PipelineNodeType,
  ]),
)

function toPipelineType(type: string, providerId: string): PipelineNodeType | null {
  return REVERSE_MAP[`${type}:${providerId}`] ?? null
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getGraph(projectId: string): Promise<GraphDefinitionDto | null> {
  const res = await apiFetch(`/api/graphs/${projectId}`)
  if (res.status === 404) return null
  return jsonOrThrow<GraphDefinitionDto>(res)
}

export async function saveGraph(
  projectId: string,
  nodes: RFNode[],
  edges: Edge[],
): Promise<GraphDefinitionDto> {
  const body = {
    nodes: nodes.map(n => {
      const data = n.data as PipelineNodeData
      const { type, providerId } = PIPELINE_TYPE_MAP[data.pipelineType] ?? { type: data.pipelineType, providerId: 'core' }
      return {
        id: n.id,
        type,
        providerId,
        config: (data as Record<string, unknown>),
        position: { x: n.position.x, y: n.position.y },
      } satisfies GraphNodeDto
    }),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? '',
      target: e.target,
      targetHandle: e.targetHandle ?? '',
    }) satisfies GraphEdgeDto),
  }

  const res = await apiFetch(`/api/graphs/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<GraphDefinitionDto>(res)
}

export async function getNodeCatalog(): Promise<NodeDefinition[]> {
  const res = await apiFetch('/api/graphs/nodes')
  return jsonOrThrow<NodeDefinition[]>(res)
}

// ── DTO → ReactFlow conversion ────────────────────────────────────────────────

export function graphDtoToFlow(dto: GraphDefinitionDto): {
  nodes: RFNode[]
  edges: Edge[]
} {
  const nodes: RFNode[] = dto.nodes.map(n => {
    const pipelineType = toPipelineType(n.type, n.providerId) ?? (n.type as PipelineNodeType)
    return {
      id: n.id,
      type: 'pipeline',
      position: n.position,
      data: { pipelineType, ...n.config } as PipelineNodeData,
    }
  })

  const edges: Edge[] = dto.edges.map(e => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
    type: 'smoothstep',
    style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5 },
  }))

  return { nodes, edges }
}
