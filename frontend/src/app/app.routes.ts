import { Route } from '@angular/router';

import { realmSelectedGuard } from '@core/guards/realm-selected.guard';

export type TitledRoutes = (Route & {
  icon?: string;
  children?: TitledRoutes;
})[];

export const routes: TitledRoutes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/select-realm/select-realm.page').then((module) => module.SelectRealmPage),
  },
  {
    path: ':region/:realm',
    canActivate: [realmSelectedGuard],
    children: [
      {
        path: '',
        redirectTo: 'auctions',
        pathMatch: 'full',
      },
      {
        path: 'auctions',
        title: 'Auctions',
        icon: 'travel_explore',
        loadComponent: () =>
          import('./features/auctions/auctions-shell.page').then((m) => m.AuctionsShellPage),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/market-browser/market-browser.page').then(
                (module) => module.MarketBrowserPage,
              ),
          },
          {
            path: 'item/:itemId',
            loadComponent: () =>
              import('./features/market-browser/market-item-detail.page').then(
                (m) => m.MarketItemDetailPage,
              ),
          },
        ],
      },
    ],
  },
];
