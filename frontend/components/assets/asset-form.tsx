'use client';

import { useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type AssetRecord } from '../../types/asset';
import {
  assetFormSchema,
  type AssetFormValues,
  assetStatusEnum,
  assetTypeEnum
} from './asset-schema';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { upsertAssetAction } from '../../app/(protected)/assets/actions';
import { useRouter } from 'next/navigation';

interface AssetFormProps {
  defaultValues?: AssetRecord;
  departments: { id: string; name: string }[];
  employees: { user_id: string; full_name: string }[];
  onSuccess?: () => void;
}

function mapAssetToFormValues(asset?: AssetRecord): AssetFormValues {
  if (!asset) {
    return {
      asset_code: '',
      asset_type: 'laptop',
      brand_model: '',
      purchased_at: '',
      purchase_price: null,
      market_price: null,
      assigned_to: null,
      department_id: null,
      status: 'pending_assignment',
      is_buyback_allowed: false,
      buyback_available_at: '',
      notes: null
    };
  }

  return {
    id: asset.id,
    asset_code: asset.asset_code,
    asset_type: asset.asset_type,
    brand_model: asset.brand_model,
    purchased_at: asset.purchased_at ? asset.purchased_at.slice(0, 10) : '',
    purchase_price: asset.purchase_price,
    market_price: asset.market_price,
    assigned_to: asset.assigned_to,
    department_id: asset.department_id,
    status: asset.status,
    is_buyback_allowed: asset.is_buyback_allowed,
    buyback_available_at: asset.buyback_available_at ? asset.buyback_available_at.slice(0, 10) : '',
    notes: asset.notes
  };
}

export default function AssetForm({
  defaultValues,
  departments,
  employees,
  onSuccess
}: AssetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: mapAssetToFormValues(defaultValues)
  });

  useEffect(() => {
    form.reset(mapAssetToFormValues(defaultValues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues?.id]);

  const onSubmit = (values: AssetFormValues) => {
    startTransition(async () => {
      try {
        await upsertAssetAction({
          ...values,
          purchased_at: values.purchased_at ?? '',
          buyback_available_at: values.buyback_available_at ?? '',
          department_id: values.department_id ?? null
        });
        form.reset(mapAssetToFormValues());
        onSuccess?.();
        router.refresh();
      } catch (error) {
        form.setError('asset_code', {
          type: 'server',
          message: error instanceof Error ? error.message : '保存失败'
        });
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="asset_code">设备 ID</Label>
          <Input id="asset_code" {...form.register('asset_code')} placeholder="DEV-2024-0001" />
          <p className="text-xs text-muted-foreground">
            PRD 要求唯一设备编号，建议 DEV-年-序号。
          </p>
          {form.formState.errors.asset_code ? (
            <p className="text-sm text-destructive">{form.formState.errors.asset_code.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="asset_type">设备类型</Label>
            <select
              id="asset_type"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              {...form.register('asset_type')}
            >
              {assetTypeEnum.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <select
              id="status"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              {...form.register('status')}
            >
              {assetStatusEnum.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_model">品牌型号</Label>
          <Input id="brand_model" {...form.register('brand_model')} placeholder="MacBook Pro 14 M3" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purchased_at">采购时间</Label>
            <Input id="purchased_at" type="date" {...form.register('purchased_at')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyback_available_at">可回购时间</Label>
            <Input id="buyback_available_at" type="date" {...form.register('buyback_available_at')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="purchase_price">采购价格</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="market_price"
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="market_price">市场价格</Label>
                <Input
                  id="market_price"
                  type="number"
                  step="0.01"
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department_id">所属部门</Label>
            <select
              id="department_id"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={form.watch('department_id') ?? ''}
              onChange={(event) =>
                form.setValue('department_id', event.target.value ? event.target.value : null)
              }
            >
              <option value="">未分配</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">使用者</Label>
            <select
              id="assigned_to"
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={form.watch('assigned_to') ?? ''}
              onChange={(event) =>
                form.setValue('assigned_to', event.target.value ? event.target.value : null)
              }
            >
              <option value="">未分配</option>
              {employees.map((employee) => (
                <option key={employee.user_id} value={employee.user_id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_buyback_allowed"
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={form.watch('is_buyback_allowed')}
            onChange={(event) => form.setValue('is_buyback_allowed', event.target.checked)}
          />
          <Label htmlFor="is_buyback_allowed">允许回购</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">备注</Label>
          <Textarea
            id="notes"
            rows={3}
            value={form.watch('notes') ?? ''}
            onChange={(event) => form.setValue('notes', event.target.value || null)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中…' : '保存'}
        </Button>
      </div>
    </form>
  );
}
