'use client'
import dynamic from 'next/dynamic'

const ReactChromeDinoGame = dynamic(
  () => import('react-chrome-dino'),
  { ssr: false }
)

export function DinoGame() {
  return (
    <div className="w-full overflow-hidden" style={{ height: 200 }}>
      <ReactChromeDinoGame />
    </div>
  )
}
