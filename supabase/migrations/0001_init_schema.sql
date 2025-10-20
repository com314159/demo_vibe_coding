-- Enable required extensions
create extension if not exists "pgcrypto";

-- Departments master data
create table if not exists public.departments (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint uq_departments_name unique (name)
);

-- User profile table aligned with Supabase auth
create table if not exists public.users_profile (
    user_id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null,
    department_id uuid references public.departments (id),
    job_title text,
    role text not null,
    email text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    last_login_at timestamptz,
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint chk_users_role check (role in ('employee', 'admin')),
    constraint uq_users_profile_email unique (email)
);

-- IT assets ledger
create table if not exists public.assets (
    id uuid primary key default gen_random_uuid(),
    asset_code text not null,
    asset_type text not null,
    brand_model text not null,
    purchased_at timestamptz,
    purchase_price numeric(12,2),
    market_price numeric(12,2),
    assigned_to uuid references public.users_profile (user_id),
    department_id uuid references public.departments (id),
    status text not null,
    is_buyback_allowed boolean not null default false,
    buyback_available_at timestamptz,
    last_repair_at timestamptz,
    repair_count integer not null default 0,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint chk_assets_asset_type check (asset_type in ('laptop', 'desktop', 'monitor', 'phone', 'tablet')),
    constraint chk_assets_status check (status in ('in_service', 'under_repair', 'buyback_completed', 'disposed', 'pending_assignment')),
    constraint chk_assets_repair_count_non_negative check (repair_count >= 0),
    constraint uq_assets_asset_code unique (asset_code)
);

-- Purchase orders
create table if not exists public.purchase_orders (
    id uuid primary key default gen_random_uuid(),
    order_code text not null,
    order_type text not null,
    applicant_id uuid references public.users_profile (user_id),
    department_id uuid references public.departments (id),
    device_category text not null,
    quantity integer not null,
    unit_budget numeric(12,2),
    total_budget numeric(12,2) generated always as (quantity * coalesce(unit_budget, 0::numeric)) stored,
    status text not null,
    actual_amount numeric(12,2),
    expected_arrival_at timestamptz,
    vendor text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint chk_purchase_orders_type check (order_type in ('new_purchase', 'replacement', 'buyback_replenishment')),
    constraint chk_purchase_orders_status check (status in ('pending', 'purchasing', 'delivered', 'assigned')),
    constraint chk_purchase_orders_quantity_positive check (quantity > 0),
    constraint chk_purchase_orders_unit_budget_positive check (unit_budget is null or unit_budget >= 0),
    constraint chk_purchase_orders_actual_amount_positive check (actual_amount is null or actual_amount >= 0),
    constraint chk_purchase_orders_device_category check (device_category in ('laptop', 'monitor', 'phone')),
    constraint uq_purchase_orders_order_code unique (order_code)
);

