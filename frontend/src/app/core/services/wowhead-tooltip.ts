import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { RealmSelectionService } from '@core/services/realm-selection.service';
import {
  getWowheadTooltipUrl,
  wowheadLocaleFromBlizzardLocale,
  type WowheadTooltipType,
} from '@core/utils/wowhead-tooltip-url';
import type { CurrencyAmount } from '@ui';

export interface WowheadTooltipOverlay {
  readonly safeHtml: SafeHtml;
  readonly leftPx: number;
  readonly topPx: number;
  readonly describedById: string;
}

interface WowheadTooltipJson {
  readonly tooltip?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WowheadTooltipService {
  private static nextId = 0;

  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly realmSelection = inject(RealmSelectionService);

  private readonly cache = new Map<string, string>();

  readonly loading = signal(false);
  readonly active = signal<WowheadTooltipOverlay | null>(null);

  clear(): void {
    this.active.set(null);
  }

  /**
   * Loads (or reads from cache) the Wowhead tooltip HTML and shows the overlay.
   */
  async show(options: {
    readonly wowheadType: WowheadTooltipType | string;
    readonly id: number;
    readonly bonusIds?: readonly number[];
    readonly isClassic: boolean;
    readonly currentBuyout?: CurrencyAmount | null;
    readonly event: MouseEvent | FocusEvent;
    readonly describedById: string;
  }): Promise<void> {
    const locale = wowheadLocaleFromBlizzardLocale(this.realmSelection.selected()?.locale);
    let url = getWowheadTooltipUrl(options.isClassic, options.id, options.wowheadType, locale);
    const bonus = options.bonusIds?.filter((b) => b > 0) ?? [];
    if (bonus.length) {
      url += `&bonus=${bonus.join(':')}`;
    }

    const { leftPx, topPx } = pointerOffset(options.event);
    const composeTooltipHtml = (html: string): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(appendCurrentBuyout(html, options.currentBuyout));

    const cached = this.cache.get(url);
    if (cached) {
      this.active.set({
        safeHtml: composeTooltipHtml(cached),
        leftPx,
        topPx,
        describedById: options.describedById,
      });
      return;
    }

    this.loading.set(true);
    try {
      const body = await firstValueFrom(this.http.get<WowheadTooltipJson>(url));
      const raw = body.tooltip ?? '';
      this.cache.set(url, raw);
      this.active.set({
        safeHtml: composeTooltipHtml(raw),
        leftPx,
        topPx,
        describedById: options.describedById,
      });
    } finally {
      this.loading.set(false);
    }
  }

  static nextDescribedById(): string {
    WowheadTooltipService.nextId += 1;
    return `wowhead-tip-${WowheadTooltipService.nextId}`;
  }
}

function appendCurrentBuyout(
  html: string,
  currentBuyout: CurrencyAmount | null | undefined,
): string {
  if (!hasCurrencyValue(currentBuyout)) return html;

  return `${html}${renderCurrentBuyout(currentBuyout)}`;
}

function renderCurrentBuyout(amount: CurrencyAmount): string {
  return `<table class="whtt-app-market"><tbody><tr><td><div class="whtt-current-buyout">Current Buyout: ${renderMoney(amount)}</div></td></tr></tbody></table>`;
}

function renderMoney(amount: CurrencyAmount): string {
  return [
    amount.gold ? `<span class="moneygold">${formatCurrencyPart(amount.gold)}</span>` : '',
    amount.silver ? `<span class="moneysilver">${formatCurrencyPart(amount.silver)}</span>` : '',
    amount.copper ? `<span class="moneycopper">${formatCurrencyPart(amount.copper)}</span>` : '',
  ].join('');
}

function hasCurrencyValue(amount: CurrencyAmount | null | undefined): amount is CurrencyAmount {
  return Boolean(amount?.gold || amount?.silver || amount?.copper);
}

function formatCurrencyPart(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function pointerOffset(event: MouseEvent | FocusEvent): { leftPx: number; topPx: number } {
  if (event instanceof MouseEvent) {
    return { leftPx: event.clientX + 30, topPx: event.clientY };
  }
  const el = event.target;
  if (el instanceof HTMLElement) {
    const r = el.getBoundingClientRect();
    return { leftPx: r.left + r.width + 12, topPx: r.top };
  }
  return { leftPx: 0, topPx: 0 };
}
