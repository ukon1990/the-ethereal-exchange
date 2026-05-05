import { describe, expect, it } from 'vitest';

import { bonusKeyToWowheadBonusIds } from './bonus-key-to-wowhead-bonus-ids';

describe('bonusKeyToWowheadBonusIds', () => {
  it('parses colon-separated ids', () => {
    expect(bonusKeyToWowheadBonusIds('6652:1472')).toEqual([6652, 1472]);
  });

  it('returns empty for blank', () => {
    expect(bonusKeyToWowheadBonusIds('')).toEqual([]);
    expect(bonusKeyToWowheadBonusIds(null)).toEqual([]);
  });
});
