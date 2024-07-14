export interface Factory<T = { content: string }> {
  transform: (contract: string) => T;
}
