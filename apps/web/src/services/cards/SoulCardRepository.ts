import {
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  getCatalogLlmModels,
  type AiCardListItem,
  type AiCardResponse,
  type CreateAiCardRequest,
  type LlmModelResponse,
  type UpdateAiCardRequest,
} from '../../api/soul'
import type { ICardRepository } from '../../ports/ICardRepository'

/**
 * DIP: конкретная реализация ICardRepository поверх REST soul.ts.
 *
 * OCP-тест: заменить REST на GraphQL = создать GraphQLCardRepository.ts
 * implements ICardRepository и поменять инстанс в useCharacters.ts.
 * Все четыре суб-хука (useCharacterList, useSelectedCharacter,
 * useDirtyState, useCharacterMutations) не меняются.
 */
export class SoulCardRepository implements ICardRepository {
  listCards(): Promise<AiCardListItem[]> {
    return getCards()
  }

  getCard(id: string): Promise<AiCardResponse> {
    return getCard(id)
  }

  createCard(data: CreateAiCardRequest): Promise<AiCardResponse> {
    return createCard(data)
  }

  updateCard(id: string, data: UpdateAiCardRequest): Promise<AiCardResponse> {
    return updateCard(id, data)
  }

  deleteCard(id: string): Promise<void> {
    return deleteCard(id)
  }

  listLlmModels(): Promise<LlmModelResponse[]> {
    return getCatalogLlmModels()
  }
}
