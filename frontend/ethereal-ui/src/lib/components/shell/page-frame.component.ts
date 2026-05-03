import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ee-page-frame',
  host: {
    class: 'flex min-h-0 min-w-0 flex-1',
  },
  template: `
    <main class="flex min-h-0 min-w-0 flex-1 overflow-hidden p-container-padding">
      <div class="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-element-gap">
        <header class="flex flex-col gap-2">
          <p class="ee-label text-outline">{{ eyebrow() }}</p>
          <h1 class="font-cinzel text-3xl font-bold text-primary">{{ title() }}</h1>
        </header>
        <ng-content />
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFrameComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
}
