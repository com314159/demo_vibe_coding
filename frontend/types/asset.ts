export const ASSET_STATUS_LIST = [
  'in_service',
  'under_repair',
  'buyback_completed',
  'disposed',
  'pending_assignment'
] as const;
export type AssetStatus = (typeof ASSET_STATUS_LIST)[number];

export const ASSET_TYPE_LIST = ['laptop', 'desktop', 'monitor', 'phone', 'tablet'] as const;
export type AssetType = (typeof ASSET_TYPE_LIST)[number];

export interface AssetRecord {
  id: string;
  asset_code: string;
  asset_type: AssetType;
  brand_model: string;
  purchased_at: string | null;
  purchase_price: number | null;
  market_price: number | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  department_name: string | null;
  department_id: string | null;
  status: AssetStatus;
  is_buyback_allowed: boolean;
  buyback_available_at: string | null;
  last_repair_at: string | null;
  repair_count: number;
  notes: string | null;
}

export interface AssetQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AssetStatus | 'all';
  type?: AssetType | 'all';
}

export interface PaginatedAssets {
  data: AssetRecord[];
  total: number;
  page: number;
  pageSize: number;
}
