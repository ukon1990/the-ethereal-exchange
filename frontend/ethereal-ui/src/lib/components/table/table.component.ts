import { ScrollingModule } from '@angular/cdk/scrolling';
import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  ColumnDef,
  createAngularTable,
  FlexRenderDirective,
  getCoreRowModel,
  type RowData,
} from '@tanstack/angular-table';
import type { Table } from '@tanstack/table-core';

import { SymbolIconComponent } from '../primitives/symbol-icon.component';

@Component({
  selector: 'ee-table',
  host: {
    class: 'flex min-h-0 min-w-0 flex-1',
  },
  imports: [FlexRenderDirective, ScrollingModule, SymbolIconComponent],
  template: `
    <section
      class="ee-glass flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg"
      [attr.aria-label]="sectionAriaLabel()"
    >
      <div class="min-h-0 flex-1 overflow-x-auto">
        <div class="flex h-full min-w-0 flex-col" [class]="contentMinWidthClass()">
          @for (headerGroup of table.getHeaderGroups(); track headerGroup.id) {
            <div [class]="headerRowClass()" role="row">
              @for (header of headerGroup.headers; track header.id) {
                <div role="columnheader" [class]="headerColumnClass(header.column.columnDef.meta)">
                  @if (!header.isPlaceholder) {
                    <ng-container
                      *flexRender="
                        header.column.columnDef.header;
                        props: header.getContext();
                        let rendered
                      "
                    >
                      {{ rendered }}
                    </ng-container>
                  }
                </div>
              }
            </div>
          }
          <div cdkScrollable class="min-h-0 flex-1 overflow-y-auto divide-y divide-white/5">
            @for (row of table.getRowModel().rows; track row.id) {
              @if (clickableRows()) {
                <button
                  type="button"
                  [class]="bodyRowClassFn()(row.original)"
                  (click)="rowClick.emit(row.original)"
                >
                  @for (cell of row.getVisibleCells(); track cell.id) {
                    <div [class]="bodyCellClass(cell.column.columnDef.meta)">
                      <ng-container
                        *flexRender="
                          cell.column.columnDef.cell;
                          props: cell.getContext();
                          let rendered
                        "
                      >
                        {{ rendered }}
                      </ng-container>
                    </div>
                  }
                </button>
              } @else {
                <div [class]="bodyRowClassFn()(row.original)" role="row">
                  @for (cell of row.getVisibleCells(); track cell.id) {
                    <div [class]="bodyCellClass(cell.column.columnDef.meta)">
                      <ng-container
                        *flexRender="
                          cell.column.columnDef.cell;
                          props: cell.getContext();
                          let rendered
                        "
                      >
                        {{ rendered }}
                      </ng-container>
                    </div>
                  }
                </div>
              }
            } @empty {
              <div class="p-8 text-center text-on-surface-variant">{{ emptyMessage() }}</div>
            }
          </div>
        </div>
      </div>
      @if (showFooter()) {
        <footer
          class="flex items-center justify-between border-t border-white/10 bg-surface-container-high p-4 ee-data text-outline"
        >
          <span>{{ footerSummary() }}</span>
          @if (showPagination()) {
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded p-1 transition hover:text-primary"
                [attr.aria-label]="previousPageAriaLabel()"
                (click)="previousPage.emit()"
              >
                <ee-symbol-icon name="chevron_left" />
              </button>
              <button
                type="button"
                class="rounded p-1 transition hover:text-primary"
                [attr.aria-label]="nextPageAriaLabel()"
                (click)="nextPage.emit()"
              >
                <ee-symbol-icon name="chevron_right" />
              </button>
            </div>
          }
        </footer>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<TData extends RowData> {
  /** Defaults avoid NG0950 during SSR when TanStack reads inputs before parent bindings run. */
  readonly data = input<readonly TData[]>([]);
  readonly columns = input<ColumnDef<TData, unknown>[]>([]);

  readonly sectionAriaLabel = input<string>('Data table');
  readonly emptyMessage = input<string>('No rows to display.');
  readonly contentMinWidthClass = input.required<string>();
  readonly headerRowClass = input.required<string>();
  readonly bodyRowClassFn = input.required<(row: TData) => string>();
  readonly showFooter = input(false, { transform: booleanAttribute });
  readonly footerSummary = input<string>('');
  readonly showPagination = input(false, { transform: booleanAttribute });
  readonly previousPageAriaLabel = input<string>('Previous page');
  readonly nextPageAriaLabel = input<string>('Next page');
  readonly clickableRows = input(true, { transform: booleanAttribute });
  readonly getRowId = input<(row: TData, index: number) => string>();

  readonly rowClick = output<TData>();
  readonly previousPage = output<void>();
  readonly nextPage = output<void>();

  /**
   * Cast for ng-packagr `.d.ts` emit: the real value is a TanStack `Table` plus an Angular `Signal` proxy.
   */
  protected readonly table = createAngularTable<TData>(() => ({
    data: [...this.data()],
    columns: [...this.columns()],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (originalRow, index) => {
      const fn = this.getRowId();
      return fn ? fn(originalRow as TData, index) : String(index);
    },
  })) as unknown as Table<TData>;

  protected headerColumnClass(meta: unknown): string {
    const m = meta as { align?: 'left' | 'right' } | undefined;
    return m?.align === 'right' ? 'text-right' : 'text-left';
  }

  protected bodyCellClass(meta: unknown): string {
    const m = meta as { align?: 'left' | 'right' } | undefined;
    return m?.align === 'right' ? 'justify-self-end text-right' : 'text-left';
  }
}
