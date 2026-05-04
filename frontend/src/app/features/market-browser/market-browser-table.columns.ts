import type { ColumnDef } from '@tanstack/angular-table';
import { flexRenderComponent } from '@tanstack/angular-table';

import { MarketItemRow } from '@ui';

import { MarketItemCellComponent } from './market-item-cell.component';
import { MarketMetricCellComponent } from './market-metric-cell.component';
import { MarketQualityCellComponent } from './market-quality-cell.component';

const GRID_HEADER =
  'grid grid-cols-[minmax(14rem,3fr)_7rem_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_6rem] gap-4 border-b border-white/10 bg-surface-container-high px-6 py-4 ee-label text-outline';

const GRID_ROW =
  'grid w-full grid-cols-[minmax(14rem,3fr)_7rem_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_6rem] items-center gap-4 px-6 py-3 text-left transition hover:bg-white/5';

const SELECTED_ROW =
  'border-l-2 border-primary bg-primary/10 shadow-[inset_0_0_20px_rgba(236,185,19,0.05)]';

export function marketBrowserHeaderRowClass(): string {
  return GRID_HEADER;
}

export function marketBrowserContentMinWidthClass(): string {
  return 'min-w-[56rem]';
}

export function marketBrowserRowClass(row: MarketItemRow): string {
  return row.selected ? `${GRID_ROW} ${SELECTED_ROW}` : GRID_ROW;
}

export function createMarketBrowserTableColumns(): ColumnDef<MarketItemRow, unknown>[] {
  return [
    {
      id: 'item',
      accessorKey: 'name',
      header: 'Item',
      meta: { align: 'left' },
      cell: () => flexRenderComponent(MarketItemCellComponent),
    },
    {
      id: 'quality',
      accessorKey: 'quality',
      header: 'Quality',
      meta: { align: 'left' },
      cell: () => flexRenderComponent(MarketQualityCellComponent),
    },
    {
      id: 'selected-price',
      accessorKey: 'minBuyout',
      header: 'Realm Price',
      meta: { align: 'right' },
      cell: () => flexRenderComponent(MarketMetricCellComponent),
    },
    {
      id: 'selected-quantity',
      accessorKey: 'selectedQuantity',
      header: 'Realm Qty',
      meta: { align: 'right' },
      cell: () => flexRenderComponent(MarketMetricCellComponent),
    },
    {
      id: 'community-price',
      accessorKey: 'regionalAverage',
      header: 'Region Price',
      meta: { align: 'right' },
      cell: () => flexRenderComponent(MarketMetricCellComponent),
    },
    {
      id: 'community-quantity',
      accessorKey: 'communityQuantity',
      header: 'Region Qty',
      meta: { align: 'right' },
      cell: () => flexRenderComponent(MarketMetricCellComponent),
    },
  ];
}
