import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { MarketItemRow, TableComponent } from '../../../public-api';
import { createMarketStoryTableColumns, rows } from '../../support/story-hosts';

const STORY_MIN = 'min-w-[56rem]';
const STORY_HEADER =
  'grid grid-cols-[minmax(14rem,3fr)_7rem_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_6rem] gap-4 border-b border-white/10 bg-surface-container-high px-6 py-4 ee-label text-outline';
const STORY_ROW =
  'grid w-full grid-cols-[minmax(14rem,3fr)_7rem_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_minmax(7rem,1.5fr)_6rem] items-center gap-4 px-6 py-3 text-left transition hover:bg-white/5';

@Component({
  imports: [TableComponent],
  template: `
    <div class="bg-background p-4">
      <ee-table
        [data]="data()"
        [columns]="cols"
        [getRowId]="getRowId"
        sectionAriaLabel="Sample table"
        emptyMessage="No rows to display."
        [contentMinWidthClass]="minW"
        [headerRowClass]="headerRow"
        [bodyRowClassFn]="rowClass"
        [showFooter]="true"
        [footerSummary]="summary()"
        [showPagination]="true"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableStoryHostComponent {
  readonly data = input<readonly MarketItemRow[]>(rows);
  readonly summary = input<string>('Showing 1-2 of 1,248 items');
  readonly cols = createMarketStoryTableColumns();
  readonly minW = STORY_MIN;
  readonly headerRow = STORY_HEADER;
  readonly rowClass = () => STORY_ROW;
  readonly getRowId = (row: MarketItemRow) => row.id;
}

const meta: Meta<TableStoryHostComponent> = {
  title: 'Ethereal UI/Table',
  component: TableStoryHostComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default: StoryObj<TableStoryHostComponent> = {};

export const Empty: StoryObj<TableStoryHostComponent> = {
  args: {
    data: [],
    summary: 'Showing 0 of 0 items',
  },
};
