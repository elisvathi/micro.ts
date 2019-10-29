export interface IConfiguration {
  getFromPath<T>(path: string): T;
}
