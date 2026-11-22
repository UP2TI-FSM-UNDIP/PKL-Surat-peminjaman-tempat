export function routerBasePath(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}
