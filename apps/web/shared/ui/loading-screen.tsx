'use client'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-dark)]">
      <div className="w-24 h-24 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-base)] border-t-transparent animate-spin" />
      </div>
      {message && (
        <p className="mt-4 text-sm text-[var(--text-muted)] animate-pulse">{message}</p>
      )}
    </div>
  )
}
