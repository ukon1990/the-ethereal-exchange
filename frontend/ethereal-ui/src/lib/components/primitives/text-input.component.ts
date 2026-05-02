import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextInputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url';

@Component({
  selector: 'ee-text-input',
  imports: [A11yModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
  template: `
    <label class="block">
      <span class="mb-2 block ee-label text-outline">{{ label() }}</span>
      <input
        cdkMonitorElementFocus
        [type]="type()"
        class="w-full rounded-lg border border-white/10 bg-surface-container-highest px-4 py-3 font-inter text-sm text-on-surface placeholder:text-outline transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        [attr.placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [value]="viewValue()"
        (blur)="markTouched()"
        (input)="updateValue(inputValue($event))"
      />
      @if (hint()) {
        <span class="mt-2 block ee-data text-outline">{{ hint() }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputComponent implements ControlValueAccessor {
  readonly label = input('Label');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly type = input<TextInputType>('text');
  readonly value = input('');
  readonly disabled = input(false);
  readonly valueChanged = output<string>();
  protected readonly viewValue = signal('');
  protected readonly formDisabled = signal(false);

  private formBound = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const value = this.value();
      if (!this.formBound) {
        this.viewValue.set(value);
      }
    });
  }

  writeValue(value: string | null): void {
    this.viewValue.set(value ?? '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.formBound = true;
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  protected markTouched(): void {
    this.onTouched();
  }

  protected updateValue(value: string): void {
    this.viewValue.set(value);
    this.valueChanged.emit(value);
    this.onChange(value);
  }
}
