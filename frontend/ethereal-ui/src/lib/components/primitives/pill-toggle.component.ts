import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface PillToggleOption {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'ee-pill-toggle',
  template: `
    <div
      class="inline-flex rounded-lg border border-white/5 bg-surface-container-highest p-1"
      role="group"
      [attr.aria-label]="label()"
    >
      @for (option of options(); track option.id) {
        <button
          type="button"
          [class]="optionClass(option.id)"
          [attr.aria-pressed]="option.id === activeId()"
          (click)="selected.emit(option.id)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillToggleComponent {
  readonly label = input('View mode');
  readonly options = input.required<readonly PillToggleOption[]>();
  readonly activeId = input.required<string>();
  readonly selected = output<string>();

  protected optionClass(optionId: string): string {
    const base = 'rounded px-3 py-1.5 ee-label transition';
    return optionId === this.activeId()
      ? `${base} bg-primary text-on-primary ee-arcane-glow`
      : `${base} text-on-surface-variant hover:bg-white/5 hover:text-on-surface`;
  }
}
