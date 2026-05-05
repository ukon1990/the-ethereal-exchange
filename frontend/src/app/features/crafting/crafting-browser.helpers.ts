import { ActivatedRoute } from '@angular/router';

const RECIPE_MIN = 900;
const PROF_MIN = 1040;
const TREND_MIN = 1200;

export function activeColumnIdsForViewport(width: number): Set<string> {
  const active = new Set<string>(['itemName', 'outputPrice', 'profit']);
  if (width >= RECIPE_MIN) active.add('recipeName');
  if (width >= PROF_MIN) active.add('professionName');
  active.add('reagentCost');
  if (width >= TREND_MIN) {
    active.add('roiPercent');
    active.add('outputPriceChangePercent');
  }
  return active;
}

export function realmAncestorRoute(route: ActivatedRoute): ActivatedRoute {
  let r: ActivatedRoute | null = route;
  while (r) {
    const m = r.snapshot.paramMap;
    if (m.has('region') && m.has('realm')) {
      return r;
    }
    r = r.parent;
  }
  return route;
}
