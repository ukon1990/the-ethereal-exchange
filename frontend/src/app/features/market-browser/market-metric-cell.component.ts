import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext } from '@tanstack/table-core';

import { CurrencyAmountComponent, MarketItemRow } from '@ui';

@Component({
  selector: 'app-market-metric-cell',
  imports: [CurrencyAmountComponent],
  template: `
    @switch (columnId()) {
      @case ('selectedPrice') {
        <ee-currency-amount
          class="justify-self-end"
          [amount]="row().minBuyout"
          [emphasis]="row().selected === true"
        />
      }
      @case ('selectedQuantity') {
        @if (row().selectedQuantity !== undefined) {
          <div class="justify-self-end ee-data text-on-surface">
            {{ row().selectedQuantity }}
          </div>
        } @else {
          <ee-currency-amount class="justify-self-end opacity-80" [amount]="row().marketValue" />
        }
      }
      @case ('communityPrice') {
        <ee-currency-amount class="justify-self-end opacity-80" [amount]="row().regionalAverage" />
      }
      @case ('communityQuantity') {
        <div class="justify-self-end ee-data text-tertiary-container">
          {{
            row().communityQuantity !== undefined
              ? row().communityQuantity
              : row().saleRate.toFixed(2)
          }}
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketMetricCellComponent {
  protected readonly ctx = injectFlexRenderContext<CellContext<MarketItemRow, unknown>>();

  protected row(): MarketItemRow {
    return this.ctx.row.original;
  }

  protected columnId(): string {
    return this.ctx.column.id;
  }
}
