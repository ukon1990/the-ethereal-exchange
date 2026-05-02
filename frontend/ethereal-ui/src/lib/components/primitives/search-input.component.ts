import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { SymbolIconComponent } from './symbol-icon.component';

@Component({
  selector: 'ee-search-input',
  imports: [A11yModule, SymbolIconComponent],
  template: `
    <label class="relative block">
      <span class="sr-only">{{ label() }}</span>
      <ee-symbol-icon
        class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-primary"
        name="search"
      />
      <input
        cdkMonitorElementFocus
        type="search"
        class="w-full rounded-lg border border-white/10 bg-surface-container-highest px-4 py-3 pl-12 font-inter text-sm text-on-surface placeholder:text-outline transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        [attr.placeholder]="placeholder()"
        [value]="value()"
        (input)="valueChanged.emit(inputValue($event))"
      />
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  readonly label = input('Search');
  readonly placeholder = input('Search items, reagents, or recipes...');
  readonly value = input('');
  readonly valueChanged = output<string>();

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
