import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { MarketBrowserPage } from './market-browser.page';
import { AuctionItemService } from '@core/services/auction-item.service';

describe('MarketBrowserPage', () => {
  const serviceStub = {
    queryParams: signal({
      sortBy: 'itemName' as const,
      sortDirection: 'asc' as const,
    }),
    currentRows: signal([
      {
        id: '19019',
        name: 'Healing Potion',
        itemClassName: 'Consumable',
        itemSubclassName: 'Potion',
        quality: 'rare' as const,
        minBuyout: { gold: 1 },
        marketValue: {},
        regionalAverage: { gold: 1 },
        saleRate: 0,
        selectedQuantity: 4,
      },
    ]),
    filterSections: signal([]),
    pageData: signal({
      page: {
        pageSize: 10,
      },
    }),
    isLoading: signal(false),
    setSearchQuery: vitest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketBrowserPage],
      providers: [
        { provide: AuctionItemService, useValue: serviceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
            parent: {
              snapshot: {
                paramMap: convertToParamMap({ region: 'eu', realm: 'argent-dawn' }),
              },
              paramMap: of(convertToParamMap({ region: 'eu', realm: 'argent-dawn' })),
            },
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the market browser shell with service data from the API-backed service', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1400,
    });
    const fixture = TestBed.createComponent(MarketBrowserPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Market Browser');
    expect(compiled.textContent).toContain('Item');
    expect(compiled.textContent).toContain('Class');
    expect(compiled.textContent).toContain('Subclass');
    expect(compiled.textContent).toContain('Quality');
    expect(compiled.textContent).toContain('Price');
    expect(compiled.textContent).toContain('Quantity');
    expect(compiled.textContent).toContain('Healing Potion');
    expect(compiled.textContent).toContain('Consumable');
    expect(compiled.textContent).toContain('Potion');
  });
});
