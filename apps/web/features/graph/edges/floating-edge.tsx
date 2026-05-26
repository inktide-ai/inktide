'use client'
import { getBezierPath, Position, useInternalNode, type EdgeProps } from '@xyflow/react'

// ── Geometry ───────────────────────────────────────────────────────────────────

interface NodeCenter { x: number; y: number; hw: number; hh: number }

function getNodeCenter(node: {
  internals: { positionAbsolute: { x: number; y: number } }
  measured: { width?: number; height?: number }
}): NodeCenter {
  const w = node.measured.width  ?? 140
  const h = node.measured.height ?? 60
  return {
    x:  node.internals.positionAbsolute.x + w / 2,
    y:  node.internals.positionAbsolute.y + h / 2,
    hw: w / 2,
    hh: h / 2,
  }
}

// Point where a ray starting at (cx,cy) in direction (dx,dy) exits the rectangle.
// Uses |hw/dx| / |hh/dy| to always find the forward exit, never the entry.
function getRectExitPoint(cx: number, cy: number, hw: number, hh: number, dx: number, dy: number) {
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const tx = dx !== 0 ? Math.abs(hw / dx) : Infinity
  const ty = dy !== 0 ? Math.abs(hh / dy) : Infinity
  const t  = Math.min(tx, ty)
  return { x: cx + t * dx, y: cy + t * dy }
}

// Pick the sourcePosition / targetPosition hint for getBezierPath based on
// which axis dominates — gives smoother control-point placement.
function dominantPos(dx: number, dy: number, forward: boolean): Position {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return forward
      ? (dx >= 0 ? Position.Right : Position.Left)
      : (dx >= 0 ? Position.Left  : Position.Right)
  }
  return forward
    ? (dy >= 0 ? Position.Bottom : Position.Top)
    : (dy >= 0 ? Position.Top   : Position.Bottom)
}

// ── FloatingEdge ───────────────────────────────────────────────────────────────

export function FloatingEdge({ id, source, target, style, markerEnd, markerStart }: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const sc = getNodeCenter(sourceNode)
  const tc = getNodeCenter(targetNode)

  const dx = tc.x - sc.x
  const dy = tc.y - sc.y
  if (dx === 0 && dy === 0) return null

  // Exit points on each node's border in the direction of the other node
  const sp = getRectExitPoint(sc.x, sc.y, sc.hw, sc.hh,  dx,  dy)
  const tp = getRectExitPoint(tc.x, tc.y, tc.hw, tc.hh, -dx, -dy)

  const [edgePath] = getBezierPath({
    sourceX:        sp.x,
    sourceY:        sp.y,
    sourcePosition: dominantPos(dx, dy, true),
    targetX:        tp.x,
    targetY:        tp.y,
    targetPosition: dominantPos(dx, dy, false),
    curvature:      0.25,
  })

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={{
        stroke: 'rgba(255,255,255,0.22)',
        strokeWidth: 1.5,
        ...style,
      }}
    />
  )
}
