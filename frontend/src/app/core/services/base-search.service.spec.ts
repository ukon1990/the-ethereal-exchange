import { TestBed } from '@angular/core/testing';
import { Injectable, signal } from '@angular/core';
import { of } from 'rxjs';
import { BaseSearchService, QueryBase } from './base-search.service';
import { QueryService } from '@core/services/query.service';
import { RealmSelectionService } from '@core/services/realm-selection.service';
import { LocaleService } from '@core/services/locale.service';

@Injectable()
class TestSearchService extends BaseSearchService<unknown, unknown, unknown, QueryBase> {
  constructor() {
    super({ page: 1, pageSize: 25 }, () => of({ filters: [] }));
  }
}

describe('BaseService', () => {
  let service: TestSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestSearchService,
        {
          provide: QueryService,
          useValue: {
            queryParams: signal<QueryBase>({ page: 1, pageSize: 25 }),
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
    service = TestBed.inject(TestSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
