'use client'

import { useState } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'

interface SecretRevealProps {
  secret: string
  label?: string
}

export function SecretReveal({ secret, label = 'Client Secret' }: SecretRevealProps) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
        <code className="flex-1 text-sm font-mono text-[var(--text-primary)] break-all">
          {visible ? secret : '•'.repeat(Math.min(secret.length, 40))}
        </code>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setVisible(v => !v)}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title={visible ? 'Hide' : 'Reveal'}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Copy"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
