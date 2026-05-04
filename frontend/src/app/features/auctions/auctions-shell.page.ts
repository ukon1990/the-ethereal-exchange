import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auctions-shell',
  host: {
    class: 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
  },
  imports: [RouterOutlet],
  template: ` <router-outlet /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuctionsShellPage {}
