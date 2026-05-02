import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  FilterPanelComponent,
  MarketTableComponent,
  PageFrameComponent,
  SearchInputComponent,
  SideNavComponent,
  TopNavComponent,
} from '@ui';

import { MarketBrowserService } from '../../core/services/market-browser.service';

@Component({
  selector: 'app-market-browser-page',
  imports: [
    FilterPanelComponent,
    MarketTableComponent,
    PageFrameComponent,
    SearchInputComponent,
    SideNavComponent,
    TopNavComponent,
  ],
  template: `
    <div class="flex h-screen flex-col overflow-hidden bg-background text-on-surface">
      <ee-top-nav
        [items]="viewModel().primaryNavItems"
        [activeId]="viewModel().activePrimaryNavId"
        [character]="viewModel().character"
      />
      <div class="flex min-h-0 flex-1">
        <ee-side-nav
          [items]="viewModel().professionNavItems"
          [activeId]="viewModel().activeProfessionId"
          [character]="viewModel().character"
        />
        <ee-page-frame title="Market Browser" eyebrow="Exchange Intelligence">
          <ee-search-input />
          <div class="flex min-h-0 flex-1 gap-element-gap overflow-hidden">
            <ee-filter-panel [sections]="viewModel().filterSections" />
            <ee-market-table
              [columns]="viewModel().tableColumns"
              [rows]="viewModel().rows"
              [summary]="viewModel().paginationSummary"
            />
          </div>
        </ee-page-frame>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketBrowserPage {
  private readonly marketBrowserService = inject(MarketBrowserService);
  protected readonly viewModel = this.marketBrowserService.viewModel;
}
