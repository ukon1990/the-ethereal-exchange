import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { AuctionItemService } from './auction-item.service';
import { AuctionMarketApiService } from '@api/generated';
import { QueryService } from '@core/services/query.service';
import { RealmSelectionService } from '@core/services/realm-selection.service';
import { LocaleService } from '@core/services/locale.service';

describe('AuctionItemService', () => {
  let service: AuctionItemService;

  beforeEach(() => {
    const queryParams = signal({
      query: '',
      qualityIds: [],
      itemClassIds: [],
      itemSubclassIds: [],
      recipeOnly: null,
      minPrice: null,
      maxPrice: null,
      minQuantity: null,
      maxQuantity: null,
      page: 1,
      pageSize: 25,
      sortBy: 'itemName',
      sortDirection: 'asc',
    });

    TestBed.configureTestingModule({
      providers: [
        AuctionItemService,
        {
          provide: AuctionMarketApiService,
          useValue: {
            getAuctionMarketFilters: vitest.fn(() => of({ filters: [] })),
            searchAuctionMarket: vitest.fn(() => of({ items: [] })),
          },
        },
        {
          provide: QueryService,
          useValue: {
            queryParams,
            region: signal(undefined),
            realmSlug: signal(undefined),
            locale: signal(undefined),
            navigateWithState: vitest.fn(),
          },
        },
        {
          provide: RealmSelectionService,
          useValue: {
            auctionHouseDetails: signal(undefined),
            commodityDetails: signal(undefined),
          },
        },
        {
          provide: LocaleService,
          useValue: {
            activeLocale: signal('en'),
          },
        },
      ],
    });
    service = TestBed.inject(AuctionItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
