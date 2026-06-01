import { useMemo } from 'react'
import { LocalTemplateStore } from './LocalTemplateStore'
import type { ITemplateStore } from './ITemplateStore'

const _store = typeof window !== 'undefined' ? new LocalTemplateStore() : null

export function useTemplateStore(): ITemplateStore {
  return useMemo(() => _store ?? new LocalTemplateStore(), [])
}
