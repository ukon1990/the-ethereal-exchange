import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectFlexRenderContext } from '@tanstack/angular-table';
import type { CellContext } from '@tanstack/table-core';

import { formatQuality, MarketItemRow, qualityToneClasses } from '@ui';

@Component({
  selector: 'app-market-quality-cell',
  imports: [],
  template: `<div [class]="qualityClass()">{{ qualityLabel() }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketQualityCellComponent {
  protected readonly ctx = injectFlexRenderContext<CellContext<MarketItemRow, unknown>>();

  protected qualityClass(): string {
    return `ee-label ${qualityToneClasses(this.ctx.row.original.quality).split(' ')[0]}`;
  }

  protected qualityLabel(): string {
    return formatQuality(this.ctx.row.original.quality);
  }
}
