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
import { ActivatedRoute } from '@angular/router';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  fromEvent,
  map,
  startWith,
} from 'rxjs';

import {
  FilterPanelComponent,
  PageFrameComponent,
  SearchInputComponent,
  SymbolIconComponent,
  TableComponent,
} from '@ui';
import type { SortingState } from '@ui';

import { CraftingBrowserService } from '@core/services/crafting-browser.service';

import type { CraftingTableRow } from './crafting-browser.models';
import {
  createCraftingBrowserTableColumns,
  craftingBrowserHeaderRowClass,
  craftingBrowserRowClass,
  craftingBrowserRowGridTemplateColumns,
  craftingBrowserSkeletonRowClass,
} from './crafting-browser-table.columns';

const DEFAULT_VIEWPORT_WIDTH = 1280;
const RECIPE_MIN = 900;
const PROF_MIN = 1040;
const TREND_MIN = 1200;

@Component({
  selector: 'app-crafting-browser-page',
  host: {
    class: 'flex min-h-0 flex-1 overflow-hidden',
  },
  imports: [
    FilterPanelComponent,
    PageFrameComponent,
    SearchInputComponent,
    SymbolIconComponent,
    TableComponent,
  ],
  template: `
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <ee-page-frame [title]="'Crafting'" [eyebrow]="'Recipe economics'" bodyLayout="fill">
        <div class="flex items-center gap-2">
          <ee-search-input
            class="min-w-0 flex-1"
            [value]="viewModel().searchQuery"
            (valueChanged)="onSearchChanged($event)"
          />
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-2 rounded border border-white/10 bg-surface-container-high px-4 py-2 ee-label text-on-surface transition hover:bg-surface-container-highest lg:hidden"
            aria-label="Open filters"
            aria-haspopup="dialog"
            [attr.aria-expanded]="mobileFiltersOpen()"
            (click)="openMobileFilters()"
          >
            <ee-symbol-icon class="text-base" name="filter_alt" aria-hidden="true" />
            Filters
          </button>
        </div>
        <div class="flex min-h-0 min-w-0 flex-1 gap-element-gap overflow-hidden">
          <ee-filter-panel
            class="hidden lg:flex"
            [sections]="viewModel().filterSections"
            (optionToggled)="onFilterToggled($event)"
            (optionSelected)="onFilterSelected($event)"
            (rangeChanged)="onRangeChanged($event)"
            (reset)="onFiltersReset()"
          />
          <ee-table
            [data]="viewModel().rows"
            [columns]="activeColumns()"
            [getRowId]="rowId"
            [manualSorting]="true"
            [sorting]="tableSorting()"
            (sortingChange)="onTableSortingChange($event)"
            [clickableRows]="false"
            [loading]="viewModel().loading"
            [skeletonRowCount]="viewModel().pageSize"
            [skeletonRowClass]="skeletonRowClass"
            [rowGridTemplateColumns]="rowGridTemplate()"
            sectionAriaLabel="Crafting recipes"
            emptyMessage="No recipes available."
            [contentMinWidthClass]="tableMinWidth"
            [headerRowClass]="headerRowClass"
            [bodyRowClassFn]="bodyRowClass"
            [showFooter]="true"
            [footerSummary]="viewModel().paginationSummary"
            [showPagination]="true"
            (previousPage)="onPreviousPage()"
            (nextPage)="onNextPage()"
          />
        </div>
        <div
          class="fixed inset-0 z-50 flex transition-opacity duration-300 lg:hidden"
          [class.pointer-events-none]="!mobileFiltersOpen()"
          [class.opacity-0]="!mobileFiltersOpen()"
          [class.opacity-100]="mobileFiltersOpen()"
          [attr.inert]="mobileFiltersOpen() ? null : ''"
          [attr.aria-hidden]="!mobileFiltersOpen()"
          [attr.role]="mobileFiltersOpen() ? 'dialog' : null"
          [attr.aria-modal]="mobileFiltersOpen() ? 'true' : null"
          [attr.aria-label]="mobileFiltersOpen() ? 'Filter options' : null"
        >
          <button
            type="button"
            class="flex-1 bg-black/60 transition-opacity duration-300"
            aria-label="Close filters"
            (click)="closeMobileFilters()"
          ></button>
          <div
            class="flex h-full min-h-0 w-[min(22rem,90vw)] flex-col overflow-hidden border-l border-white/10 bg-surface p-4 transition-transform duration-300 ease-out"
            [class.translate-x-full]="!mobileFiltersOpen()"
            [class.translate-x-0]="mobileFiltersOpen()"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <h2 class="ee-section-heading text-primary">Filters</h2>
              <button
                type="button"
                class="rounded border border-white/10 bg-surface-container-high px-3 py-1.5 ee-label text-on-surface transition hover:bg-surface-container-highest"
                (click)="closeMobileFilters()"
              >
                Close
              </button>
            </div>
            <ee-filter-panel
              class="flex min-h-0 flex-1"
              panelClass="ee-glass flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg"
              [sections]="viewModel().filterSections"
              (optionToggled)="onMobileFilterToggled($event)"
              (optionSelected)="onMobileFilterSelected($event)"
              (rangeChanged)="onMobileRangeChanged($event)"
              (reset)="onMobileFiltersReset()"
            />
          </div>
        </div>
      </ee-page-frame>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingBrowserPage {
  private readonly craftingBrowserService = inject(CraftingBrowserService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly viewModel = this.craftingBrowserService.viewModel;
  protected readonly mobileFiltersOpen = signal(false);
  protected readonly viewportWidth = signal(DEFAULT_VIEWPORT_WIDTH);
  private readonly searchChanged = new Subject<string>();

  protected readonly allColumns = createCraftingBrowserTableColumns();
  protected readonly activeColumns = computed(() =>
    this.allColumns.filter((column) =>
      activeColumnIdsForViewport(this.viewportWidth()).has(String(column.id ?? '')),
    ),
  );
  protected readonly rowGridTemplate = computed(() =>
    craftingBrowserRowGridTemplateColumns(this.activeColumns()),
  );
  protected readonly bodyRowClass = craftingBrowserRowClass;
  protected readonly rowId = (row: CraftingTableRow) => row.rowId;
  protected readonly tableMinWidth = 'min-w-0 w-full';
  protected readonly headerRowClass = craftingBrowserHeaderRowClass();
  protected readonly skeletonRowClass = craftingBrowserSkeletonRowClass();
  protected readonly tableSorting = computed<SortingState>(() => {
    const vm = this.viewModel();
    return [{ id: vm.sortBy, desc: vm.sortDirection === 'desc' }];
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(window, 'resize')
        .pipe(
          startWith(null),
          map(() => window.innerWidth),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((width) => {
          this.viewportWidth.set(width);
        });
    }

    this.craftingBrowserService.bindRoute(this.route);
    const realmRoute = realmAncestorRoute(this.route);
    combineLatest([realmRoute.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([paramMap, queryParamMap]) => {
        this.craftingBrowserService.loadFromRoute(paramMap, queryParamMap);
      });
    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.craftingBrowserService.setSearchQuery(query);
      });
  }

  protected onSearchChanged(query: string): void {
    this.searchChanged.next(query);
  }

  protected onFilterToggled(optionId: string): void {
    this.craftingBrowserService.toggleFilter(optionId);
  }

  protected onFilterSelected(_change: { sectionId: string; optionId: string | null }): void {}

  protected onRangeChanged(change: {
    id: string;
    bound: 'min' | 'max';
    value: number | null;
  }): void {
    this.craftingBrowserService.setRangeFilter(change.id, change.bound, change.value);
  }

  protected onFiltersReset(): void {
    this.craftingBrowserService.resetFilters();
  }

  protected openMobileFilters(): void {
    this.mobileFiltersOpen.set(true);
  }

  protected closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  protected onMobileFilterToggled(optionId: string): void {
    this.onFilterToggled(optionId);
  }

  protected onMobileFilterSelected(change: { sectionId: string; optionId: string | null }): void {
    this.onFilterSelected(change);
  }

  protected onMobileRangeChanged(change: {
    id: string;
    bound: 'min' | 'max';
    value: number | null;
  }): void {
    this.onRangeChanged(change);
  }

  protected onMobileFiltersReset(): void {
    this.onFiltersReset();
    this.closeMobileFilters();
  }

  protected onPreviousPage(): void {
    this.craftingBrowserService.goToPreviousPage();
  }

  protected onNextPage(): void {
    this.craftingBrowserService.goToNextPage();
  }

  protected onTableSortingChange(sorting: SortingState): void {
    this.craftingBrowserService.applyTableSort(sorting);
  }
}

function activeColumnIdsForViewport(width: number): Set<string> {
  const active = new Set<string>(['itemName', 'outputPrice', 'profit']);
  if (width >= RECIPE_MIN) active.add('recipeName');
  if (width >= PROF_MIN) active.add('professionName');
  active.add('reagentCost');
  if (width >= TREND_MIN) {
    active.add('roiPercent');
    active.add('outputPriceChangePercent');
  }
  return active;
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
