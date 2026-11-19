import createFetchClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

export type { paths } from './schema';

/**
 * Typed API client. Sends cookies (access/refresh tokens are httpOnly) and,
 * on a 401, tries one refresh before giving up.
 */
export function createClient(baseUrl: string) {
  const client = createFetchClient<paths>({ baseUrl, credentials: 'include' });

  const refreshOn401: Middleware = {
    async onResponse({ request, response }) {
      if (response.status !== 401 || request.url.endsWith('/auth/refresh')) return response;
      const refreshed = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!refreshed.ok) return response;
      return fetch(request);
    },
  };

  client.use(refreshOn401);
  return client;
}
