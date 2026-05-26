import { getMe } from '@/api/me'
import type { IAvatarService } from '@/shared/types/IAvatarService'

/** SRP: единственная ответственность — получить URL аватара из /api/me. */
export class MeAvatarService implements IAvatarService {
  async getAvatarUrl(_userId: string): Promise<string | null> {
    try {
      const me = await getMe()
      return me.pictureUrl ?? null
    } catch {
      return null // аватар не обязателен
    }
  }
}
