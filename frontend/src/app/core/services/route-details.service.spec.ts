import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { readMarketBrowserQueryState } from '@core/mappers/market-browser-query.mapper';
import { QUERY_PARAM_MAPPER, QueryService } from './query.service';
import { RealmSelectionService } from '@core/services/realm-selection.service';

describe('RouteDetailsService', () => {
  let service: QueryService<unknown>;

  beforeEach(() => {
    const events = new Subject<NavigationEnd>();
    const childRoute = {
      snapshot: {
        paramMap: convertToParamMap({ region: 'eu', realm: 'argent-dawn' }),
        queryParamMap: convertToParamMap({}),
      },
      firstChild: null,
    };
    const rootRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({}),
      },
      firstChild: childRoute,
    };

    TestBed.configureTestingModule({
      providers: [
        QueryService,
        { provide: QUERY_PARAM_MAPPER, useValue: readMarketBrowserQueryState },
        { provide: ActivatedRoute, useValue: rootRoute },
        {
          provide: Router,
          useValue: {
            events,
            routerState: { root: rootRoute },
            navigate: vitest.fn(),
          },
        },
        {
          provide: RealmSelectionService,
          useValue: {
            selected: signal(undefined),
          },
        },
      ],
    });
    service = TestBed.inject(QueryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('reads query params from the deepest activated route', () => {
    const events = new Subject<NavigationEnd>();
    const leafRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({
          qualityIds: '4',
          minPrice: '100',
        }),
      },
      firstChild: null,
    };
    const auctionsRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({}),
      },
      firstChild: leafRoute,
    };
    const realmRoute = {
      snapshot: {
        paramMap: convertToParamMap({ region: 'eu', realm: 'argent-dawn' }),
        queryParamMap: convertToParamMap({}),
      },
      firstChild: auctionsRoute,
    };
    const rootRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({}),
      },
      firstChild: realmRoute,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        QueryService,
        { provide: QUERY_PARAM_MAPPER, useValue: readMarketBrowserQueryState },
        { provide: ActivatedRoute, useValue: rootRoute },
        {
          provide: Router,
          useValue: {
            events,
            routerState: { root: rootRoute },
            navigate: vitest.fn(),
          },
        },
        {
          provide: RealmSelectionService,
          useValue: {
            selected: signal(undefined),
          },
        },
      ],
    });

    const filteredService = TestBed.inject(QueryService);
    events.next(new NavigationEnd(1, '/en/eu/argent-dawn/auctions', '/en/eu/argent-dawn/auctions'));

    expect(filteredService.queryParams()).toMatchObject({
      qualityIds: [4],
      minPrice: 100,
    });
  });

  it('reads sort params from the route query string', () => {
    const events = new Subject<NavigationEnd>();
    const childRoute = {
      snapshot: {
        paramMap: convertToParamMap({ region: 'eu', realm: 'argent-dawn' }),
        queryParamMap: convertToParamMap({
          sortBy: 'selectedPrice',
          sortDirection: 'desc',
        }),
      },
      firstChild: null,
    };
    const rootRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({}),
      },
      firstChild: childRoute,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        QueryService,
        { provide: QUERY_PARAM_MAPPER, useValue: readMarketBrowserQueryState },
        { provide: ActivatedRoute, useValue: rootRoute },
        {
          provide: Router,
          useValue: {
            events,
            routerState: { root: rootRoute },
            navigate: vitest.fn(),
          },
        },
        {
          provide: RealmSelectionService,
          useValue: {
            selected: signal(undefined),
          },
        },
      ],
    });

    const sortedService = TestBed.inject(QueryService);
    events.next(new NavigationEnd(1, '/en/eu/argent-dawn/auctions', '/en/eu/argent-dawn/auctions'));

    expect(sortedService.queryParams()).toMatchObject({
      sortBy: 'selectedPrice',
      sortDirection: 'desc',
    });
  });
});
