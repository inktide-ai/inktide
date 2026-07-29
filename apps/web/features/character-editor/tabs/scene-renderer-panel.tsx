'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Slider } from '@/shared/ui/slider'
import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { SCENE_RENDERER_DEFAULTS } from '@/shared/hooks/useSceneRendererSettings'
import type { LookAtMode } from '@/features/avatar' // fsd:cross-feature-ok - editor embeds avatar preview


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
      <Slider
        value={value} onChange={onChange}
        min={min} max={max} step={step}
        fill="var(--text-primary)" trackHeight={3} thumbSize={12}
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

const LOOK_AT_MODES: { mode: LookAtMode; labelKey: string }[] = [
  { mode: 'camera',   labelKey: 'renderer.lookCamera' },
  { mode: 'mouse',    labelKey: 'renderer.lookMouse'  },
  { mode: 'disabled', labelKey: 'renderer.lookOff'    },
]


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
  const { t } = useTranslation('scene')
  const pos  = (p: Partial<typeof settings.position>)         => onSet({ position:         { ...settings.position,         ...p } })
  const cam  = (p: Partial<typeof settings.camera>)           => onSet({ camera:           { ...settings.camera,           ...p } })
  const anim = (p: Partial<typeof settings.animations>)       => onSet({ animations:       { ...settings.animations,       ...p } })
  const phys = (p: Partial<typeof settings.breastPhysics>)    => onSet({ breastPhysics:    { ...settings.breastPhysics,    ...p } })
  const dir  = (p: Partial<typeof settings.directionalLight>) => onSet({ directionalLight: { ...settings.directionalLight, ...p } })
  const amb  = (p: Partial<typeof settings.ambientLight>)     => onSet({ ambientLight:     { ...settings.ambientLight,     ...p } })

  return (
    <div className="absolute bottom-[13px] left-[13px] w-[272px] max-h-[calc(100%-27px)] flex flex-col bg-[rgba(9,9,11,0.92)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden z-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <span className="text-body font-semibold text-[rgba(255,255,255,0.88)] tracking-[-0.01em]">{t('renderer.title')}</span>
        <button
          type="button"
          className="py-0.5 px-2.5 border border-[rgba(255,255,255,0.1)] rounded-md bg-transparent text-[rgba(255,255,255,0.35)] text-xs font-medium cursor-pointer transition-all duration-150 font-[inherit] leading-[1.6] hover:border-red-500/30 hover:text-red-400/80"
          onClick={onReset}
        >
          {t('renderer.reset')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3.5 flex flex-col gap-0">
        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.modelPosition')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <SliderField label="X" value={settings.position.posX} min={-3} max={3} step={0.01} format={f2} onChange={(v) => pos({ posX: v })} />
            <SliderField label="Y" value={settings.position.posY} min={-3} max={3} step={0.01} format={f2} onChange={(v) => pos({ posY: v })} />
            <SliderField label="Z" value={settings.position.posZ} min={-3} max={3} step={0.01} format={f2} onChange={(v) => pos({ posZ: v })} />
          </div>
          <SliderField label={t('renderer.rotationY')} value={settings.position.rotY} min={0} max={360} step={1} format={deg} onChange={(v) => pos({ rotY: v })} />
        </div>

        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.camera')}</h3>
          <SliderField label={t('renderer.fov')} value={settings.camera.fov} min={10} max={120} step={1} format={deg} onChange={(v) => cam({ fov: v })} />
          <SliderField label={t('renderer.distance')} value={settings.camera.cameraDistance} min={0.5} max={10} step={0.1} format={f1} onChange={(v) => cam({ cameraDistance: v })} />
          <SliderField label={t('renderer.renderScale')} value={settings.camera.renderScale} min={0.5} max={3} step={0.1} format={f1} onChange={(v) => cam({ renderScale: v })} />
        </div>

        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.lookAt')}</h3>
          <div className="flex gap-[3px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-lg p-[3px]">
            {LOOK_AT_MODES.map(({ mode, labelKey }) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'flex-1 py-[5px] px-1 border-none rounded-md bg-transparent text-xs font-medium cursor-pointer transition-all duration-150 whitespace-nowrap font-[inherit] leading-none text-center',
                  settings.camera.lookAtMode === mode
                    ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.65)]'
                )}
                onClick={() => cam({ lookAtMode: mode })}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.animations')}</h3>
          <div className="flex gap-[3px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-lg p-[3px]">
            {([true, false] as const).map(v => (
              <button
                key={String(v)}
                type="button"
                className={cn(
                  'flex-1 py-[5px] px-1 border-none rounded-md bg-transparent text-xs font-medium cursor-pointer transition-all duration-150 font-[inherit] leading-none text-center',
                  settings.animations.randomAnimationsEnabled === v
                    ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.65)]'
                )}
                onClick={() => anim({ randomAnimationsEnabled: v })}
              >
                {v ? t('renderer.on') : t('renderer.off')}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.breastPhysics')}</h3>
          <div className="flex gap-[3px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-lg p-[3px]">
            {([false, true] as const).map(v => (
              <button
                key={String(v)}
                type="button"
                className={cn(
                  'flex-1 py-[5px] px-1 border-none rounded-md bg-transparent text-xs font-medium cursor-pointer transition-all duration-150 font-[inherit] leading-none text-center',
                  settings.breastPhysics.jiggleEnabled === v
                    ? 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.9)] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.65)]'
                )}
                onClick={() => phys({ jiggleEnabled: v })}
              >
                {v ? t('renderer.on') : t('renderer.off')}
              </button>
            ))}
          </div>
          {settings.breastPhysics.jiggleEnabled && (
            <SliderField
              label={t('renderer.intensity')}
              value={settings.breastPhysics.jiggleMult}
              min={0.5} max={3} step={0.1}
              format={f1}
              onChange={v => phys({ jiggleMult: v })}
            />
          )}
        </div>

        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.directionalLight')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <SliderField label={t('renderer.rotX')} value={settings.directionalLight.rotX} min={0} max={360} step={1} format={deg} onChange={(v) => dir({ rotX: v })} />
            <SliderField label={t('renderer.rotY')} value={settings.directionalLight.rotY} min={0} max={360} step={1} format={deg} onChange={(v) => dir({ rotY: v })} />
          </div>
          <SliderField label={t('renderer.intensity')} value={settings.directionalLight.intensity} min={0} max={5} step={0.05} format={f2} onChange={(v) => dir({ intensity: v })} />
          <ColorField label={t('renderer.color')} value={settings.directionalLight.color} onChange={(v) => dir({ color: v })} />
        </div>

        <div className={sectionCls}>
          <h3 className={sectionHeadCls}>{t('renderer.ambientLight')}</h3>
          <SliderField label={t('renderer.intensity')} value={settings.ambientLight.intensity} min={0} max={5} step={0.05} format={f2} onChange={(v) => amb({ intensity: v })} />
          <ColorField label={t('renderer.color')} value={settings.ambientLight.color} onChange={(v) => amb({ color: v })} />
        </div>
      </div>
    </div>
  )
}

export { SCENE_RENDERER_DEFAULTS }
