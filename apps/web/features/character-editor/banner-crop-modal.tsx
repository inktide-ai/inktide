'use client'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

// 3:1 width:height - matches banner display ratio
const BANNER_ASPECT = 3

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = src
  })
}

async function cropToBlob(imageSrc: string, px: Area): Promise<Blob> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  // Output at 2x banner display width for crisp rendering
  const scale = Math.min(2, img.naturalWidth / px.width)
  canvas.width = Math.round(px.width * scale)
  canvas.height = Math.round(px.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(
    img,
    px.x, px.y, px.width, px.height,
    0, 0, canvas.width, canvas.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.93,
    )
  })
}

interface Props {
  imageSrc: string
  onApply: (blob: Blob) => void
  onCancel: () => void
}

export default function BannerCropModal({ imageSrc, onApply, onCancel }: Props) {
  const { t } = useTranslation('profile')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) return
    setApplying(true)
    try {
      const blob = await cropToBlob(imageSrc, croppedAreaPixels)
      onApply(blob)
    } catch {
      setApplying(false)
    }
  }, [imageSrc, croppedAreaPixels, onApply])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onCancel()
    },
    [onCancel],
  )

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/[0.78] backdrop-blur-[8px] flex items-center justify-center p-6"
      onClick={handleOverlayClick}
    >
      <div className="flex flex-col w-[min(700px,100%)] h-[min(520px,90dvh)] bg-[#16181c] border border-white/[0.08] rounded-[14px] overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.3),0_24px_64px_rgba(0,0,0,0.65)]">

        {/* Header */}
        <div className="flex items-center justify-between px-[1.125rem] py-[0.875rem] border-b border-white/[0.07] shrink-0">
          <span className="text-body-md font-semibold text-[#f1f5f9] tracking-[-0.01em]">{t('bannerCrop.title')}</span>
          <button
            type="button"
            className="flex items-center justify-center w-[30px] h-[30px] border-none bg-transparent text-white/40 rounded-[6px] cursor-pointer transition-[background,color] duration-150 hover:bg-white/[0.08] hover:text-white/85"
            onClick={onCancel}
            aria-label={t('bannerCrop.close')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative flex-1 min-h-0 bg-[#0d0e11]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={BANNER_ASPECT}
            minZoom={0.5}
            maxZoom={4}
            zoomWithScroll
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              cropAreaStyle: {
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                borderRadius: 4,
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-[1.125rem] py-3 border-t border-white/[0.07] shrink-0">
          <span className="text-xs text-white/35 whitespace-nowrap">{t('bannerCrop.hint')}</span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="px-[0.875rem] py-[0.45rem] rounded-[7px] border border-white/10 bg-transparent text-white/55 text-body font-medium cursor-pointer transition-[background,color] duration-150 hover:bg-white/[0.06] hover:text-white/85"
              onClick={onCancel}
            >
              {t('bannerCrop.cancel')}
            </button>
            <button
              type="button"
              className="px-[1.125rem] py-[0.45rem] rounded-[7px] border-none bg-[var(--color-error-strong)] text-white text-body font-semibold cursor-pointer transition-[background] duration-150 hover:enabled:bg-[#ff5252] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => void handleApply()}
              disabled={applying || !croppedAreaPixels}
            >
              {applying ? t('bannerCrop.uploading') : t('bannerCrop.apply')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
