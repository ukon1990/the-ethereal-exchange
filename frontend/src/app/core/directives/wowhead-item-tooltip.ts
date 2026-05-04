import { Directive, ElementRef, inject, input } from '@angular/core';

import { WowheadTooltipService } from '@core/services/wowhead-tooltip';
import type { CurrencyAmount } from '@ui';

@Directive({
  selector: '[appWowheadItemTooltip]',
  host: {
    '(mouseenter)': 'onMouseEnter($event)',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class WowheadItemTooltipDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly tooltipService = inject(WowheadTooltipService);

  readonly itemId = input.required<number>();
  readonly linkType = input<string>('item');
  readonly bonusIds = input<readonly number[]>([]);
  readonly isClassic = input(false);
  readonly currentBuyout = input<CurrencyAmount | null>(null);
  private describedById: string | null = null;

  protected onMouseEnter(event: MouseEvent): void {
    void this.requestTooltip(event);
  }

  protected onMouseLeave(): void {
    this.dismiss();
  }

  private async requestTooltip(event: MouseEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;

    this.describedById = WowheadTooltipService.nextDescribedById();
    this.host.nativeElement.setAttribute('aria-describedby', this.describedById);

    try {
      await this.tooltipService.show({
        wowheadType: this.linkType(),
        id,
        bonusIds: this.bonusIds(),
        isClassic: this.isClassic(),
        currentBuyout: this.currentBuyout(),
        event,
        describedById: this.describedById,
      });
    } catch {
      this.clearAria();
      this.tooltipService.clear();
    }
  }

  private dismiss(): void {
    this.clearAria();
    this.tooltipService.clear();
  }

  private clearAria(): void {
    if (this.describedById) {
      this.host.nativeElement.removeAttribute('aria-describedby');
      this.describedById = null;
    }
  }
}
