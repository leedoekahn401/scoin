import { API_PREFIX } from '@schoolcoin/types';
import createFetchClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';

export type { components, paths } from './schema';

/**
 * Typed API client. `origin` is the API host (e.g. http://localhost:4000); generated paths
 * already include /api/v1. Sends cookies (the refresh token is httpOnly) and the access token,
 * and on a 401 tries one refresh before giving up.
 */
export function createClient(origin: string) {
  let accessToken: string | null = null;
  const client = createFetchClient<paths>({ baseUrl: origin, credentials: 'include' });
  const refreshUrl = `${origin}/${API_PREFIX}/auth/refresh`;

  const auth: Middleware = {
    onRequest({ request }) {
      if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
      return request;
    },
    async onResponse({ request, response }) {
      if (response.status !== 401 || request.url === refreshUrl) return response;
      const refreshed = await fetch(refreshUrl, { method: 'POST', credentials: 'include' });
      if (!refreshed.ok) return response;
      accessToken = ((await refreshed.json()) as { accessToken: string }).accessToken;
      const retry = request.clone();
      retry.headers.set('Authorization', `Bearer ${accessToken}`);
      return fetch(retry);
    },
  };

  client.use(auth);
  return Object.assign(client, {
    setAccessToken(token: string | null) {
      accessToken = token;
    },
  });
}
