import type {
  AiCardListItem,
  AiCardResponse,
  CreateAiCardRequest,
  LlmModelResponse,
  UpdateAiCardRequest,
} from '@/shared/types/soul-api'

/** DIP: хуки/сервисы зависят от этого интерфейса, а не от конкретного soul.ts */
export interface ICardRepository {
  listCards(): Promise<AiCardListItem[]>
  getCard(id: string): Promise<AiCardResponse>
  createCard(data: CreateAiCardRequest): Promise<AiCardResponse>
  updateCard(id: string, data: UpdateAiCardRequest): Promise<AiCardResponse>
  deleteCard(id: string): Promise<void>
  listLlmModels(): Promise<LlmModelResponse[]>
}
