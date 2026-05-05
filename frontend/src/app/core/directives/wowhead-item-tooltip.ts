import { Directive, ElementRef, inject, input } from '@angular/core';

import { bonusKeyToWowheadBonusIds } from '@core/utils/bonus-key-to-wowhead-bonus-ids';
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
  /** When set and `bonusIds` is empty, tooltip uses parsed Wowhead bonus ids from this key. */
  readonly bonusKey = input<string | null>(null);
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
      const explicit = this.bonusIds();
      const fromKey = bonusKeyToWowheadBonusIds(this.bonusKey());
      const bonusIds = explicit.length > 0 ? explicit : fromKey;
      await this.tooltipService.show({
        wowheadType: this.linkType(),
        id,
        bonusIds,
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
