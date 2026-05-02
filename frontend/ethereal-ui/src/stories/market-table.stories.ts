import type { Meta, StoryObj } from '@storybook/angular';

import { MarketTableComponent } from '../public-api';
import {
  AdminEditableCellStoryHostComponent,
  columns,
  FilterPanelStoryHostComponent,
  ItemStatCardStoryHostComponent,
  ItemTooltipCardStoryHostComponent,
  rows,
  SimpleChartPanelStoryHostComponent,
} from './story-hosts';

const meta: Meta<MarketTableComponent> = {
  title: 'Ethereal UI/Market/Table',
  component: MarketTableComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default: StoryObj<MarketTableComponent> = {
  args: {
    columns,
    rows,
    summary: 'Showing 1-2 of 1,248 items',
  },
};

export const Empty: StoryObj<MarketTableComponent> = {
  args: {
    columns,
    rows: [],
    summary: 'Showing 0 of 0 items',
  },
};

export const FilterPanel: StoryObj<FilterPanelStoryHostComponent> = {
  component: FilterPanelStoryHostComponent,
};

export const ItemStatCard: StoryObj<ItemStatCardStoryHostComponent> = {
  component: ItemStatCardStoryHostComponent,
};

export const ItemTooltipCard: StoryObj<ItemTooltipCardStoryHostComponent> = {
  component: ItemTooltipCardStoryHostComponent,
};

export const SimpleChartPanel: StoryObj<SimpleChartPanelStoryHostComponent> = {
  component: SimpleChartPanelStoryHostComponent,
};

export const AdminEditableCell: StoryObj<AdminEditableCellStoryHostComponent> = {
  component: AdminEditableCellStoryHostComponent,
};
