'use client'

import { palette } from './broadcast'
import PlansScene, { type PlansSceneProps } from './plans-scene'
import StreamFooter from './stream-footer'
import StreamHeader from './stream-header'

/** /pricing in the landing's clothes: its header and footer around the plans scene. */
export default function PricingPage(props: PlansSceneProps) {
  return (
    <div style={palette} className="relative isolate overflow-clip bg-[var(--q-bg)]">
      <StreamHeader onAir />
      <PlansScene {...props} />
      <StreamFooter />
    </div>
  )
}
