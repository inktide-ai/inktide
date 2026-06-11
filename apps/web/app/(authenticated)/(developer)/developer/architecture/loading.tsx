export default function Loading() {
  return (
    <div className="mx-auto max-w-[900px] animate-pulse space-y-6 px-8 py-12">
      <div className="h-10 w-56 rounded-xl bg-[var(--surface-2)]" />
      <div className="h-5 w-96 rounded-lg bg-[var(--surface-2)]" />
      <div className="h-48 rounded-xl bg-[var(--surface-1)]" />
      <div className="h-64 rounded-xl bg-[var(--surface-1)]" />
    </div>
  )
}
