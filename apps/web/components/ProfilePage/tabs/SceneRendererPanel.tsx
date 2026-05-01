import type { SceneRendererSettings } from '../../../hooks/useSceneRendererSettings'
import { SCENE_RENDERER_DEFAULTS } from '../../../hooks/useSceneRendererSettings'
import type { LookAtMode } from '../../AvatarRenderer/AvatarRenderer'
import styles from './SceneRendererPanel.module.css'

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
    <div className={styles.sliderField}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{format(value)}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
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
    <div className={styles.colorField}>
      <span className={styles.colorLabel}>{label}</span>
      <div className={styles.colorRow}>
        <input
          type="color"
          className={styles.colorInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={styles.colorHex}>{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

const LOOK_AT_MODES: { mode: LookAtMode; label: string }[] = [
  { mode: 'idle',     label: 'Авто'   },
  { mode: 'camera',   label: 'Камеру' },
  { mode: 'mouse',    label: 'Мышь'   },
  { mode: 'disabled', label: 'Откл.'  },
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

export default function SceneRendererPanel({ settings, onSet, onReset }: SceneRendererPanelProps) {
  const set = <K extends keyof SceneRendererSettings>(key: K, value: SceneRendererSettings[K]) =>
    onSet({ [key]: value } as Partial<SceneRendererSettings>)

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Настройки рендера</span>
        <button type="button" className={styles.resetBtn} onClick={onReset}>Сбросить</button>
      </div>

      <div className={styles.body}>
        {/* ── Model transform ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Положение модели</h3>
          <div className={styles.row3}>
            <SliderField label="X" value={settings.posX} min={-3} max={3} step={0.01} format={f2} onChange={(v) => set('posX', v)} />
            <SliderField label="Y" value={settings.posY} min={-3} max={3} step={0.01} format={f2} onChange={(v) => set('posY', v)} />
            <SliderField label="Z" value={settings.posZ} min={-3} max={3} step={0.01} format={f2} onChange={(v) => set('posZ', v)} />
          </div>
          <SliderField label="Вращение Y" value={settings.rotY} min={0} max={360} step={1} format={deg} onChange={(v) => set('rotY', v)} />
        </div>

        {/* ── Camera ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Камера</h3>
          <SliderField label="Угол обзора (FOV)" value={settings.fov} min={10} max={120} step={1} format={deg} onChange={(v) => set('fov', v)} />
          <SliderField label="Дистанция" value={settings.cameraDistance} min={0.5} max={10} step={0.1} format={f1} onChange={(v) => set('cameraDistance', v)} />
          <SliderField label="Масштаб рендера" value={settings.renderScale} min={0.5} max={3} step={0.1} format={f1} onChange={(v) => set('renderScale', v)} />
        </div>

        {/* ── Look-at ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Взгляд</h3>
          <div className={styles.lookAtGroup}>
            {LOOK_AT_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={`${styles.lookAtBtn} ${settings.lookAtMode === mode ? styles.lookAtBtnActive : ''}`}
                onClick={() => set('lookAtMode', mode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Directional light ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Направленный свет</h3>
          <div className={styles.row3}>
            <SliderField label="Поворот X" value={settings.dirLightRotX} min={0} max={360} step={1} format={deg} onChange={(v) => set('dirLightRotX', v)} />
            <SliderField label="Поворот Y" value={settings.dirLightRotY} min={0} max={360} step={1} format={deg} onChange={(v) => set('dirLightRotY', v)} />
          </div>
          <SliderField label="Интенсивность" value={settings.dirLightIntensity} min={0} max={5} step={0.05} format={f2} onChange={(v) => set('dirLightIntensity', v)} />
          <ColorField label="Цвет" value={settings.dirLightColor} onChange={(v) => set('dirLightColor', v)} />
        </div>

        {/* ── Ambient light ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Фоновый свет</h3>
          <SliderField label="Интенсивность" value={settings.ambientIntensity} min={0} max={5} step={0.05} format={f2} onChange={(v) => set('ambientIntensity', v)} />
          <ColorField label="Цвет" value={settings.ambientColor} onChange={(v) => set('ambientColor', v)} />
        </div>
      </div>
    </div>
  )
}

// Re-export defaults so the panel can be used standalone without importing from hook
export { SCENE_RENDERER_DEFAULTS }
