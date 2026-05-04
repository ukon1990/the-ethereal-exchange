import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CharacterSummary, TopNavComponent } from '@ui';

import { WowheadTooltipLayer } from '@core/components/wowhead-tooltip-layer/wowhead-tooltip-layer';
import { MenuService } from '@core/services/menu.service';
import { RealmSelectionService } from '@core/services/realm-selection.service';

const FALLBACK_CHARACTER: CharacterSummary = {
  name: 'Adventurer',
  realm: 'No realm selected',
  level: 0,
  profession: '',
  skill: '',
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent, WowheadTooltipLayer],
  template: `
    <div class="flex h-dvh flex-col overflow-hidden bg-background text-on-surface">
      <app-wowhead-tooltip-layer />
      <a
        href="#page-main"
        class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:font-medium focus:text-on-primary focus:shadow-lg"
      >
        Skip to main content
      </a>
      <ee-top-nav
        [items]="menu.links()"
        [activeId]="'dashboard'"
        [character]="character()"
        [mobileDrawerOpen]="mobileNavOpen()"
        (toggleMobileDrawer)="toggleMobileNav()"
        (navSelected)="onPrimaryNavSelected($event)"
      />
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <router-outlet />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly menu = inject(MenuService);
  private readonly realmSelection = inject(RealmSelectionService);
  protected readonly mobileNavOpen = signal(false);

  protected readonly character = computed<CharacterSummary>(() => {
    const realm = this.realmSelection.selected();
    if (!realm) return FALLBACK_CHARACTER;
    return {
      ...FALLBACK_CHARACTER,
      realm: `${realm.name}-${realm.region.toUpperCase()}`,
    };
  });

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected onPrimaryNavSelected(id: string): void {
    console.log(id);
  }
}
