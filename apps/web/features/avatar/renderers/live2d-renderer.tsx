/**
 * Live2D renderer — requires Cubism Web SDK (proprietary).
 *
 * Setup:
 *   1. Download Live2D Cubism SDK for Web: https://www.live2d.com/en/sdk/download/web/
 *   2. Copy CubismSdkForWeb/Core/live2dcubismcore.min.js → public/live2d/core.js
 *   3. Add to index.html: <script src="/live2d/core.js"></script>
 *   4. npm install pixi.js pixi-live2d-display
 *   5. Replace this placeholder with the actual renderer.
 *
 * License: Live2D SDK is free for non-commercial use.
 * Commercial use requires a license: https://www.live2d.com/en/sdk/license/
 */

interface Live2dRendererProps {
  url: string
  background?: string
  className?: string
  modelVisible?: boolean
}

export default function Live2dRenderer({ className, modelVisible = true }: Live2dRendererProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        opacity: modelVisible ? 1 : 0,
        pointerEvents: modelVisible ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        color: 'var(--text-muted, #888)',
        fontSize: '0.8rem',
        textAlign: 'center',
        padding: '1rem',
      }}
    >
      <span style={{ fontSize: '2rem', opacity: 0.4 }}>Live2D</span>
      <span>Cubism SDK required</span>
      <a
        href="https://www.live2d.com/en/sdk/download/web/"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
      >
        Download SDK →
      </a>
    </div>
  )
}
