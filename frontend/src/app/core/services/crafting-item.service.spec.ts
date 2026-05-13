import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { CraftingItemService } from './crafting-item.service';
import { CraftingMarketApiService } from '@api/generated';
import { QueryService } from '@core/services/query.service';
import { RealmSelectionService } from '@core/services/realm-selection.service';
import { LocaleService } from '@core/services/locale.service';
import { defaultCraftingBrowserQueryState } from '@core/mappers/crafting-browser-query.mapper';

describe('CraftingItemService', () => {
  let service: CraftingItemService;

  beforeEach(() => {
    const queryParams = signal(defaultCraftingBrowserQueryState);

    TestBed.configureTestingModule({
      providers: [
        CraftingItemService,
        {
          provide: CraftingMarketApiService,
          useValue: {
            filters: vitest.fn(() => of({ filters: [] })),
            search: vitest.fn(() =>
              of({ items: [], page: { page: 0, pageSize: 25, totalPages: 0 } }),
            ),
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
    service = TestBed.inject(CraftingItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
