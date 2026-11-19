import { createClient } from '@schoolcoin/api-client';

export const api = createClient(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000');
