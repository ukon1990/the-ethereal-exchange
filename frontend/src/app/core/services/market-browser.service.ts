import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { CurrencyAmount, FilterSection, ItemQuality, MarketItemRow } from '@ui';
import {
  AuctionMarketApiService,
  AuctionMarketFilter,
  AuctionMarketSearchPage,
  AuctionMarketSearchRow,
} from '../../api/generated';
import { MarketBrowserViewModel } from '../models/market-browser.models';

interface MarketBrowserQueryState {
  readonly query: string;
  readonly qualityIds: readonly number[];
  readonly itemClassIds: readonly number[];
  readonly itemSubclassIds: readonly number[];
  readonly recipeOnly: boolean | null;
  readonly minPrice: number | null;
  readonly maxPrice: number | null;
  readonly minQuantity: number | null;
  readonly maxQuantity: number | null;
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy:
    | 'itemName'
    | 'quality'
    | 'itemClass'
    | 'itemSubclass'
    | 'selectedPrice'
    | 'communityPrice'
    | 'selectedQuantity'
    | 'communityQuantity';
  readonly sortDirection: 'asc' | 'desc';
}

const defaultQueryState: MarketBrowserQueryState = {
  query: '',
  qualityIds: [],
  itemClassIds: [],
  itemSubclassIds: [],
  recipeOnly: null,
  minPrice: null,
  maxPrice: null,
  minQuantity: null,
  maxQuantity: null,
  page: 0,
  pageSize: 25,
  sortBy: 'itemName',
  sortDirection: 'asc',
};

@Injectable({
  providedIn: 'root',
})
export class MarketBrowserService {
  private readonly auctionMarketApi = inject(AuctionMarketApiService);
  private readonly router = inject(Router);
  private route: ActivatedRoute | null = null;
  private requestId = 0;
  private queryState: MarketBrowserQueryState = defaultQueryState;
  private routeRegion: 'us' | 'eu' | 'kr' | 'tw' | null = null;
  private routeRealmSlug: string | null = null;

  private readonly marketBrowser = signal<MarketBrowserViewModel>({
    primaryNavItems: [
      // TODO: remove
    ],
    activePrimaryNavId: 'market-browser',
    professionNavItems: [
      { id: 'alchemy', label: 'Alchemy', icon: 'water_medium' },
      { id: 'blacksmithing', label: 'Blacksmithing', icon: 'swords' },
      { id: 'enchanting', label: 'Enchanting', icon: 'magic_button' },
      { id: 'jewelcrafting', label: 'Jewelcrafting', icon: 'diamond' },
      { id: 'inscription', label: 'Inscription', icon: 'auto_stories' },
    ],
    activeProfessionId: 'blacksmithing',
    character: {
      name: 'GoblinKing99',
      realm: 'Illidan-US',
      level: 70,
      profession: 'Blacksmithing',
      skill: 'Skill Level 300/300',
    },
    filterSections: [],
    tableColumns: [
      { id: 'item', label: 'Item' },
      { id: 'quality', label: 'Quality' },
      { id: 'selected-price', label: 'Realm Price', align: 'right' },
      { id: 'selected-quantity', label: 'Realm Qty', align: 'right' },
      { id: 'community-price', label: 'Region Price', align: 'right' },
      { id: 'community-quantity', label: 'Region Qty', align: 'right' },
    ],
    rows: [],
    paginationSummary: 'Loading market items...',
    searchQuery: '',
    page: 0,
    totalPages: 0,
    loading: false,
  });

  readonly viewModel = this.marketBrowser.asReadonly();

  bindRoute(route: ActivatedRoute): void {
    this.route = route;
  }

  loadFromRoute(
    paramMap: ParamMap,
    queryParamMap: ParamMap,
  ): void {
    const region = paramMap.get('region')?.toLowerCase();
    const realmSlug = paramMap.get('realm');
    if (!isRegion(region) || !realmSlug) return;
    this.routeRegion = region;
    this.routeRealmSlug = realmSlug;
    this.queryState = readQueryState(queryParamMap);
    this.marketBrowser.update((vm) => ({
      ...vm,
      searchQuery: this.queryState.query,
      page: this.queryState.page,
      loading: true,
    }));

    const currentRequestId = ++this.requestId;
    this.auctionMarketApi
      .getAuctionMarketFilters(region, realmSlug, undefined, 'body', false, { transferCache: false })
      .subscribe({
        next: (response) => {
          if (currentRequestId !== this.requestId) return;
          this.marketBrowser.update((vm) => ({
            ...vm,
            filterSections: toFilterSections(response.filters ?? [], this.queryState),
          }));
        },
      });
    this.auctionMarketApi
      .searchAuctionMarket(
        region,
        realmSlug,
        undefined,
        this.queryState.page,
        this.queryState.pageSize,
        this.queryState.sortBy,
        this.queryState.sortDirection,
        this.queryState.query || undefined,
        this.queryState.qualityIds.length ? [...this.queryState.qualityIds] : undefined,
        this.queryState.itemClassIds.length ? [...this.queryState.itemClassIds] : undefined,
        this.queryState.itemSubclassIds.length ? [...this.queryState.itemSubclassIds] : undefined,
        this.queryState.recipeOnly ?? undefined,
        this.queryState.minPrice ?? undefined,
        this.queryState.maxPrice ?? undefined,
        this.queryState.minQuantity ?? undefined,
        this.queryState.maxQuantity ?? undefined,
        'body',
        false,
        { transferCache: false },
      )
      .subscribe({
        next: (response) => {
          if (currentRequestId !== this.requestId) return;
          this.applySearchPage(response);
        },
        error: () => {
          if (currentRequestId !== this.requestId) return;
          this.marketBrowser.update((vm) => ({
            ...vm,
            loading: false,
            rows: [],
            paginationSummary: 'No market items available.',
          }));
        },
      });
  }

