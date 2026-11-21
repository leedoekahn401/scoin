/**
 * Demo tools (one-click accounts, scan simulator, "simulate transfer") are on
 * unless NEXT_PUBLIC_DEMO_TOOLS=0. Turn them off for a real deployment.
 */
export const DEMO_TOOLS = process.env.NEXT_PUBLIC_DEMO_TOOLS !== '0';
