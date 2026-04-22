import { useCallback, useEffect, useState } from 'react'
import type { AiCardListItem, LlmModelResponse } from '../../api/soul'
import type { ICardRepository } from '../../ports/ICardRepository'

/**
 * ISP: единственная ответственность — загрузка и кеш списка карточек + каталога LLM.
 * Не знает о выборе, грязном состоянии или мутациях.
 */
export function useCharacterList(repo: ICardRepository) {
  const [cardList, setCardList] = useState<AiCardListItem[]>([])
  const [llmModels, setLlmModels] = useState<LlmModelResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [cards, models] = await Promise.all([repo.listCards(), repo.listLlmModels()])
        if (cancelled) return
        setCardList(cards)
        setLlmModels(models)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [repo])

  const updateListItem = useCallback((
    id: string,
    patch: Partial<Pick<AiCardListItem, 'name' | 'slug' | 'personality' | 'is_active' | 'avatar_url'>>,
  ) => {
    setCardList((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c))
  }, [])

  const addListItem = useCallback((item: AiCardListItem) => {
    setCardList((prev) => [...prev, item])
  }, [])

  const removeListItem = useCallback((id: string) => {
    setCardList((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { cardList, llmModels, loading, loadError, updateListItem, addListItem, removeListItem }
}
