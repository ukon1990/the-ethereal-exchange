import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Subject, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';

import {
  FilterPanelComponent,
  PageFrameComponent,
  SearchInputComponent,
  TableComponent,
} from '@ui';
import type { MarketItemRow } from '@ui';

import { MarketBrowserService } from '@core/services/market-browser.service';

import {
  createMarketBrowserTableColumns,
  marketBrowserContentMinWidthClass,
  marketBrowserHeaderRowClass,
  marketBrowserRowClass,
} from './market-browser-table.columns';

@Component({
  selector: 'app-market-browser-page',
  host: {
    class: 'flex min-h-0 flex-1 overflow-hidden',
  },
  imports: [
    FilterPanelComponent,
    PageFrameComponent,
    SearchInputComponent,
    // SideNavComponent,
    TableComponent,
  ],
  template: `
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- TODO: Maybe add back later?
       <ee-side-nav
        [items]="viewModel().professionNavItems"
        [activeId]="viewModel().activeProfessionId"
        [character]="viewModel().character"
        [primaryNavItems]="viewModel().primaryNavItems"
        [activePrimaryId]="viewModel().activePrimaryNavId"
        [mobileOpen]="mobileNavOpen()"
        (mobileOpenChange)="mobileNavOpen.set($event)"
        (primarySelected)="onPrimaryNavSelected($event)"
        (selected)="onProfessionSelected($event)"
      />*/}}-->
      <ee-page-frame title="Market Browser" eyebrow="Exchange Intelligence">
        <ee-search-input
          [value]="viewModel().searchQuery"
          (valueChanged)="onSearchChanged($event)"
        />
        <div class="flex min-h-0 min-w-0 flex-1 gap-element-gap overflow-hidden">
          <ee-filter-panel
            [sections]="viewModel().filterSections"
            (optionToggled)="onFilterToggled($event)"
            (optionSelected)="onFilterSelected($event)"
            (rangeChanged)="onRangeChanged($event)"
            (reset)="onFiltersReset()"
          />
          <ee-table
            [data]="viewModel().rows"
            [columns]="marketColumns"
            [getRowId]="marketRowId"
            sectionAriaLabel="Market items"
            emptyMessage="No market items available."
            [contentMinWidthClass]="marketTableMinWidth"
            [headerRowClass]="marketTableHeaderRow"
            [bodyRowClassFn]="marketRowClass"
            [showFooter]="true"
            [footerSummary]="viewModel().paginationSummary"
            [showPagination]="true"
            (previousPage)="onPreviousPage()"
            (nextPage)="onNextPage()"
          />
        </div>
      </ee-page-frame>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketBrowserPage {
  private readonly marketBrowserService = inject(MarketBrowserService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly viewModel = this.marketBrowserService.viewModel;
  protected readonly mobileNavOpen = signal(false);
  private readonly searchChanged = new Subject<string>();

  protected readonly marketColumns = createMarketBrowserTableColumns();
  protected readonly marketRowClass = marketBrowserRowClass;
  protected readonly marketRowId = (row: MarketItemRow) => row.id;
  protected readonly marketTableMinWidth = marketBrowserContentMinWidthClass();
  protected readonly marketTableHeaderRow = marketBrowserHeaderRowClass();

  constructor() {
    this.marketBrowserService.bindRoute(this.route);
    combineLatest([this.route.parent?.paramMap ?? this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([paramMap, queryParamMap]) => {
        this.marketBrowserService.loadFromRoute(paramMap, queryParamMap);
      });
    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.marketBrowserService.setSearchQuery(query);
      });
  }

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected onPrimaryNavSelected(id: string): void {
    this.marketBrowserService.setActivePrimaryNavId(id);
    this.mobileNavOpen.set(false);
  }

  protected onProfessionSelected(id: string): void {
    this.marketBrowserService.setActiveProfessionId(id);
  }

  protected onSearchChanged(query: string): void {
    this.searchChanged.next(query);
  }

  protected onFilterToggled(optionId: string): void {
    this.marketBrowserService.toggleFilter(optionId);
  }

  protected onFilterSelected(change: { sectionId: string; optionId: string | null }): void {
    this.marketBrowserService.selectFilter(change.sectionId, change.optionId);
  }

  protected onRangeChanged(change: {
    id: string;
    bound: 'min' | 'max';
    value: number | null;
  }): void {
    this.marketBrowserService.setRangeFilter(change.id, change.bound, change.value);
  }

  protected onFiltersReset(): void {
    this.marketBrowserService.resetFilters();
  }

  protected onPreviousPage(): void {
    this.marketBrowserService.goToPreviousPage();
  }

  protected onNextPage(): void {
    this.marketBrowserService.goToNextPage();
  }
}
