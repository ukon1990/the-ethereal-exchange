import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ee-admin-editable-cell',
  imports: [A11yModule],
  template: `
    <label [class]="labelClass()">
      <span class="sr-only">{{ label() }}</span>
      <input
        cdkMonitorElementFocus
        type="number"
        class="w-full border-none bg-transparent p-1 text-center font-space-mono text-sm text-on-surface focus:outline-none"
        [class.text-primary]="highlighted()"
        [attr.placeholder]="placeholder()"
        [value]="value()"
        (input)="valueChanged.emit(inputValue($event))"
      />
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditableCellComponent {
  readonly label = input.required<string>();
  readonly value = input<number | string>('');
  readonly placeholder = input('---');
  readonly highlighted = input(false);
  readonly valueChanged = output<string>();

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected labelClass(): string {
    const border = this.highlighted() ? 'border-primary' : 'border-white/10';
    return `block rounded border bg-black/50 transition focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(236,185,19,0.45)] ${border}`;
  }
}
