/**
 * Parses Blizzard auction `bonusKey` strings into Wowhead tooltip `bonus=` id list.
 * Keys are often colon-separated decimal ids (e.g. "6652:1472") or a single id.
 */
export function bonusKeyToWowheadBonusIds(bonusKey: string | null | undefined): readonly number[] {
  if (bonusKey == null) return [];
  const t = String(bonusKey).trim();
  if (!t.length) return [];
  const parts = t.split(':');
  const out: number[] = [];
  for (const p of parts) {
    const n = Number.parseInt(p, 10);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}
