import { getWowheadTooltipUrl, wowheadLocaleFromBlizzardLocale } from './wowhead-tooltip-url';

describe('getWowheadTooltipUrl', () => {
  it('builds retail item URL with locale', () => {
    expect(getWowheadTooltipUrl(false, 19019, 'item', 'en')).toBe(
      'https://nether.wowhead.com/tooltip/item/19019?dataEnv=1&locale=en',
    );
  });

  it('builds classic path when isClassic is true', () => {
    expect(getWowheadTooltipUrl(true, 123, 'spell', 'de')).toContain('/wotlk/tooltip/spell/123');
  });
});

describe('wowheadLocaleFromBlizzardLocale', () => {
  it('maps en_US to en', () => {
    expect(wowheadLocaleFromBlizzardLocale('en_US')).toBe('en');
  });

  it('defaults to en when undefined', () => {
    expect(wowheadLocaleFromBlizzardLocale(undefined)).toBe('en');
  });
});
