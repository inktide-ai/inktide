'use client'
import Lottie from 'lottie-react'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-dark)]">
      <div className="w-24 h-24">
        <Lottie
          path="/animations/loading.json"
          loop
          autoplay
        />
      </div>
      {message && (
        <p className="mt-4 text-sm text-[var(--text-muted)] animate-pulse">{message}</p>
      )}
    </div>
  )
}
