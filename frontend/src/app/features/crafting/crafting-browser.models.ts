import type { FilterSection, ItemQuality, MarketListingKey } from '@ui';

export type CraftingSortBy =
  | 'itemName'
  | 'recipeName'
  | 'professionName'
  | 'reagentCost'
  | 'outputPrice'
  | 'profit'
  | 'roiPercent'
  | 'outputPriceChangePercent'
  | 'profitChangePercent'
  | 'listingQuantity';

export interface CraftingBrowserQueryState {
  readonly query: string;
  readonly professionIds: readonly number[];
  readonly minProfit: number | null;
  readonly maxProfit: number | null;
  readonly minRoiPercent: number | null;
  readonly maxRoiPercent: number | null;
  readonly minReagentCost: number | null;
  readonly maxReagentCost: number | null;
  readonly minOutputPrice: number | null;
  readonly maxOutputPrice: number | null;
  readonly minOutputPriceChangePercent: number | null;
  readonly maxOutputPriceChangePercent: number | null;
  readonly requireCompleteReagentPricing: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy: CraftingSortBy;
  readonly sortDirection: 'asc' | 'desc';
}

export interface CraftingTableRow {
  readonly rowId: string;
  readonly recipeId: number;
  readonly craftedItemId: number;
  readonly craftedItemName: string;
  readonly recipeName: string;
  readonly professionName: string;
  readonly variantSummary: string;
  readonly listingKey: MarketListingKey;
  readonly quality: ItemQuality;
  readonly iconUrl?: string;
  readonly outputPriceCopper: number | null;
  readonly reagentCostCopper: number | null;
  readonly profitCopper: number | null;
  readonly roiPercent: number | null;
  readonly outputPriceChangePercent: number | null;
  readonly listingQuantity: number | null;
  readonly minBuyoutCopper: number | null;
}

export interface CraftingBrowserViewModel {
  readonly filterSections: readonly FilterSection[];
  readonly rows: readonly CraftingTableRow[];
  readonly paginationSummary: string;
  readonly searchQuery: string;
  readonly page: number;
  readonly totalPages: number;
  readonly pageSize: number;
  readonly sortBy: CraftingSortBy;
  readonly sortDirection: 'asc' | 'desc';
  readonly loading: boolean;
}
