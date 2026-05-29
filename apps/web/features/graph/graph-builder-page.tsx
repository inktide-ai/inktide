'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getGraph, saveGraph, graphDtoToFlow } from '@/features/graph/api/graph'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  ConnectionMode,
  type Connection,
  type ReactFlowInstance,
  type Node as RFNode,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { NODE_DEFINITIONS, DATA_TYPE_COLOR, type PipelineNodeType } from './nodes/node-definitions'
import NodeInspectorPanel from './node-inspector/NodeInspectorPanel'
import type { PipelineNodeData } from './nodes/pipeline-node'
import {
  type Tool,
  type SaveStatus,
  initialNodes,
  initialEdges,
  nodeTypes,
  edgeTypes,
} from './lib/graph-defaults'
import { migrateLegacyNodes } from './lib/migrate-legacy-nodes'
import { Toolbar, AddNodePanel } from './components/graph-toolbar'
import { STORAGE_KEYS } from '@/shared/lib/storage-keys'

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
      localStorage.setItem(STORAGE_KEYS.graph(characterId), JSON.stringify({
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
      const raw = localStorage.getItem(STORAGE_KEYS.graph(characterId))
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
    <div className="flex w-full h-screen overflow-hidden">
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
