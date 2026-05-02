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

@Component({
  selector: 'ee-checkbox-input',
  imports: [A11yModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxInputComponent),
      multi: true,
    },
  ],
  template: `
    <label
      class="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-surface-container-highest p-3 transition hover:border-primary/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
    >
      <input
        cdkMonitorElementFocus
        type="checkbox"
        class="mt-0.5 h-4 w-4 rounded border-white/20 bg-surface text-primary accent-primary"
        [checked]="checkedValue()"
        [disabled]="isDisabled()"
        (blur)="markTouched()"
        (change)="updateValue(checkboxValue($event))"
      />
      <span>
        <span class="block ee-label text-on-surface">{{ label() }}</span>
        @if (hint()) {
          <span class="mt-1 block ee-data text-outline">{{ hint() }}</span>
        }
      </span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxInputComponent implements ControlValueAccessor {
  readonly label = input('Checkbox');
  readonly hint = input('');
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly checkedChanged = output<boolean>();
  protected readonly checkedValue = signal(false);
  protected readonly formDisabled = signal(false);

  private formBound = false;
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const checked = this.checked();
      if (!this.formBound) {
        this.checkedValue.set(checked);
      }
    });
  }

  writeValue(value: boolean | null): void {
    this.checkedValue.set(value === true);
  }

  registerOnChange(onChange: (value: boolean) => void): void {
    this.formBound = true;
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected checkboxValue(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled();
  }

  protected markTouched(): void {
    this.onTouched();
  }

  protected updateValue(value: boolean): void {
    this.checkedValue.set(value);
    this.checkedChanged.emit(value);
    this.onChange(value);
  }
}
