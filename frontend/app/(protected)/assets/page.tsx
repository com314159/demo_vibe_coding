import AssetTable from '../../../components/assets/asset-table';
import { assetStatusEnum, assetTypeEnum } from '../../../components/assets/asset-schema';
import { getServerClient } from '../../../lib/supabaseServer';
import { type AssetRecord, type PaginatedAssets } from '../../../types/asset';

interface AssetsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

const PAGE_SIZE = 10;

function parseSearchParams(searchParams: AssetsPageProps['searchParams']) {
  const page = Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) || 1;
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search ?? '';
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status ?? 'all';
  const type = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type ?? 'all';
  const sortFieldRaw = Array.isArray(searchParams.sortField)
    ? searchParams.sortField[0]
    : searchParams.sortField ?? 'asset_code';
  const sortOrder = Array.isArray(searchParams.sortOrder) ? searchParams.sortOrder[0] : searchParams.sortOrder ?? 'asc';

  return {
    page: page < 1 ? 1 : page,
    search,
    status,
    type,
    sortField: sortFieldRaw,
    sortOrder: sortOrder === 'desc' ? 'desc' : 'asc'
  };
}

const allowedSortFields = ['asset_code', 'asset_type', 'status', 'purchase_price', 'brand_model'] as const;

async function fetchAssets({
  page,
  search,
  status,
  type,
  sortField,
  sortOrder
}: ReturnType<typeof parseSearchParams>): Promise<PaginatedAssets> {
  const supabase = getServerClient();
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;
  const normalizedSortField = allowedSortFields.includes(sortField as any)
    ? sortField
    : 'asset_code';

  let query = supabase
    .from('assets')
    .select(
      `
      id,
      asset_code,
      asset_type,
      brand_model,
      purchased_at,
      purchase_price,
      market_price,
      assigned_to,
      department_id,
      status,
      is_buyback_allowed,
      buyback_available_at,
      last_repair_at,
      repair_count,
      notes,
      department:departments!assets_department_id_fkey(id, name),
      assignee:users_profile!assets_assigned_to_fkey(user_id, full_name)
    `,
      { count: 'exact' }
    )
    .range(rangeFrom, rangeTo)
    .order(normalizedSortField, { ascending: sortOrder === 'asc' });

  if (search) {
    query = query.ilike('asset_code', `%${search}%`);
  }

  if (status && status !== 'all' && assetStatusEnum.includes(status as any)) {
    query = query.eq('status', status);
  }

  if (type && type !== 'all' && assetTypeEnum.includes(type as any)) {
    query = query.eq('asset_type', type);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const assets: AssetRecord[] =
    data?.map((row) => ({
      id: row.id,
      asset_code: row.asset_code,
      asset_type: row.asset_type,
      brand_model: row.brand_model,
      purchased_at: row.purchased_at,
      purchase_price: row.purchase_price,
      market_price: row.market_price,
      assigned_to: row.assigned_to,
      assigned_to_name: row.assignee?.full_name ?? null,
      department_id: row.department_id ?? row.department?.id ?? null,
      department_name: row.department?.name ?? null,
      status: row.status,
      is_buyback_allowed: row.is_buyback_allowed,
      buyback_available_at: row.buyback_available_at,
      last_repair_at: row.last_repair_at,
      repair_count: row.repair_count,
      notes: row.notes
    })) ?? [];

  return {
    data: assets,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE
  };
}

async function fetchMeta() {
  const supabase = getServerClient();
  const [{ data: departments }, { data: users }] = await Promise.all([
    supabase.from('departments').select('id, name').order('name', { ascending: true }),
    supabase.from('users_profile').select('user_id, full_name, role').order('full_name', { ascending: true })
  ]);

  return {
    departments: departments ?? [],
    employees: users?.filter((user) => user.role === 'employee') ?? []
  };
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const params = parseSearchParams(searchParams);
  const [assets, meta] = await Promise.all([fetchAssets(params), fetchMeta()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">设备清单</h1>
        <p className="text-sm text-muted-foreground">支持服务器端分页、筛选、排序，遵循 PRD 表结构。</p>
      </div>
      <AssetTable
        assets={assets}
        departments={meta.departments}
        employees={meta.employees}
        query={params}
      />
    </div>
  );
}
