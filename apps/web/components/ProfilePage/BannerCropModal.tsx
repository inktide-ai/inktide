'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import styles from './BannerCropModal.module.css'

// 3:1 width:height — matches banner display ratio
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
  // Output at 2× banner display width for crisp rendering
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
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <span className={styles.title}>Crop banner</span>
          <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.cropArea}>
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

        <div className={styles.footer}>
          <span className={styles.hint}>Drag to pan · Scroll to zoom</span>
          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnApply}
              onClick={() => void handleApply()}
              disabled={applying || !croppedAreaPixels}
            >
              {applying ? 'Uploading…' : 'Apply'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
