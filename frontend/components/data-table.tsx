'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (state: SortingState) => void;
  initialSorting?: SortingState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pageSize,
  total,
  onPageChange,
  onSortChange,
  initialSorting = []
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      onSortChange?.(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true
  });

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-left font-medium',
                        canSort ? 'cursor-pointer select-none' : ''
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          第 {page} / {Math.max(pageCount, 1)} 页（共 {total} 条）
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border px-3 py-1 disabled:opacity-50"
            onClick={() => onPageChange?.(Math.max(page - 1, 1))}
            disabled={page <= 1}
          >
            上一页
          </button>
          <button
            className="rounded-md border px-3 py-1 disabled:opacity-50"
            onClick={() => onPageChange?.(Math.min(page + 1, pageCount))}
            disabled={page >= pageCount}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
