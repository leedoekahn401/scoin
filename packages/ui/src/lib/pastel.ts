/**
 * The pastel bank as an ordered, hue-spread rotation. Use `pastelAt(i)` for
 * category coding and `pastelFor(seed)` for stable per-entity colours
 * (avatars). Never invent a new pastel hex in a component.
 */
export const PASTELS = [
  'sky',
  'peach',
  'mint',
  'lavender',
  'butter',
  'rose',
  'aqua',
  'sage',
  'periwinkle',
  'clay',
] as const;

export type PastelKey = (typeof PASTELS)[number];

export function pastelAt(index: number): PastelKey {
  return PASTELS[((index % PASTELS.length) + PASTELS.length) % PASTELS.length]!;
}

export function pastelFor(seed: string): PastelKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return pastelAt(Math.abs(hash));
}

/** Inline style for an element carrying the `pastel-tinted` class. */
export function pastelStyle(key: PastelKey): React.CSSProperties {
  return { ['--pastel-tint' as string]: `var(--pastel-${key})` };
}
