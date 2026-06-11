/// <reference lib="webworker" />

interface CompositeMessage {
  avatar: ImageBitmap
  scene: ImageBitmap | null
  width: number
  height: number
}

function drawCover(ctx: OffscreenCanvasRenderingContext2D, img: ImageBitmap, dw: number, dh: number) {
  const srcAspect = img.width / img.height
  const dstAspect = dw / dh
  let sx: number, sy: number, sw: number, sh: number
  if (srcAspect > dstAspect) {
    sh = img.height; sw = sh * dstAspect; sx = (img.width - sw) / 2; sy = 0
  } else {
    sw = img.width; sh = sw / dstAspect; sx = 0; sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
}

self.onmessage = async ({ data }: MessageEvent<CompositeMessage>) => {
  try {
    const MAX_DIM = 1280
    const scale = Math.min(1, MAX_DIM / Math.max(data.width, data.height))
    const w = Math.round(data.width * scale)
    const h = Math.round(data.height * scale)
    const out = new OffscreenCanvas(w, h)
    const ctx = out.getContext('2d')!
    if (data.scene) drawCover(ctx, data.scene, w, h)
    ctx.drawImage(data.avatar, 0, 0, w, h)
    const blob = await out.convertToBlob({ type: 'image/webp', quality: 0.85 })
    self.postMessage({ blob })
  } catch (e) {
    self.postMessage({ error: String(e) })
  } finally {
    data.avatar.close()
    data.scene?.close()
  }
}
