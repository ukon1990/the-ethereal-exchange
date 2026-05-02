import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { CharacterSummary, NavItem } from '../../models/ui-models';
import { IconButtonComponent } from '../primitives/icon-button.component';
import { SymbolIconComponent } from '../primitives/symbol-icon.component';

@Component({
  selector: 'ee-top-nav',
  imports: [IconButtonComponent, SymbolIconComponent],
  template: `
    <header
      class="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      <div class="flex min-w-0 items-center gap-8">
        <div
          class="truncate font-cinzel text-2xl font-bold tracking-[0.05em] text-primary-container drop-shadow-[0_0_8px_rgba(236,185,19,0.4)]"
        >
          The Ethereal Exchange
        </div>
        <nav class="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          @for (item of items(); track item.id) {
            <button type="button" [class]="navClass(item.id)" (click)="navSelected.emit(item.id)">
              {{ item.label }}
            </button>
          }
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <ee-icon-button icon="account_circle" label="Account" />
        <ee-icon-button icon="settings" label="Settings" />
        <ee-icon-button icon="query_stats" label="Analytics" />
        <div
          class="hidden h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-surface-container text-primary sm:flex"
          [attr.aria-label]="characterLabel()"
        >
          <ee-symbol-icon class="text-[18px]" name="person" />
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  readonly items = input.required<readonly NavItem[]>();
  readonly activeId = input.required<string>();
  readonly character = input.required<CharacterSummary>();
  readonly navSelected = output<string>();

  protected navClass(id: string): string {
    const base =
      'rounded px-1 py-2 font-cinzel text-sm font-bold uppercase tracking-wide transition hover:bg-white/5';
    return id === this.activeId()
      ? `${base} border-b-2 border-primary-container text-primary-container`
      : `${base} text-slate-400 hover:text-on-surface`;
  }

  protected characterLabel(): string {
    const character = this.character();
    return `${character.name}, level ${character.level}, ${character.realm}`;
  }
}
