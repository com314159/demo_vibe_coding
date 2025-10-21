import { z } from 'zod';
import {
  type AssetStatus,
  type AssetType,
  ASSET_STATUS_LIST,
  ASSET_TYPE_LIST
} from '../../types/asset';

export const assetStatusEnum = ASSET_STATUS_LIST;

export const assetTypeEnum = ASSET_TYPE_LIST;

export const assetFormSchema = z.object({
  id: z.string().uuid().optional(),
  asset_code: z
    .string()
    .min(1, '设备 ID 必填')
    .regex(/^DEV-[0-9]{4}-[0-9A-Za-z]{4}$/i, '建议使用 DEV-YYYY-XXXX 结构'),
  asset_type: z.enum(assetTypeEnum, {
    errorMap: () => ({ message: '设备类型不在枚举范围内' })
  }),
  brand_model: z.string().min(1, '品牌型号必填'),
  purchased_at: z
    .string()
    .min(1, '采购时间必填')
    .or(z.literal(''))
    .optional(),
  purchase_price: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null))
    .refine((val) => val === null || val >= 0, '采购价格需大于等于 0'),
  market_price: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null))
    .refine((val) => val === null || val >= 0, '市场价格需大于等于 0'),
  assigned_to: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid({ message: '所属部门需选择' }).nullable().optional(),
  status: z.enum(assetStatusEnum, {
    errorMap: () => ({ message: '设备状态不在枚举范围内' })
  }),
  is_buyback_allowed: z.coerce.boolean(),
  buyback_available_at: z
    .string()
    .optional()
    .or(z.literal('')),
  notes: z.string().max(255, '备注不能超过 255 字').nullable().optional()
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;
