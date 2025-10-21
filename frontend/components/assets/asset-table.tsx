'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { type AssetRecord } from '../../types/asset';
import { DataTable } from '../data-table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import AssetForm from './asset-form';
import { assetStatusEnum, assetTypeEnum } from './asset-schema';
import { cn } from '../../lib/utils';

interface AssetTableProps {
  assets: {
    data: AssetRecord[];
    total: number;
    page: number;
    pageSize: number;
  };
  departments: { id: string; name: string }[];
  employees: { user_id: string; full_name: string }[];
  query: {
    page: number;
    search: string;
    status: string;
    type: string;
    sortField: string;
    sortOrder: 'asc' | 'desc';
  };
}

function buildQueryString(base: URLSearchParams, updates: Record<string, string | number | undefined>) {
  const params = new URLSearchParams(base);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export default function AssetTable({ assets, departments, employees, query }: AssetTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(query.search);
  const [statusValue, setStatusValue] = useState(query.status);
  const [typeValue, setTypeValue] = useState(query.type);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<AssetRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'asset_code',
        header: '设备 ID'
      },
      {
        accessorKey: 'asset_type',
        header: '类型'
      },
      {
        accessorKey: 'brand_model',
        header: '品牌型号'
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              row.original.status === 'under_repair'
                ? 'bg-yellow-100 text-yellow-800'
                : row.original.status === 'disposed'
                ? 'bg-gray-200 text-gray-700'
                : row.original.status === 'buyback_completed'
                ? 'bg-emerald-100 text-emerald-700'
                : row.original.status === 'pending_assignment'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-emerald-50 text-emerald-700'
            )}
          >
            {row.original.status}
          </span>
        )
      },
      {
        accessorKey: 'assigned_to_name',
        header: '使用者',
        cell: ({ row }) => row.original.assigned_to_name ?? '未分配'
      },
      {
        accessorKey: 'department_name',
        header: '所属部门',
        cell: ({ row }) => row.original.department_name ?? '未绑定'
      },
      {
        accessorKey: 'purchase_price',
        header: '采购价',
        cell: ({ row }) => (row.original.purchase_price ? `¥${row.original.purchase_price.toFixed(2)}` : '—')
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAsset(row.original);
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
        )
      }
    ],
    []
  );

  const onPageChange = (page: number) => {
    startTransition(() => {
      const params = buildQueryString(new URLSearchParams(window.location.search), {
        page
      });
      router.replace(`${pathname}?${params}`);
    });
  };

  const onSortChange = (sorting: SortingState) => {
    const next = sorting[0];
    if (!next) {
      return;
    }
    startTransition(() => {
      const params = buildQueryString(new URLSearchParams(window.location.search), {
        sortField: next.id,
        sortOrder: next.desc ? 'desc' : 'asc'
      });
      router.replace(`${pathname}?${params}`);
    });
  };

  const initialSorting = useMemo<SortingState>(
    () =>
      query.sortField
        ? [
            {
              id: query.sortField,
              desc: query.sortOrder === 'desc'
            }
          ]
        : [],
    [query.sortField, query.sortOrder]
  );

  const handleFilterSubmit = () => {
    startTransition(() => {
      const params = buildQueryString(new URLSearchParams(), {
        search: searchValue,
        status: statusValue === 'all' ? undefined : statusValue,
        type: typeValue === 'all' ? undefined : typeValue,
        page: 1
      });
      router.replace(`${pathname}?${params}`);
    });
  };

  useEffect(() => {
    if (!drawerOpen) {
      setSelectedAsset(undefined);
    }
  }, [drawerOpen]);

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-md border bg-background p-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">关键字搜索</span>
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="输入设备 ID / 型号"
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">状态</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value)}
            >
              <option value="all">全部</option>
              {assetStatusEnum.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">设备类型</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={typeValue}
              onChange={(event) => setTypeValue(event.target.value)}
            >
              <option value="all">全部</option>
              {assetTypeEnum.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={handleFilterSubmit} disabled={isPending}>
            {isPending ? '筛选中…' : '应用筛选'}
          </Button>
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              type="button"
              onClick={() => {
                setSelectedAsset(undefined);
                setDrawerOpen(true);
              }}
            >
              新建设备
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{selectedAsset ? `编辑：${selectedAsset.asset_code}` : '新建设备'}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-6">
              <AssetForm
                defaultValues={selectedAsset}
                departments={departments}
                employees={employees}
                onSuccess={handleDrawerClose}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <DataTable
        columns={columns}
        data={assets.data}
        page={assets.page}
        pageSize={assets.pageSize}
        total={assets.total}
        onPageChange={onPageChange}
        onSortChange={onSortChange}
        initialSorting={initialSorting}
      />

      <p className="text-xs text-muted-foreground">
        TODO: 增加导出、批量操作、列自定义等高级功能。
      </p>
    </div>
  );
}
