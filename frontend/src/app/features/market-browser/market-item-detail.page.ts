import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  ChartPanelComponent,
  CopperToCurrencyPipe,
  CurrencyAmountComponent,
  formatCopperCurrency,
  ItemStatCardComponent,
  PageFrameComponent,
  SymbolIconComponent,
  type ChartPoint,
  type ChartSeries,
} from '@ui';
import {
  AuctionMarketItemDetailPoint,
  AuctionMarketItemDetailResponse,
  AuctionMarketItemDetailSummary,
  AuctionMarketItemHourlyPoint,
} from '@api/generated';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';

import {
  ItemDetailVariantParams,
  MarketItemDetailService,
} from '@core/services/market-item-detail.service';

type RegionCode = 'us' | 'eu' | 'kr' | 'tw';

interface ItemDetailBackState {
  readonly returnUrl?: string;
  readonly returnLabel?: string;
}

interface TooltipRow {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-market-item-detail-page',
  host: {
    class: 'flex min-h-0 min-w-0 flex-1 flex-col',
  },
  imports: [
    RouterLink,
    PageFrameComponent,
    ChartPanelComponent,
    CopperToCurrencyPipe,
    CurrencyAmountComponent,
    ItemStatCardComponent,
    SymbolIconComponent,
  ],
  template: `
    <ee-page-frame
      [title]="pageTitle()"
      [eyebrow]="'Item Codex'"
      [loading]="loading()"
      titleId="item-codex-title"
    >
      @if (loading()) {
        <div class="flex flex-wrap items-center gap-2" aria-hidden="true">
          <div class="h-3 w-12 rounded bg-white/10 animate-pulse"></div>
          <div class="h-3 w-20 rounded bg-white/10 animate-pulse"></div>
          <div class="h-3 w-16 rounded bg-white/10 animate-pulse"></div>
          <div class="h-3 w-28 rounded bg-white/10 animate-pulse"></div>
        </div>
      } @else {
        <nav
          class="ee-label flex flex-wrap items-center gap-x-1 gap-y-1 text-outline select-text"
          aria-label="Breadcrumb"
        >
          <a
            [routerLink]="['/', regionRealm().region, regionRealm().realm]"
            class="rounded-sm hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >{{ regionRealm().regionLabel }}</a
          >
          <span aria-hidden="true">/</span>
          <a
            [routerLink]="['/', regionRealm().region, regionRealm().realm]"
            class="rounded-sm hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >{{ regionRealm().realmLabel }}</a
          >
          <span aria-hidden="true">/</span>
          <a
            [routerLink]="['..']"
            class="rounded-sm hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >Auctions</a
          >
          <span aria-hidden="true">/</span>
          <span class="text-on-surface" aria-current="page">{{ itemTitle() }}</span>
        </nav>
      }

      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        @if (loading()) {
          <div class="h-9 w-36 rounded bg-white/10 animate-pulse" aria-hidden="true"></div>
        } @else {
          <button
            type="button"
            class="inline-flex w-fit items-center gap-2 rounded border border-white/10 bg-surface-container-high px-3 py-2 ee-label text-on-surface transition hover:bg-surface-container-highest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            (click)="goBack()"
          >
            <ee-symbol-icon class="text-base" name="arrow_back" aria-hidden="true" />
            {{ backLabel() }}
          </button>
        }
        @if (detail(); as d0) {
          @if (showChartScopeToggle(d0)) {
            <div
              class="inline-flex w-fit max-w-full rounded border border-white/10 bg-surface-container-high p-0.5 ee-label"
              role="group"
              aria-label="Chart data scope"
            >
              <button
                type="button"
                class="rounded px-3 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                [class.bg-primary]="chartScope() === 'realm'"
                [class.text-on-primary]="chartScope() === 'realm'"
                [attr.aria-pressed]="chartScope() === 'realm'"
                (click)="chartScope.set('realm')"
              >
                Realm
              </button>
              <button
                type="button"
                class="rounded px-3 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                [class.bg-primary]="chartScope() === 'community'"
                [class.text-on-primary]="chartScope() === 'community'"
                [attr.aria-pressed]="chartScope() === 'community'"
                (click)="chartScope.set('community')"
              >
                Region
              </button>
            </div>
          }
        }
      </div>

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
          @for (i of skeletonCards; track i) {
            <div class="ee-glass rounded-lg p-inner-padding">
              <div class="mb-5 flex items-start justify-between gap-4">
                <div class="h-3 w-24 rounded bg-white/10 animate-pulse"></div>
                <div class="h-8 w-8 rounded-full bg-white/10 animate-pulse"></div>
              </div>
              <div class="h-7 w-32 rounded bg-white/10 animate-pulse"></div>
              <div class="mt-3 h-3 w-28 rounded bg-white/10 animate-pulse"></div>
            </div>
          }
        </div>
        <div class="space-y-4" aria-hidden="true">
          @for (i of skeletonCharts; track i) {
            <section class="ee-glass rounded-lg p-inner-padding">
              <div class="mb-6 flex items-center justify-between gap-4">
                <div class="h-5 w-36 rounded bg-white/10 animate-pulse"></div>
                <div class="h-3 w-16 rounded bg-white/10 animate-pulse"></div>
              </div>
              <div class="relative h-64 overflow-hidden border-b border-l border-white/10">
                <div class="absolute inset-x-5 top-1/4 h-px bg-white/10"></div>
                <div class="absolute inset-x-5 top-1/2 h-px bg-white/10"></div>
                <div class="absolute inset-x-5 top-3/4 h-px bg-white/10"></div>
                <div class="absolute inset-x-6 bottom-4 flex h-36 items-end gap-2">
                  @for (bar of skeletonBars; track bar.index) {
                    <div
                      class="w-full rounded-t bg-white/10 animate-pulse"
                      [style.height.%]="bar.height"
                    ></div>
                  }
                </div>
              </div>
            </section>
          }
        </div>
      } @else if (error()) {
        <div class="ee-glass rounded-lg border border-error/40 p-inner-padding text-error">
          Could not load this item. Try again from the market browser.
        </div>
      } @else if (detail(); as d) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ee-item-stat-card
            label="Realm price"
            icon="payments"
            [currency]="d.summary.selectedRealmPrice | copperToCurrency"
            [caption]="priceChangeCaption(d.summary.selectedRealmPriceChangePercent)"
            tone="primary"
          />
          <ee-item-stat-card
            label="Realm quantity"
            icon="inventory_2"
            [value]="quantityLabel(d.summary.selectedRealmQuantity)"
            [caption]="''"
          />
          @if (!d.regionalMetricsRedundant && summaryHasCommunityPrice(d.summary)) {
            <ee-item-stat-card
              label="Community price"
              icon="public"
              [currency]="d.summary.communityPrice | copperToCurrency"
              [caption]="priceChangeCaption(d.summary.communityPriceChangePercent)"
            />
          }
          @if (!d.regionalMetricsRedundant && summaryHasCommunityQuantity(d.summary)) {
            <ee-item-stat-card
              label="Community quantity"
              icon="groups"
              [value]="quantityLabel(d.summary.communityQuantity)"
              [caption]="realmVsCommunityCaption(d.summary.realmVsCommunityPricePercent)"
            />
          }
        </div>

        <p class="ee-data text-on-surface-variant select-text">
          Snapshot: realm {{ d.selectedRealm.date ?? '—' }}, hour
          {{ d.selectedRealm.hourOfDay ?? '—' }}
          @if (showCommunitySnapshotLine(d)) {
            <span>
              · community {{ d.community.date ?? '—' }}, hour
              {{ d.community.hourOfDay ?? '—' }}</span
            >
          }
        </p>

        @if (d.marketDataSources.length) {
          <p class="ee-label text-outline select-text">
            Data version:
            @for (s of d.marketDataSources; track s.connectedRealmId) {
              <span class="ml-2 font-mono text-[0.7rem]">{{
                s.auctionHouseLastModified ?? '—'
              }}</span>
            }
          </p>
        }

        <ng-template #dailyChartTip let-ctx>
          <div
            class="ee-glass min-w-64 rounded-md border border-white/15 bg-surface-container/95 px-3 py-2 text-left text-xs text-on-surface shadow-lg backdrop-blur-md"
          >
            <div class="ee-label text-outline mb-1.5">{{ dailyTooltipTitle(d, ctx.x) }}</div>
            <div class="space-y-1 font-space-mono text-[11px]">
              @for (row of dailyTooltipRows(d, ctx.x); track row.label) {
                <div class="flex justify-between gap-4">
                  <span class="text-outline">{{ row.label }}</span>
                  <span class="text-on-surface">{{ row.value }}</span>
                </div>
              }
              @if (!dailyTooltipRows(d, ctx.x).length) {
                <div class="text-outline">No values for this day</div>
              }
            </div>
          </div>
        </ng-template>

        <ng-template #hourlyChartTip let-ctx>
          <div
            class="ee-glass min-w-64 rounded-md border border-white/15 bg-surface-container/95 px-3 py-2 text-left text-xs text-on-surface shadow-lg backdrop-blur-md"
          >
            <div class="ee-label text-outline mb-1.5">{{ hourlyTooltipTitle(d, ctx.x) }}</div>
            <div class="space-y-1 font-space-mono text-[11px]">
              @for (row of hourlyTooltipRows(d, ctx.x); track row.label) {
                <div class="flex justify-between gap-4">
                  <span class="text-outline">{{ row.label }}</span>
                  <span class="text-on-surface">{{ row.value }}</span>
                </div>
              }
              @if (!hourlyTooltipRows(d, ctx.x).length) {
                <div class="text-outline">No values for this hour</div>
              }
            </div>
          </div>
        </ng-template>

        <ee-chart-panel
          title="Daily market"
          rangeLabel="14 days"
          [series]="dailyChartSeries()"
          [tooltipTemplate]="dailyChartTip"
          description="Average quantity per hour as bars; buyout spread and average as lines."
        />

        <ee-chart-panel
          title="Hourly snapshot"
          rangeLabel="Snapshot day"
          [series]="hourlyChartSeries()"
          [tooltipTemplate]="hourlyChartTip"
          description="Listed quantity per hour as bars; buyout spread and average as lines."
        />

        @if (d.crafting) {
          <section class="ee-glass rounded-lg p-inner-padding">
            <h2 class="ee-section-heading mb-4 flex items-center gap-2 text-on-surface">
              <ee-symbol-icon class="text-outline" name="handyman" />
              Crafting
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse ee-data text-left text-on-surface">
                <thead>
                  <tr class="border-b border-white/10 ee-label text-outline">
                    <th class="py-2 pr-4">Recipe</th>
                    <th class="py-2 pr-4 text-right">Reagent cost</th>
                    <th class="py-2 pr-4 text-right">Buyout</th>
                    <th class="py-2 pr-4 text-right">Profit</th>
                    <th class="py-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-white/5">
                    <td class="py-3 pr-4 select-text">
                      {{ d.crafting.recipeName ?? d.crafting.recipeId }}
                    </td>
                    <td class="py-3 pr-4 text-right tabular-nums select-text">
                      <ee-currency-amount
                        class="inline-flex justify-end"
                        [amount]="d.crafting.reagentCost | copperToCurrency"
                      />
                    </td>
                    <td class="py-3 pr-4 text-right tabular-nums select-text">
                      <ee-currency-amount
                        class="inline-flex justify-end"
                        [amount]="d.crafting.buyout | copperToCurrency"
                      />
                    </td>
                    <td class="py-3 pr-4 text-right tabular-nums select-text">
                      <ee-currency-amount
                        class="inline-flex justify-end"
                        [amount]="d.crafting.profit | copperToCurrency"
                      />
                    </td>
                    <td class="py-3 text-right tabular-nums select-text">
                      {{ formatRoi(d.crafting.roiPercent) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    </ee-page-frame>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketItemDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly detailService = inject(MarketItemDetailService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly detail = signal<AuctionMarketItemDetailResponse | null>(null);
  protected readonly chartScope = signal<'realm' | 'community'>('realm');
  protected readonly skeletonCards = [0, 1, 2, 3] as const;
  protected readonly skeletonCharts = [0, 1] as const;
  protected readonly skeletonBars = [
    { index: 0, height: 42 },
    { index: 1, height: 64 },
    { index: 2, height: 36 },
    { index: 3, height: 78 },
    { index: 4, height: 55 },
    { index: 5, height: 88 },
    { index: 6, height: 48 },
    { index: 7, height: 70 },
    { index: 8, height: 58 },
    { index: 9, height: 82 },
    { index: 10, height: 46 },
    { index: 11, height: 66 },
  ] as const;

  private readonly backState = signal<ItemDetailBackState>({});

  private readonly routeCtx = signal<{
    region: RegionCode;
    realmSlug: string;
    itemId: number;
    variant: ItemDetailVariantParams;
  } | null>(null);

  protected readonly regionRealm = computed(() => {
    const ctx = this.routeCtx();
    if (!ctx) {
      return { region: '', realm: '', realmLabel: '', regionLabel: '' };
    }
    return {
      region: ctx.region,
      realm: ctx.realmSlug,
      realmLabel: formatRealmLabel(ctx.realmSlug),
      regionLabel: ctx.region.toUpperCase(),
    };
  });

  protected readonly itemTitle = computed(() => this.detail()?.item.name ?? 'Item');

  protected readonly pageTitle = computed(() => this.detail()?.item.name ?? 'Item');

  protected readonly dailyChartSeries = computed(() => {
    const d = this.detail();
    if (!d) return [];
    const pts =
      d.regionalMetricsRedundant || this.chartScope() === 'realm'
        ? d.dailySeriesRealm
        : d.dailySeriesCommunity;
    return dailyPointsToChartSeries(pts);
  });

  protected readonly hourlyChartSeries = computed(() => {
    const d = this.detail();
    if (!d) return [];
    const pts =
      d.regionalMetricsRedundant || this.chartScope() === 'realm'
        ? d.hourlySeriesRealm
        : d.hourlySeriesCommunity;
    return hourlyPointsToChartSeries(pts);
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const raw = window.history.state as Record<string, unknown> | null;
      this.backState.set({
        returnUrl: typeof raw?.['returnUrl'] === 'string' ? raw['returnUrl'] : undefined,
        returnLabel: typeof raw?.['returnLabel'] === 'string' ? raw['returnLabel'] : undefined,
      });
    }

    const realmRoute = realmAncestorRoute(this.route);

    combineLatest([realmRoute.paramMap, this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([realmPm, itemPm, q]) => ({
          region: realmPm.get('region'),
          realmSlug: realmPm.get('realm'),
          itemId: Number(itemPm.get('itemId')),
          variant: variantFromQuery(q),
        })),
        distinctUntilChanged(
          (a, b) =>
            a.region === b.region &&
            a.realmSlug === b.realmSlug &&
            a.itemId === b.itemId &&
            variantEqual(a.variant, b.variant),
        ),
        switchMap((ctx) => {
          if (!isRegion(ctx.region) || !ctx.realmSlug || !Number.isFinite(ctx.itemId)) {
            this.loading.set(false);
            this.error.set(true);
            this.detail.set(null);
            this.routeCtx.set(null);
            return of(null);
          }
          this.routeCtx.set({
            region: ctx.region,
            realmSlug: ctx.realmSlug,
            itemId: ctx.itemId,
            variant: ctx.variant,
          });
          this.loading.set(true);
          this.error.set(false);
          return this.detailService
            .loadItemDetail(ctx.region, ctx.realmSlug, ctx.itemId, ctx.variant)
            .pipe(
              finalize(() => this.loading.set(false)),
              catchError(() => {
                this.error.set(true);
                this.detail.set(null);
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (res) {
          this.detail.set(res);
          if (res.regionalMetricsRedundant || !showChartScopeToggleFn(res)) {
            this.chartScope.set('realm');
          }
        }
      });
  }

  protected backLabel(): string {
    return this.backState().returnLabel ?? 'Back to market';
  }

  protected goBack(): void {
    const url = this.backState().returnUrl;
    if (url) {
      void this.router.navigateByUrl(url);
      return;
    }
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  protected formatRoi(pct: number | null | undefined): string {
    if (pct == null || !Number.isFinite(pct)) return '—';
    return `${pct.toFixed(1)}%`;
  }

  protected quantityLabel(q: number | null | undefined): string {
    if (q == null || !Number.isFinite(q)) return '—';
    return String(Math.round(q));
  }

  protected dailyTooltipTitle(d: AuctionMarketItemDetailResponse, x: number): string {
    const point = this.dailyTooltipPoint(d, x);
    return point?.statDate ? point.statDate : `Day ${Math.round(x) + 1}`;
  }

  protected dailyTooltipRows(d: AuctionMarketItemDetailResponse, x: number): TooltipRow[] {
    const point = this.dailyTooltipPoint(d, x);
    if (!point) return [];
    return [
      { label: 'date', value: point.statDate ?? '—' },
      { label: 'quantity / hour', value: numberDisplay(point.avgQuantity) },
      { label: 'min quantity', value: numberDisplay(point.minQuantity) },
      { label: 'max quantity', value: numberDisplay(point.maxQuantity) },
      { label: 'min price', value: formatCopperCurrency(point.minPrice) },
      { label: 'p25 price', value: formatCopperCurrency(point.p25Price) },
      { label: 'avg price', value: formatCopperCurrency(point.avgPrice) },
      { label: 'p75 price', value: formatCopperCurrency(point.p75Price) },
      { label: 'max price', value: formatCopperCurrency(point.maxPrice) },
    ];
  }

  protected hourlyTooltipTitle(d: AuctionMarketItemDetailResponse, x: number): string {
    const point = this.hourlyTooltipPoint(d, x);
    const hour = point?.hourOfDay ?? Math.max(0, Math.min(23, Math.round(x)));
    const prefix = `${String(hour).padStart(2, '0')}:00`;
    return point?.timestamp ? `${prefix} · ${point.timestamp}` : prefix;
  }

  protected hourlyTooltipRows(d: AuctionMarketItemDetailResponse, x: number): TooltipRow[] {
    const point = this.hourlyTooltipPoint(d, x);
    if (!point) return [];
    return [
      { label: 'hour', value: `${String(point.hourOfDay).padStart(2, '0')}:00` },
      { label: 'timestamp', value: point.timestamp ?? '—' },
      { label: 'quantity / hour', value: numberDisplay(point.totalQuantity) },
      { label: 'min price', value: formatCopperCurrency(point.minPrice) },
      { label: 'p25 price', value: formatCopperCurrency(point.p25Price) },
      { label: 'avg price', value: formatCopperCurrency(point.avgPrice) },
      { label: 'p75 price', value: formatCopperCurrency(point.p75Price) },
      { label: 'max price', value: formatCopperCurrency(point.maxPrice) },
    ];
  }

  protected priceChangeCaption(pct: number | null | undefined): string {
    if (pct == null || !Number.isFinite(pct)) return '';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}% vs prior day`;
  }

  protected realmVsCommunityCaption(pct: number | null | undefined): string {
    if (pct == null || !Number.isFinite(pct)) return '';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}% vs community`;
  }

  protected summaryHasCommunityPrice(s: AuctionMarketItemDetailSummary): boolean {
    const p = s.communityPrice;
    return p != null && Number.isFinite(p);
  }

  protected summaryHasCommunityQuantity(s: AuctionMarketItemDetailSummary): boolean {
    const q = s.communityQuantity;
    return q != null && Number.isFinite(q);
  }

  protected showChartScopeToggle(d: AuctionMarketItemDetailResponse): boolean {
    return showChartScopeToggleFn(d);
  }

  protected showCommunitySnapshotLine(d: AuctionMarketItemDetailResponse): boolean {
    return showChartScopeToggleFn(d);
  }

  private dailyTooltipPoint(
    d: AuctionMarketItemDetailResponse,
    x: number,
  ): AuctionMarketItemDetailPoint | undefined {
    const points =
      d.regionalMetricsRedundant || this.chartScope() === 'realm'
        ? d.dailySeriesRealm
        : d.dailySeriesCommunity;
    return points[Math.round(x)];
  }

  private hourlyTooltipPoint(
    d: AuctionMarketItemDetailResponse,
    x: number,
  ): AuctionMarketItemHourlyPoint | undefined {
    const points =
      d.regionalMetricsRedundant || this.chartScope() === 'realm'
        ? d.hourlySeriesRealm
        : d.hourlySeriesCommunity;
    const hour = Math.round(x);
    return points.find((p) => p.hourOfDay === hour);
  }
}

function realmAncestorRoute(route: ActivatedRoute): ActivatedRoute {
  let r: ActivatedRoute | null = route;
  while (r) {
    const m = r.snapshot.paramMap;
    if (m.has('region') && m.has('realm')) {
      return r;
    }
    r = r.parent;
  }
  return route;
}

function variantFromQuery(q: ParamMap): ItemDetailVariantParams {
  return {
    bonusKey: q.get('bonusKey') ?? '',
    modifierKey: q.get('modifierKey') ?? '',
    petSpeciesId: Number(q.get('petSpeciesId') ?? 0) || 0,
  };
}

function variantEqual(a: ItemDetailVariantParams, b: ItemDetailVariantParams): boolean {
  return (
    a.bonusKey === b.bonusKey &&
    a.modifierKey === b.modifierKey &&
    a.petSpeciesId === b.petSpeciesId
  );
}

function isRegion(value: string | null | undefined): value is RegionCode {
  return value === 'us' || value === 'eu' || value === 'kr' || value === 'tw';
}

function formatRealmLabel(slug: string): string {
  const t = slug.replace(/-/g, ' ');
  return t.length ? t.charAt(0).toUpperCase() + t.slice(1) : slug;
}

function numberDisplay(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString('en-US');
}

function showChartScopeToggleFn(d: AuctionMarketItemDetailResponse): boolean {
  if (d.regionalMetricsRedundant) return false;
  const p = d.summary.communityPrice;
  const q = d.summary.communityQuantity;
  const hasPrice = p != null && Number.isFinite(p);
  const hasQty = q != null && Number.isFinite(q);
  return hasPrice || hasQty;
}

function pickDailyLinePoints(
  points: readonly AuctionMarketItemDetailPoint[],
  fn: (p: AuctionMarketItemDetailPoint) => number | null | undefined,
): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const y = fn(points[i]!);
    if (y != null && Number.isFinite(y)) {
      out.push({ x: i, y });
    }
  }
  return out;
}

function pickDailyQuantityBars(points: readonly AuctionMarketItemDetailPoint[]): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const q = points[i]!.avgQuantity;
    if (q != null && Number.isFinite(q) && q >= 0) {
      out.push({ x: i, y: q });
    }
  }
  return out;
}

/** Lines use `price` scale; quantity uses `quantity` scale (`ee-chart-panel` + `chart.ts`). */
function dailyPointsToChartSeries(points: readonly AuctionMarketItemDetailPoint[]): ChartSeries[] {
  if (points.length === 0) return [];

  const qtyPts = pickDailyQuantityBars(points);
  const series: ChartSeries[] = [];

  if (qtyPts.length > 0) {
    series.push({
      id: 'quantity',
      kind: 'column',
      yScaleKey: 'quantity',
      color: 'tertiary-container',
      points: qtyPts,
    });
  }

  let lower = pickDailyLinePoints(points, (p) => p.p25Price);
  let mid = pickDailyLinePoints(points, (p) => p.avgPrice);
  let upper = pickDailyLinePoints(points, (p) => p.p75Price);
  if (lower.length === 0 && mid.length === 0 && upper.length === 0) {
    lower = pickDailyLinePoints(points, (p) => p.minPrice);
    mid = pickDailyLinePoints(points, (p) => p.avgPrice);
    upper = pickDailyLinePoints(points, (p) => p.maxPrice);
  }

  if (lower.length > 0) {
    series.push({ id: 'low', kind: 'line', yScaleKey: 'price', color: 'secondary', points: lower });
  }
  if (mid.length > 0) {
    series.push({
      id: 'mid',
      kind: 'line',
      yScaleKey: 'price',
      color: 'primary-container',
      points: mid,
    });
  }
  if (upper.length > 0) {
    series.push({ id: 'high', kind: 'line', yScaleKey: 'price', color: 'error', points: upper });
  }

  return series;
}

function pickHourlyLinePoints(
  sorted: readonly AuctionMarketItemHourlyPoint[],
  fn: (p: AuctionMarketItemHourlyPoint) => number | null | undefined,
): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (const p of sorted) {
    const y = fn(p);
    if (y != null && Number.isFinite(y)) {
      out.push({ x: p.hourOfDay, y });
    }
  }
  return out;
}

function pickHourlyQuantityBars(sorted: readonly AuctionMarketItemHourlyPoint[]): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (const p of sorted) {
    const q = p.totalQuantity;
    if (q != null && Number.isFinite(q) && q >= 0) {
      out.push({ x: p.hourOfDay, y: q });
    }
  }
  return out;
}

function hourlyPointsToChartSeries(points: readonly AuctionMarketItemHourlyPoint[]): ChartSeries[] {
  const sorted = [...points].sort((a, b) => a.hourOfDay - b.hourOfDay);
  if (sorted.length === 0) return [];

  const series: ChartSeries[] = [];

  const qtyPts = pickHourlyQuantityBars(sorted);
  if (qtyPts.length > 0) {
    series.push({
      id: 'quantity',
      kind: 'column',
      yScaleKey: 'quantity',
      color: 'tertiary-container',
      points: qtyPts,
    });
  }

  let lower = pickHourlyLinePoints(sorted, (p) => p.p25Price);
  let mid = pickHourlyLinePoints(sorted, (p) => p.avgPrice);
  let upper = pickHourlyLinePoints(sorted, (p) => p.p75Price);
  if (lower.length === 0 && mid.length === 0 && upper.length === 0) {
    lower = pickHourlyLinePoints(sorted, (p) => p.minPrice);
    mid = pickHourlyLinePoints(sorted, (p) => p.avgPrice);
    upper = pickHourlyLinePoints(sorted, (p) => p.maxPrice);
  }

  if (lower.length > 0) {
    series.push({ id: 'low', kind: 'line', yScaleKey: 'price', color: 'secondary', points: lower });
  }
  if (mid.length > 0) {
    series.push({
      id: 'mid',
      kind: 'line',
      yScaleKey: 'price',
      color: 'primary-container',
      points: mid,
    });
  }
  if (upper.length > 0) {
    series.push({ id: 'high', kind: 'line', yScaleKey: 'price', color: 'error', points: upper });
  }

  return series;
}
