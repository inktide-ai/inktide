/** SRP: единственная ответственность — получить URL аватара пользователя. */
export interface IAvatarService {
  getAvatarUrl(userId: string): Promise<string | null>
}