  setActivePrimaryNavId(id: string): void {
    this.marketBrowser.update((vm) => ({ ...vm, activePrimaryNavId: id }));
  }

  setActiveProfessionId(id: string): void {
    this.marketBrowser.update((vm) => ({ ...vm, activeProfessionId: id }));
  }

  setSearchQuery(query: string): void {
    this.navigateWithState({ ...this.queryState, query, page: 0 });
  }

  toggleFilter(optionId: string): void {
    const [filterId, rawValue] = optionId.split(':');
    if (!filterId || !rawValue) return;
    if (filterId === 'recipeOnly') {
      this.navigateWithState({
        ...this.queryState,
        recipeOnly: this.queryState.recipeOnly === true ? null : true,
        page: 0,
      });
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    if (filterId === 'qualityIds') {
      this.navigateWithState({
        ...this.queryState,
        qualityIds: toggleNumber(this.queryState.qualityIds, value),
        page: 0,
      });
    } else if (filterId === 'itemClassIds') {
      this.navigateWithState({
        ...this.queryState,
        itemClassIds: toggleNumber(this.queryState.itemClassIds, value),
        page: 0,
      });
    } else if (filterId === 'itemSubclassIds') {
      this.navigateWithState({
        ...this.queryState,
        itemSubclassIds: toggleNumber(this.queryState.itemSubclassIds, value),
        page: 0,
      });
    }
  }

  setRangeFilter(id: string, bound: 'min' | 'max', value: number | null): void {
    const key =
      id === 'price'
        ? bound === 'min'
          ? 'minPrice'
          : 'maxPrice'
        : id === 'quantity'
          ? bound === 'min'
            ? 'minQuantity'
            : 'maxQuantity'
          : null;
    if (!key) return;
    this.navigateWithState({ ...this.queryState, [key]: value, page: 0 });
  }

  goToPreviousPage(): void {
    if (this.queryState.page <= 0) return;
    this.navigateWithState({ ...this.queryState, page: this.queryState.page - 1 });
  }

  goToNextPage(): void {
    if (this.queryState.page + 1 >= this.marketBrowser().totalPages) return;
    this.navigateWithState({ ...this.queryState, page: this.queryState.page + 1 });
  }

  resetFilters(): void {
    this.navigateWithState({ ...defaultQueryState, pageSize: this.queryState.pageSize });
  }

  private applySearchPage(response: AuctionMarketSearchPage): void {
    const totalItems = response.page.totalItems ?? 0;
    const page = response.page.page ?? 0;
    const pageSize = response.page.pageSize ?? this.queryState.pageSize;
    const start = totalItems === 0 ? 0 : page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalItems);
    this.marketBrowser.update((vm) => ({
      ...vm,
      loading: false,
      rows: (response.items ?? []).map(toMarketRow),
      page,
      totalPages: response.page.totalPages ?? 0,
      paginationSummary:
        totalItems === 0 ? 'No market items available.' : `Showing ${start}-${end} of ${totalItems} items`,
    }));
  }

  private navigateWithState(state: MarketBrowserQueryState): void {
    if (!this.route || !this.routeRegion || !this.routeRealmSlug) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(state),
      replaceUrl: true,
    });
  }
}

function isRegion(value: string | undefined): value is 'us' | 'eu' | 'kr' | 'tw' {
  return value === 'us' || value === 'eu' || value === 'kr' || value === 'tw';
}

function readQueryState(queryParamMap: ParamMap): MarketBrowserQueryState {
  return {
    ...defaultQueryState,
    query: queryParamMap.get('query') ?? '',
    qualityIds: queryParamMap.getAll('qualityIds').map(Number).filter(Number.isFinite),
    itemClassIds: queryParamMap.getAll('itemClassIds').map(Number).filter(Number.isFinite),
    itemSubclassIds: queryParamMap.getAll('itemSubclassIds').map(Number).filter(Number.isFinite),
    recipeOnly: queryParamMap.get('recipeOnly') === 'true' ? true : null,
    minPrice: nullableNumber(queryParamMap.get('minPrice')),
    maxPrice: nullableNumber(queryParamMap.get('maxPrice')),
    minQuantity: nullableNumber(queryParamMap.get('minQuantity')),
    maxQuantity: nullableNumber(queryParamMap.get('maxQuantity')),
    page: nullableNumber(queryParamMap.get('page')) ?? 0,
    pageSize: nullableNumber(queryParamMap.get('pageSize')) ?? defaultQueryState.pageSize,
    sortBy: readSortBy(queryParamMap.get('sortBy')),
    sortDirection: queryParamMap.get('sortDirection') === 'desc' ? 'desc' : 'asc',
  };
}

