import { permanentRedirect } from 'next/navigation'
import { LANDING_ROUTE } from '@/lib/routes'

// The landing was previewed here before it took over the root; old links still land on it.
export default function StagePreviewPage() {
  permanentRedirect(LANDING_ROUTE)
}
