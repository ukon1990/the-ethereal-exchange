export type WowheadTooltipType = 'item' | 'spell' | 'npc' | 'quest' | 'achievement';

/**
 * Wowhead JSON tooltip endpoint (nether host).
 * @see https://www.wowhead.com/tooltips
 */
export function getWowheadTooltipUrl(
  isClassic: boolean,
  id: number,
  type: WowheadTooltipType | string = 'item',
  localeId: string,
): string {
  const base = `https://nether.wowhead.com${isClassic ? '/wotlk' : ''}/tooltip/${type}/${id}`;
  const params = new URLSearchParams({ dataEnv: '1', locale: localeId });
  return `${base}?${params.toString()}`;
}

export function wowheadLocaleFromBlizzardLocale(blizzardLocale: string | undefined): string {
  if (!blizzardLocale) return 'en';
  const primary = blizzardLocale.split(/[-_]/)[0];
  return primary?.toLowerCase() || 'en';
}