function nullableNumber(value: string | null): number | null {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readSortBy(value: string | null): MarketBrowserQueryState['sortBy'] {
  const allowed = [
    'itemName',
    'quality',
    'itemClass',
    'itemSubclass',
    'selectedPrice',
    'communityPrice',
    'selectedQuantity',
    'communityQuantity',
  ] as const;
  return allowed.find((candidate) => candidate === value) ?? 'itemName';
}

function toQueryParams(state: MarketBrowserQueryState): Record<string, string | number | boolean | readonly number[] | null> {
  return {
    query: state.query || null,
    qualityIds: state.qualityIds.length ? state.qualityIds : null,
    itemClassIds: state.itemClassIds.length ? state.itemClassIds : null,
    itemSubclassIds: state.itemSubclassIds.length ? state.itemSubclassIds : null,
    recipeOnly: state.recipeOnly,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    minQuantity: state.minQuantity,
    maxQuantity: state.maxQuantity,
    page: state.page === 0 ? null : state.page,
    pageSize: state.pageSize === defaultQueryState.pageSize ? null : state.pageSize,
    sortBy: state.sortBy === 'itemName' ? null : state.sortBy,
    sortDirection: state.sortDirection === 'asc' ? null : state.sortDirection,
  };
}

function toFilterSections(
  filters: readonly AuctionMarketFilter[],
  state: MarketBrowserQueryState,
): readonly FilterSection[] {
  return filters.map((filter) => {
    const selectedIds = selectedSet(filter.id, state);
    if (filter.type === AuctionMarketFilter.TypeEnum.Boolean) {
      return {
        id: filter.id,
        label: filter.label,
        type: filter.type,
        options: [{ id: `${filter.id}:true`, label: filter.label, selected: state.recipeOnly === true }],
      };
    }
    return {
      id: filter.id,
      label: filter.label,
      type: filter.type,
      min: filter.min ?? undefined,
      max: filter.max ?? undefined,
      selectedMin: selectedRangeValue(filter.id, 'min', state),
      selectedMax: selectedRangeValue(filter.id, 'max', state),
      options: (filter.options ?? []).map((option) => ({
        id: `${filter.id}:${option.id}`,
        label: option.label,
        selected: selectedIds.has(option.id),
        parentId: option.parentId ?? undefined,
        quality: filter.id === 'qualityIds' ? toQuality(option.label) : undefined,
      })),
    };
  });
}

function selectedSet(
  filterId: string,
  state: MarketBrowserQueryState,
): Set<string> {
  if (filterId === 'qualityIds') return new Set(state.qualityIds.map(String));
  if (filterId === 'itemClassIds') return new Set(state.itemClassIds.map(String));
  if (filterId === 'itemSubclassIds') return new Set(state.itemSubclassIds.map(String));
  return new Set();
}

function selectedRangeValue(
  filterId: string,
  bound: 'min' | 'max',
  state: MarketBrowserQueryState,
): number | undefined {
  if (filterId === 'price') return (bound === 'min' ? state.minPrice : state.maxPrice) ?? undefined;
  if (filterId === 'quantity') return (bound === 'min' ? state.minQuantity : state.maxQuantity) ?? undefined;
  return undefined;
}

function toMarketRow(row: AuctionMarketSearchRow): MarketItemRow {
  return {
    id: String(row.item.id),
    name: row.item.name,
    quality: toQuality(row.item.quality?.type ?? row.item.quality?.name),
    iconUrl: row.item.mediaUrl ?? undefined,
    minBuyout: toCurrency(row.selectedRealm?.price ?? undefined),
    marketValue: {},
    regionalAverage: toCurrency(row.community?.price ?? undefined),
    saleRate: 0,
    selectedQuantity: row.selectedRealm?.quantity ?? undefined,
    communityQuantity: row.community?.quantity ?? undefined,
  };
}

function toCurrency(copper: number | undefined): CurrencyAmount {
  if (copper === undefined || copper === null) return {};
  return {
    gold: Math.floor(copper / 10_000) || undefined,
    silver: Math.floor((copper % 10_000) / 100) || undefined,
    copper: copper % 100 || undefined,
  };
}

function toQuality(value: string | undefined): ItemQuality {
  const normalized = value?.toLowerCase();
  if (
    normalized === 'common' ||
    normalized === 'uncommon' ||
    normalized === 'rare' ||
    normalized === 'epic' ||
    normalized === 'legendary'
  ) {
    return normalized;
  }
  return 'common';
}

function toggleNumber(
  values: readonly number[],
  value: number,
): readonly number[] {
  return values.includes(value) ? values.filter((candidate) => candidate !== value) : [...values, value];
}
