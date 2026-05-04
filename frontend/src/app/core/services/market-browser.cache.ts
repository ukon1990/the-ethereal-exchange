import { Injectable } from '@angular/core';

import type { AuctionMarketFilterResponse, AuctionMarketSearchPage } from '@api/generated';

interface CachedEntry<T> {
  readonly version: string;
  readonly value: T;
}

const MAX_SEARCH_ENTRIES = 50;

@Injectable({ providedIn: 'root' })
export class MarketBrowserCache {
  private readonly filters = new Map<string, CachedEntry<AuctionMarketFilterResponse>>();
  private readonly search = new Map<string, CachedEntry<AuctionMarketSearchPage>>();
  private readonly searchLruKeys: string[] = [];

  getFilters(routeKey: string, version: string): AuctionMarketFilterResponse | undefined {
    const entry = this.filters.get(routeKey);
    if (!entry || entry.version !== version) {
      return undefined;
    }
    return entry.value;
  }

  setFilters(routeKey: string, version: string, value: AuctionMarketFilterResponse): void {
    this.filters.set(routeKey, { version, value });
  }

  getSearch(searchKey: string, version: string): AuctionMarketSearchPage | undefined {
    const entry = this.search.get(searchKey);
    if (!entry || entry.version !== version) {
      return undefined;
    }
    return entry.value;
  }

  setSearch(searchKey: string, version: string, value: AuctionMarketSearchPage): void {
    const existingIndex = this.searchLruKeys.indexOf(searchKey);
    if (existingIndex >= 0) {
      this.searchLruKeys.splice(existingIndex, 1);
    }
    this.searchLruKeys.push(searchKey);
    this.search.set(searchKey, { version, value });

    while (this.searchLruKeys.length > MAX_SEARCH_ENTRIES) {
      const evictKey = this.searchLruKeys.shift();
      if (evictKey) {
        this.search.delete(evictKey);
      }
    }
  }
}
