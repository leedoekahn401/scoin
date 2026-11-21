/** TanStack Query keys for the POS app. Always use these, never inline arrays. */
export const queryKeys = {
  menu: ['pos', 'menu'] as const,
  orders: ['pos', 'orders'] as const,
  publicSettings: ['settings', 'public'] as const,
  demoCards: ['dev', 'demo-cards'] as const,
};
