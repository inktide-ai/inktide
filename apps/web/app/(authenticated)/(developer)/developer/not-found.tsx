import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
      <p className="text-5xl font-bold text-[var(--text-primary)]">404</p>
      <p className="text-[var(--text-secondary)]">This docs page doesn&apos;t exist.</p>
      <Link
        href="/developer"
        className="mt-2 text-sm font-medium text-[var(--accent-primary)] hover:underline"
      >
        ← Back to docs
      </Link>
    </div>
  )
}
