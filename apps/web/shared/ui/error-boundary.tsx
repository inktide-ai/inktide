'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500" aria-hidden>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div>
        <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">Something went wrong</p>
        <p className="mt-1 text-[0.875rem] text-[var(--text-secondary)]">An unexpected error occurred.</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="rounded-xl bg-[var(--accent-primary)] px-5 py-2 text-[0.875rem] font-semibold text-white hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback onReset={this.reset} />
    }
    return this.props.children
  }
}
