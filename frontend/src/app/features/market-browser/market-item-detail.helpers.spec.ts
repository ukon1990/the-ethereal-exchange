import {
  dailyPointsToChartSeries,
  dayOfWeekFromTimestamp,
  hourlyPriceHeatmapCellsFromPoints,
  shouldFallbackToCommodityFetch,
} from './market-item-detail.helpers';

describe('market-item-detail helpers', () => {
  it('falls back to commodity fetch when both scopes are empty', () => {
    const detail = {
      regionalMetricsRedundant: false,
      summary: {
        selectedRealmPrice: null,
        selectedRealmQuantity: null,
        commodityPrice: null,
        commodityQuantity: null,
      },
    } as never;

    expect(shouldFallbackToCommodityFetch(detail)).toBe(true);
  });

  it('does not duplicate overlapping daily price lines', () => {
    const series = dailyPointsToChartSeries([
      {
        avgQuantity: 10,
        minPrice: 100,
        avgPrice: 100,
        maxPrice: 100,
        p25Price: null,
        p75Price: null,
      },
    ] as never);

    expect(series.map((entry) => entry.id)).toEqual(['quantity', 'low']);
  });

  it('aggregates hourly price heatmap cells by weekday/hour', () => {
    const cells = hourlyPriceHeatmapCellsFromPoints([
      { timestamp: '2026-05-04T10:00:00Z', hourOfDay: 10, avgPrice: 100 },
      { timestamp: '2026-05-04T10:30:00Z', hourOfDay: 10, avgPrice: 200 },
      { timestamp: '2026-05-04T11:00:00Z', hourOfDay: 11, avgPrice: 300 },
    ] as never);

    const mondayTen = cells.find((c) => c.row === 0 && c.col === 10);
    expect(mondayTen?.value).toBe(150);
    expect(cells.length).toBe(2);
  });

  it('maps UTC sunday to row 6', () => {
    expect(dayOfWeekFromTimestamp('2026-05-10T00:00:00Z')).toBe(6);
  });
});
