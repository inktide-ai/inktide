/** SRP: единственная ответственность — синхронизация локали UI при изменении токена. */
export interface ILocaleSync {
  sync(locale: string | undefined): void
}
