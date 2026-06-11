import { Suspense } from 'react'
import ObsScenePage from '@/features/obs/obs-scene-page'

export default function Page() {
  return (
    <Suspense>
      <ObsScenePage />
    </Suspense>
  )
}
