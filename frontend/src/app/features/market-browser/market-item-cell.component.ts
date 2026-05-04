import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext } from '@tanstack/table-core';

import { WowheadItemTooltipDirective } from '@core/directives/wowhead-item-tooltip';
import { MarketItemRow, qualityToneClasses, SymbolIconComponent } from '@ui';

@Component({
  selector: 'app-market-item-cell',
  imports: [SymbolIconComponent, WowheadItemTooltipDirective],
  template: `
    <div class="flex min-w-0 items-center gap-3">
      <div [class]="iconClass()">
        @if (row().iconUrl) {
          <img
            class="h-6 w-6 rounded-sm object-cover"
            [src]="row().iconUrl"
            [alt]="row().name + ' icon'"
          />
        } @else {
          <ee-symbol-icon class="text-[18px]" name="deployed_code" />
        }
      </div>
      <span
        appWowheadItemTooltip
        [itemId]="itemId()"
        linkType="item"
        [class]="nameClass()"
        >{{ row().name }}</span
      >
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketItemCellComponent {
  protected readonly ctx = injectFlexRenderContext<CellContext<MarketItemRow, unknown>>();

  protected row(): MarketItemRow {
    return this.ctx.row.original;
  }

  protected itemId(): number {
    const n = Number.parseInt(this.row().id, 10);
    return Number.isFinite(n) ? n : 0;
  }

  protected iconClass(): string {
    return `flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-surface ${qualityToneClasses(this.row().quality)}`;
  }

  protected nameClass(): string {
    return `truncate text-sm font-semibold ${qualityToneClasses(this.row().quality).split(' ')[0]}`;
  }
}
