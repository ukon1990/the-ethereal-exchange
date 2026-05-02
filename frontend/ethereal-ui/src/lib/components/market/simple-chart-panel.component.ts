import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SymbolIconComponent } from '../primitives/symbol-icon.component';

export interface ChartPoint {
  readonly x: number;
  readonly y: number;
}

@Component({
  selector: 'ee-simple-chart-panel',
  imports: [SymbolIconComponent],
  template: `
    <section class="ee-glass rounded-lg p-inner-padding">
      <div class="mb-6 flex items-center justify-between gap-4">
        <h2 class="ee-section-heading flex items-center gap-2 text-on-surface">
          <ee-symbol-icon class="text-outline" name="show_chart" />
          {{ title() }}
        </h2>
        <span class="ee-label text-outline">{{ rangeLabel() }}</span>
      </div>
      <div class="relative h-64 border-b border-l border-white/10 pb-4 pl-4">
        <div class="absolute inset-x-4 top-1/4 border-t border-dashed border-white/5"></div>
        <div class="absolute inset-x-4 top-1/2 border-t border-dashed border-white/5"></div>
        <div class="absolute inset-x-4 top-3/4 border-t border-dashed border-white/5"></div>
        <svg
          class="h-full w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <polyline
            class="drop-shadow-[0_0_8px_rgba(236,185,19,0.5)]"
            fill="none"
            [attr.points]="polylinePoints()"
            stroke="currentColor"
            stroke-width="2"
          />
          <polygon [attr.points]="areaPoints()" fill="currentColor" opacity="0.1" />
        </svg>
      </div>
    </section>
  `,
  host: {
    class: 'block text-primary',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleChartPanelComponent {
  readonly title = input.required<string>();
  readonly rangeLabel = input('14 days');
  readonly points = input.required<readonly ChartPoint[]>();

  protected readonly normalizedPoints = computed(() => {
    const points = this.points();
    if (points.length === 0) {
      return [];
    }

    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const spread = maxY - minY || 1;

    return points.map((point) => ({
      x: point.x,
      y: 100 - ((point.y - minY) / spread) * 85 - 5,
    }));
  });

  protected polylinePoints(): string {
    return this.normalizedPoints()
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
  }

  protected areaPoints(): string {
    const line = this.polylinePoints();
    return line ? `0,100 ${line} 100,100` : '';
  }
}
