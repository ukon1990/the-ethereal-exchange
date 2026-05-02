import type { Meta, StoryObj } from '@storybook/angular';

import {
  CurrencyAmountStoryHostComponent,
  GlassPanelStoryHostComponent,
  IconButtonStoryHostComponent,
  PillToggleStoryHostComponent,
  PrimitiveControlsStoryHostComponent,
  QualityBadgeStoryHostComponent,
  SearchInputStoryHostComponent,
  SymbolIconGridStoryHostComponent,
} from './story-hosts';

const meta: Meta = {
  title: 'Ethereal UI/Primitives',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

export const CurrencyAmount: StoryObj<CurrencyAmountStoryHostComponent> = {
  component: CurrencyAmountStoryHostComponent,
};

export const GlassPanel: StoryObj<GlassPanelStoryHostComponent> = {
  component: GlassPanelStoryHostComponent,
};

export const IconButton: StoryObj<IconButtonStoryHostComponent> = {
  component: IconButtonStoryHostComponent,
};

export const SymbolIconGrid: StoryObj<SymbolIconGridStoryHostComponent> = {
  component: SymbolIconGridStoryHostComponent,
};

export const PrimitiveControls: StoryObj<PrimitiveControlsStoryHostComponent> = {
  component: PrimitiveControlsStoryHostComponent,
};

export const QualityBadge: StoryObj<QualityBadgeStoryHostComponent> = {
  component: QualityBadgeStoryHostComponent,
};

export const SearchInput: StoryObj<SearchInputStoryHostComponent> = {
  component: SearchInputStoryHostComponent,
};

export const PillToggle: StoryObj<PillToggleStoryHostComponent> = {
  component: PillToggleStoryHostComponent,
};
