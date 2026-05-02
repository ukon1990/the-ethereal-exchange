import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { CharacterSummary, NavItem } from '../../models/ui-models';
import { SymbolIconComponent } from '../primitives/symbol-icon.component';

@Component({
  selector: 'ee-side-nav',
  imports: [SymbolIconComponent],
  template: `
    <aside
      class="hidden h-[calc(100vh-64px)] w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950/40 backdrop-blur-2xl md:flex"
      aria-label="Profession navigation"
    >
      <div class="border-b border-white/10 p-6">
        <div class="mb-4 flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full border border-outline/30 bg-surface-container-high"
          >
            <ee-symbol-icon class="text-2xl text-primary" name="swords" />
          </div>
          <div>
            <h2 class="ee-section-heading text-on-surface">Professions</h2>
            <p class="ee-data mt-1 text-outline">{{ character().skill }}</p>
          </div>
        </div>
        <button
          type="button"
          class="w-full rounded border border-outline/30 bg-surface-container px-4 py-2 ee-label text-on-surface transition hover:bg-surface-container-high"
          (click)="switchCharacter.emit()"
        >
          Switch Character
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto py-4">
        @for (item of items(); track item.id) {
          <button type="button" [class]="itemClass(item.id)" (click)="selected.emit(item.id)">
            <ee-symbol-icon class="text-[20px]" [name]="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        }
      </nav>
      <div class="border-t border-white/10 p-4">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded px-4 py-2 font-space-mono text-xs uppercase text-slate-400 transition hover:bg-white/5 hover:text-purple-300"
        >
          <ee-symbol-icon class="text-[18px]" name="settings" />
          Settings
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded px-4 py-2 font-space-mono text-xs uppercase text-slate-400 transition hover:bg-white/5 hover:text-purple-300"
        >
          <ee-symbol-icon class="text-[18px]" name="help" />
          Support
        </button>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavComponent {
  readonly items = input.required<readonly NavItem[]>();
  readonly activeId = input.required<string>();
  readonly character = input.required<CharacterSummary>();
  readonly selected = output<string>();
  readonly switchCharacter = output<void>();

  protected itemClass(id: string): string {
    const base =
      'flex w-full items-center gap-3 px-6 py-3 text-left font-space-mono text-xs uppercase transition';
    return id === this.activeId()
      ? `${base} border-r-4 border-primary-container bg-yellow-500/10 text-primary-container ee-arcane-glow`
      : `${base} text-slate-400 hover:bg-white/5 hover:text-purple-300`;
  }
}
