import { Suspense } from 'react'
import ObsScenePage from '@/screens/obs/ObsScenePage'

export default function Page() {
  return (
    <Suspense>
      <ObsScenePage />
    </Suspense>
  )
}
