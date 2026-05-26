'use client'
import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCharactersContext } from '@/context/CharactersContext'
import { listProjects } from '@/api/projects'
import { queryKeys } from '@/lib/query/keys'

export interface SearchResult {
  type: 'soul' | 'project'
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  route: string
}

const MAX_PER_TYPE = 5

export function useSearch() {
  const router = useRouter()
  const { cardList } = useCharactersContext()

  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: () => listProjects(),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  })

  // Reset active index when results change
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const souls: SearchResult[] = cardList
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.personality?.toLowerCase().includes(q),
      )
      .slice(0, MAX_PER_TYPE)
      .map(c => ({
        type: 'soul',
        id: c.id,
        name: c.name,
        description: c.description || null,
        avatarUrl: c.avatar_url,
        route: `/souls/${c.id}`,
      }))

    const proj: SearchResult[] = projects
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
      )
      .slice(0, MAX_PER_TYPE)
      .map(p => ({
        type: 'project',
        id: p.id,
        name: p.name,
        description: p.description,
        avatarUrl: p.active_soul?.avatar_url ?? null,
        route: `/projects/${p.id}`,
      }))

    return [...souls, ...proj]
  }, [query, cardList, projects])

  useEffect(() => { setActiveIndex(-1) }, [results])

  const isOpen = query.trim().length > 0

  const close = useCallback(() => {
    setQuery('')
    setActiveIndex(-1)
    inputRef.current?.blur()
  }, [])

  const navigate = useCallback((result: SearchResult) => {
    close()
    router.push(result.route)
  }, [close, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      navigate(results[activeIndex])
    } else if (e.key === 'Escape') {
      close()
    }
  }, [isOpen, results, activeIndex, navigate, close])

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return {
    query,
    setQuery,
    results,
    isOpen,
    activeIndex,
    inputRef,
    close,
    navigate,
    handleKeyDown,
  }
}
