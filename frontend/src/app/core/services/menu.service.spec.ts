import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot } from '@angular/router';

import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let routeSnapshot: ActivatedRouteSnapshot;
  let routerState: RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    service = TestBed.inject(MenuService);
    routeSnapshot = {} as ActivatedRouteSnapshot;
    routerState = { url: '/test' } as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getActiveRouteLinks', () => {
    it('should correctly return valid route links', async () => {
      const links = await service.getActiveRouteLinks(
        [
          { title: 'First page', path: '', icon: 'home' },
          { title: 'Second page', path: 'second', icon: 'pageview' },
        ],
        routeSnapshot,
        routerState,
      );

      expect(links.length).toBe(2);
      expect(links[0].label).toBe('First page');
      expect(links[0].icon).toBe('home');
      expect(links[0].routerLink).toBe('');
      expect(links[0].children).toEqual([]);
    });

    it('should correctly return link when canActivate returns true', async () => {
      const canActivate = vitest.fn().mockReturnValue(Promise.resolve(true));
      const links = await service.getActiveRouteLinks(
        [
          {
            title: 'Admin page',
            path: 'admin',
            icon: 'admin_panel_settings',
            canActivate: [canActivate],
          },
        ],
        routeSnapshot,
        routerState,
      );

      expect(links.length).toBe(1);
    });

    it('should hide links if the user can not activate them', async () => {
      const canActivate = vitest.fn().mockReturnValue(Promise.resolve(false));
      const links = await service.getActiveRouteLinks(
        [
          {
            title: 'Admin page',
            path: 'admin',
            icon: 'admin_panel_settings',
            canActivate: [canActivate],
          },
        ],
        routeSnapshot,
        routerState,
      );

      expect(links.length).toBe(0);
    });
  });
});