-- Repair tickets
create table if not exists public.repairs (
    id uuid primary key default gen_random_uuid(),
    repair_code text not null,
    asset_id uuid not null references public.assets (id),
    reported_by uuid references public.users_profile (user_id),
    issue_description text not null,
    status text not null,
    is_first_repair boolean not null default false,
    repair_cost numeric(12,2),
    company_coverage_percent numeric(5,2),
    completed_at timestamptz,
    approved_by uuid references public.users_profile (user_id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint chk_repairs_status check (status in ('submitted', 'in_progress', 'ready_for_pickup', 'picked_up')),
    constraint chk_repairs_cost_non_negative check (repair_cost is null or repair_cost >= 0),
    constraint chk_repairs_company_coverage_percent check (company_coverage_percent is null or (company_coverage_percent >= 0 and company_coverage_percent <= 100)),
    constraint uq_repairs_repair_code unique (repair_code)
);

-- Buyback records
create table if not exists public.buybacks (
    id uuid primary key default gen_random_uuid(),
    buyback_code text not null,
    asset_id uuid not null references public.assets (id),
    buyback_type text not null,
    employee_payment numeric(12,2) not null default 100,
    approval_status text not null,
    finance_confirmed_at timestamptz,
    new_purchase_order_id uuid references public.purchase_orders (id),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint chk_buybacks_type check (buyback_type in ('laptop', 'desktop')),
    constraint chk_buybacks_approval_status check (approval_status in ('pending', 'approved', 'rejected')),
    constraint chk_buybacks_employee_payment check (employee_payment = 100),
    constraint uq_buybacks_buyback_code unique (buyback_code)
);

-- Annual verifications
create table if not exists public.verifications (
    id uuid primary key default gen_random_uuid(),
    verification_code text not null,
    asset_id uuid not null references public.assets (id),
    employee_id uuid references public.users_profile (user_id),
    status text not null,
    initiated_by uuid references public.users_profile (user_id),
    initiated_at timestamptz not null default now(),
    confirmed_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint chk_verifications_status check (status in ('confirmed', 'unconfirmed')),
    constraint uq_verifications_code unique (verification_code)
);

-- Audit log table
create table if not exists public.audit_logs (
    id bigserial primary key,
    table_name text not null,
    record_id uuid,
    operation text not null,
    performed_by uuid references public.users_profile (user_id),
    old_data jsonb,
    new_data jsonb,
    occurred_at timestamptz not null default now(),
    constraint chk_audit_logs_operation check (operation in ('INSERT', 'UPDATE', 'DELETE'))
);

create index if not exists idx_audit_logs_table_name on public.audit_logs (table_name);
create index if not exists idx_audit_logs_occurred_at on public.audit_logs (occurred_at);

-- Audit trigger function
create or replace function public.fn_write_audit_log()
returns trigger
language plpgsql
as $$
declare
    v_actor uuid;
begin
    v_actor := auth.uid();

    if tg_op = 'INSERT' then
        insert into public.audit_logs (table_name, record_id, operation, performed_by, old_data, new_data)
        values (tg_table_name, new.id, 'INSERT', v_actor, null, to_jsonb(new));
        return new;
    elsif tg_op = 'UPDATE' then
        insert into public.audit_logs (table_name, record_id, operation, performed_by, old_data, new_data)
        values (tg_table_name, new.id, 'UPDATE', v_actor, to_jsonb(old), to_jsonb(new));
        return new;
    elsif tg_op = 'DELETE' then
        insert into public.audit_logs (table_name, record_id, operation, performed_by, old_data, new_data)
        values (tg_table_name, old.id, 'DELETE', v_actor, to_jsonb(old), null);
        return old;
    end if;

    return null;
end;
$$;

-- Attach audit triggers
create trigger trg_audit_departments
after insert or update or delete on public.departments
for each row execute function public.fn_write_audit_log();

create trigger trg_audit_users_profile
after insert or update or delete on public.users_profile
for each row execute function public.fn_write_audit_log();

create trigger trg_audit_assets
after insert or update or delete on public.assets
for each row execute function public.fn_write_audit_log();

create trigger trg_audit_purchase_orders
after insert or update or delete on public.purchase_orders
for each row execute function public.fn_write_audit_log();

create trigger trg_audit_repairs
after insert or update or delete on public.repairs
for each row execute function public.fn_write_audit_log();

create trigger trg_audit_buybacks
after insert or update or delete on public.buybacks
for each row execute function public.fn_write_audit_log();

create trigger trg_audit_verifications
after insert or update or delete on public.verifications
for each row execute function public.fn_write_audit_log();

-- Employee facing view with masked employee info
create or replace view public.view_employee_assets as
select
    a.id,
    a.asset_code,
    a.asset_type,
    a.brand_model,
    a.status,
    coalesce(left(up.full_name, 1) || repeat('*', greatest(length(up.full_name) - 1, 0)), '未分配') as assigned_to_masked,
    d.name as department_name,
    a.is_buyback_allowed,
    a.buyback_available_at,
    a.last_repair_at,
    a.repair_count
from public.assets a
left join public.users_profile up on up.user_id = a.assigned_to and up.deleted_at is null
left join public.departments d on d.id = a.department_id and d.deleted_at is null
where a.deleted_at is null;

comment on view public.view_employee_assets is '员工可见设备列表（脱敏信息）';

-- TODO: 视图后续可扩展更多脱敏规则与字段
