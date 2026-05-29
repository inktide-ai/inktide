import { cn } from '@/lib/utils'
import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { SCENE_RENDERER_DEFAULTS } from '@/shared/hooks/useSceneRendererSettings'
import type { LookAtMode } from '@/features/avatar' // fsd:cross-feature-ok — editor embeds avatar preview

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
}

function SliderField({ label, value, min, max, step, format = (v) => String(v), onChange }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-[rgba(255,255,255,0.45)]">{label}</span>
        <span className="text-xs font-medium text-[rgba(255,255,255,0.85)] tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        className="scene-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[rgba(255,255,255,0.45)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="appearance-none w-[22px] h-[22px] rounded-[5px] border border-[rgba(255,255,255,0.1)] cursor-pointer p-[2px] bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-[4px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="text-xs font-medium text-[rgba(255,255,255,0.4)] tabular-nums">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

const LOOK_AT_MODES: { mode: LookAtMode; label: string }[] = [
  { mode: 'idle',     label: 'Auto'     },
  { mode: 'camera',   label: 'Camera'   },
  { mode: 'mouse',    label: 'Mouse'    },
  { mode: 'disabled', label: 'Off'      },
]

// ── Panel ─────────────────────────────────────────────────────────────────────

interface SceneRendererPanelProps {
  settings: SceneRendererSettings
  onSet: (patch: Partial<SceneRendererSettings>) => void
  onReset: () => void
}

const deg = (v: number) => `${Math.round(v)}°`
const f2  = (v: number) => v.toFixed(2)
const f1  = (v: number) => v.toFixed(1)

const sectionCls = 'flex flex-col gap-3 pt-3 mt-3 border-t border-[rgba(255,255,255,0.06)] [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sectionHeadCls = 'text-2xs font-medium uppercase tracking-[0.08em] text-[rgba(255,255,255,0.28)] m-0'

export default function SceneRendererPanel({ settings, onSet, onReset }: SceneRendererPanelProps) {
  const set = <K extends keyof SceneRendererSettings>(key: K, value: SceneRendererSettings[K]) =>
    onSet({ [key]: value } as Partial<SceneRendererSettings>)

  return (
    <div className="absolute bottom-[13px] left-[13px] w-[272px] max-h-[calc(100%-27px)] flex flex-col bg-[rgba(9,9,11,0.92)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden z-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <span className="text-body font-semibold text-[rgba(255,255,255,0.88)] tracking-[-0.01em]">Renderer</span>
        <button
          type="button"
          className="py-0.5 px-2.5 border border-[rgba(255,255,255,0.1)] rounded-md bg-transparent text-[rgba(255,255,255,0.35)] text-xs font-medium cursor-pointer transition-all duration-150 font-[inherit] leading-[1.6] hover:border-red-500/30 hover:text-red-400/80"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3.5 flex flex-col gap-0">
        {/* ── Model transform ── */}
        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>Model Position</h3>
          <div className="grid grid-cols-3 gap-2">
            <SliderField label="X" value={settings.posX} min={-3} max={3} step={0.01} format={f2} onChange={(v) => set('posX', v)} />
            <SliderField label="Y" value={settings.posY} min={-3} max={3} step={0.01} format={f2} onChange={(v) => set('posY', v)} />
            <SliderField label="Z" value={settings.posZ} min={-3} max={3} step={0.01} format={f2} onChange={(v) => set('posZ', v)} />
          </div>
          <SliderField label="Rotation Y" value={settings.rotY} min={0} max={360} step={1} format={deg} onChange={(v) => set('rotY', v)} />
        </div>

        {/* ── Camera ── */}
        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>Camera</h3>
          <SliderField label="FOV" value={settings.fov} min={10} max={120} step={1} format={deg} onChange={(v) => set('fov', v)} />
          <SliderField label="Distance" value={settings.cameraDistance} min={0.5} max={10} step={0.1} format={f1} onChange={(v) => set('cameraDistance', v)} />
          <SliderField label="Render Scale" value={settings.renderScale} min={0.5} max={3} step={0.1} format={f1} onChange={(v) => set('renderScale', v)} />
        </div>

        {/* ── Look-at ── */}
        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>Look At</h3>
          <div className="flex gap-[3px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-lg p-[3px]">
            {LOOK_AT_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'flex-1 py-[5px] px-1 border-none rounded-md bg-transparent text-xs font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit] leading-none text-center',
                  settings.lookAtMode === mode
                    ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.65)]'
                )}
                onClick={() => set('lookAtMode', mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Directional light ── */}
        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>Directional Light</h3>
          <div className="grid grid-cols-2 gap-2">
            <SliderField label="Rot X" value={settings.dirLightRotX} min={0} max={360} step={1} format={deg} onChange={(v) => set('dirLightRotX', v)} />
            <SliderField label="Rot Y" value={settings.dirLightRotY} min={0} max={360} step={1} format={deg} onChange={(v) => set('dirLightRotY', v)} />
          </div>
          <SliderField label="Intensity" value={settings.dirLightIntensity} min={0} max={5} step={0.05} format={f2} onChange={(v) => set('dirLightIntensity', v)} />
          <ColorField label="Color" value={settings.dirLightColor} onChange={(v) => set('dirLightColor', v)} />
        </div>

        {/* ── Ambient light ── */}
        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>Ambient Light</h3>
          <SliderField label="Intensity" value={settings.ambientIntensity} min={0} max={5} step={0.05} format={f2} onChange={(v) => set('ambientIntensity', v)} />
          <ColorField label="Color" value={settings.ambientColor} onChange={(v) => set('ambientColor', v)} />
        </div>
      </div>
    </div>
  )
}

export { SCENE_RENDERER_DEFAULTS }
