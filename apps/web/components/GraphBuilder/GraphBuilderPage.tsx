'use client'

import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Controls,
  type NodeProps,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react'
import {
  Lock, LockOpen, Hand, MousePointer2, SquarePlus, Spline, Trash2,
} from 'lucide-react'
import '@xyflow/react/dist/style.css'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = 'select' | 'pan' | 'connect' | 'addNode' | 'lock'

// ── Custom node ───────────────────────────────────────────────────────────────

interface ThemeNodeData {
  label: string
  sub?: string
  badge?: string
  badgeColor?: string
  isStart?: boolean
}

function ThemeNode({ data, selected }: NodeProps) {
  const d = data as ThemeNodeData
  return (
    <div
      style={{
        background: '#252524',
        border: `1px solid ${selected ? '#6b6b67' : '#3E3E3B'}`,
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 130,
        maxWidth: 170,
        boxShadow: selected
          ? '0 0 0 1.5px #6b6b67, 0 6px 24px rgba(0,0,0,0.5)'
          : '0 4px 16px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
    >
      {!d.isStart && <Handle type="target" position={Position.Left} style={handleStyle} />}
      {d.badge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ background: d.badgeColor ?? '#555', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
            {d.badge}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#c8c8c4', letterSpacing: 0.1 }}>
            {d.label}
          </span>
        </div>
      )}
      {!d.badge && (
        <div style={{ fontSize: 11, fontWeight: 600, color: '#c8c8c4', marginBottom: d.sub ? 4 : 0 }}>
          {d.label}
        </div>
      )}
      {d.sub && <div style={{ fontSize: 11, color: '#7a7a76', lineHeight: 1.4 }}>{d.sub}</div>}
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

const handleStyle = { width: 8, height: 8, background: '#3E3E3B', border: '1.5px solid #6b6b67' }
const nodeTypes = { theme: ThemeNode }

// ── Initial data ──────────────────────────────────────────────────────────────

const initialNodes = [
  { id: 'trigger',  type: 'theme', position: { x: 40,  y: 200 }, data: { label: 'Starting logic', sub: 'based on context', badge: '⚡', badgeColor: '#3a3a38', isStart: true } },
  { id: 'welcome',  type: 'theme', position: { x: 250, y: 200 }, data: { label: 'WS.',             sub: 'Welcome!',         badge: '▐▌', badgeColor: '#444' } },
  { id: 's1',       type: 'theme', position: { x: 460, y: 110 }, data: { label: 'S1. Hello',        sub: 'good to see you…', badge: '❝', badgeColor: '#c25c1a' } },
  { id: 'stranger', type: 'theme', position: { x: 460, y: 300 }, data: { label: '1. Hello stranger!', sub: "What's up…",    badge: '≡', badgeColor: '#1a6fc2' } },
  { id: 'rate',     type: 'theme', position: { x: 670, y: 200 }, data: { label: '2. Rate this',     sub: 'chat?',           badge: '★', badgeColor: '#b8860b' } },
  { id: 'done',     type: 'theme', position: { x: 880, y: 200 }, data: { label: 'A. All done!',     sub: 'Thanks!',          badge: '▐▌', badgeColor: '#444' } },
]

const edgeStyle = { stroke: '#4a4a47', strokeWidth: 1.5 }
const initialEdges = [
  { id: 'e1', source: 'trigger',  target: 'welcome',  type: 'smoothstep', style: edgeStyle },
  { id: 'e2', source: 'welcome',  target: 's1',       type: 'smoothstep', style: edgeStyle },
  { id: 'e3', source: 'welcome',  target: 'stranger', type: 'smoothstep', style: edgeStyle },
  { id: 'e4', source: 's1',       target: 'rate',     type: 'smoothstep', style: edgeStyle },
  { id: 'e5', source: 'stranger', target: 'rate',     type: 'smoothstep', style: edgeStyle },
  { id: 'e6', source: 'rate',     target: 'done',     type: 'smoothstep', style: edgeStyle },
]

// ── Toolbar ───────────────────────────────────────────────────────────────────

interface ToolbarProps {
  active: Tool
  locked: boolean
  onTool: (t: Tool) => void
  onAddNode: () => void
  onDeleteSelected: () => void
}

const DIVIDER = <div style={{ width: 1, height: 20, background: '#3E3E3B', margin: '0 4px', flexShrink: 0 }} />

function Toolbar({ active, locked, onTool, onAddNode, onDeleteSelected }: ToolbarProps) {
  const btn = (tool: Tool, icon: React.ReactNode, title: string, onClick?: () => void) => {
    const isActive = active === tool
    return (
      <button
        key={tool}
        title={title}
        onClick={onClick ?? (() => onTool(tool))}
        style={{
          width: 36, height: 36,
          border: 'none',
          borderRadius: 8,
          background: isActive ? '#3a3a52' : 'transparent',
          color: isActive ? '#a8a8f0' : '#9E9E9C',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.12s, color 0.12s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#2C2C2A' }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {icon}
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 2,
      background: '#252524',
      border: '1px solid #3E3E3B',
      borderRadius: 12,
      padding: '4px 8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
    }}>
      {btn('lock', locked ? <Lock size={16} /> : <LockOpen size={16} />, locked ? 'Unlock canvas' : 'Lock canvas')}
      {DIVIDER}
      {btn('select', <MousePointer2 size={16} />, 'Select (V)')}
      {btn('pan',    <Hand size={16} />,           'Pan (H)')}
      {DIVIDER}
      {btn('addNode', <SquarePlus size={16} />, 'Add node', onAddNode)}
      {btn('connect', <Spline size={16} />,     'Connect nodes')}
      {DIVIDER}
      <button
        title="Delete selected"
        onClick={onDeleteSelected}
        style={{
          width: 36, height: 36, border: 'none', borderRadius: 8, background: 'transparent',
          color: '#9E9E9C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,60,60,0.12)'; (e.currentTarget as HTMLElement).style.color = '#e07070' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9E9E9C' }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

let nodeCounter = initialNodes.length + 1

export default function GraphBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [tool, setTool] = useState<Tool>('select')
  const [locked, setLocked] = useState(false)
  const rfInstance = useRef<ReactFlowInstance | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge({ ...connection, type: 'smoothstep', style: edgeStyle }, eds)),
    [setEdges],
  )

  const handleTool = (t: Tool) => {
    if (t === 'lock') { setLocked(l => !l); return }
    setTool(t)
  }

  const handleAddNode = () => {
    const id = `node-${nodeCounter++}`
    const center = rfInstance.current
      ? rfInstance.current.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: 300 + Math.random() * 200, y: 200 + Math.random() * 100 }
    setNodes(ns => [...ns, {
      id,
      type: 'theme',
      position: center,
      data: { label: 'New node', sub: 'double-click to edit', badge: '◆', badgeColor: '#3a3a38' },
    }])
  }

  const handleDeleteSelected = () => {
    setNodes(ns => ns.filter(n => !n.selected))
    setEdges(es => es.filter(e => !e.selected))
  }

  const panOnDrag = tool === 'pan' ? [0, 1, 2] : [1, 2]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#1C1C1B', overflow: 'hidden' }}>
      {/* Dot grid */}
      <div style={{
        pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(62,62,59,0.9) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 0%, black 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 0%, black 85%)',
      }} />
      {/* Vignette */}
      <div style={{
        pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 30%, rgba(12,12,11,0.55) 100%)',
      }} />

      <Toolbar
        active={tool}
        locked={locked}
        onTool={handleTool}
        onAddNode={handleAddNode}
        onDeleteSelected={handleDeleteSelected}
      />

      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <style>{`
          .react-flow__renderer { background: transparent !important; }
          .react-flow__background { display: none; }
          .react-flow__attribution { display: none; }
          .react-flow__handle { transition: border-color 0.15s; }
          .react-flow__handle:hover { border-color: #9E9E9C !important; }
          .react-flow__controls {
            background: #252524 !important;
            border: 1px solid #3E3E3B !important;
            border-radius: 10px !important;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
          }
          .react-flow__controls-button {
            background: #252524 !important;
            border-bottom: 1px solid #3E3E3B !important;
            color: #9E9E9C !important;
          }
          .react-flow__controls-button:last-child { border-bottom: none !important; }
          .react-flow__controls-button:hover { background: #2C2C2A !important; }
          .react-flow__controls-button svg { fill: #9E9E9C !important; }
          .react-flow__node { cursor: ${tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair'}; }
        `}</style>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={inst => { rfInstance.current = inst }}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.2 }}
          panOnScroll
          panOnDrag={panOnDrag as [number, ...number[]]}
          zoomOnScroll
          nodesDraggable={!locked}
          nodesConnectable={!locked}
          elementsSelectable={!locked}
          connectOnClick={tool === 'connect'}
          defaultEdgeOptions={{ type: 'smoothstep', style: edgeStyle }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls position="bottom-right" />
        </ReactFlow>
      </div>
    </div>
  )
}
