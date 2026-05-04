import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WowheadTooltipService } from '@core/services/wowhead-tooltip';

@Component({
  selector: 'app-wowhead-tooltip-layer',
  imports: [],
  template: `
    @if (tooltip.active(); as tip) {
      <div
        class="wowhead-tooltip-root pointer-events-none fixed z-[1000] max-w-md overflow-hidden rounded border border-white/15 bg-surface-container-high/95 p-2 text-left text-on-surface shadow-lg backdrop-blur-sm ee-data"
        role="tooltip"
        [id]="tip.describedById"
        [style.left.px]="tip.leftPx"
        [style.top.px]="tip.topPx"
        [innerHTML]="tip.safeHtml"
      ></div>
    }
  `,
  styleUrl: './wowhead-tooltip-layer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WowheadTooltipLayer {
  protected readonly tooltip = inject(WowheadTooltipService);
}
