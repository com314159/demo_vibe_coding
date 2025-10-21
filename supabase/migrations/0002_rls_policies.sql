-- Enable row level security across business tables
alter table public.departments enable row level security;
alter table public.users_profile enable row level security;
alter table public.assets enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.repairs enable row level security;
alter table public.buybacks enable row level security;
alter table public.verifications enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function to check admin privilege
create or replace function public.fn_is_admin(p_uid uuid default auth.uid())
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.users_profile up
        where up.user_id = p_uid
          and up.deleted_at is null
          and up.role = 'admin'
    );
$$;

-- Helper function to check employee privilege
create or replace function public.fn_is_employee(p_uid uuid default auth.uid())
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.users_profile up
        where up.user_id = p_uid
          and up.deleted_at is null
          and up.role = 'employee'
    );
$$;

--------------------------------------------------------------------------------
-- Departments
--------------------------------------------------------------------------------
create policy departments_admin_full_access
    on public.departments
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

create policy departments_employee_read_only
    on public.departments
    for select
    using (public.fn_is_employee(auth.uid()));

--------------------------------------------------------------------------------
-- Users profile (self read, admin manage)
--------------------------------------------------------------------------------
create policy users_profile_self_read
    on public.users_profile
    for select
    using (
        auth.uid() = user_id
        or public.fn_is_admin(auth.uid())
    );

create policy users_profile_admin_manage
    on public.users_profile
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

--------------------------------------------------------------------------------
-- Assets (employee only sees own assigned assets, admin full control)
--------------------------------------------------------------------------------
create policy assets_admin_full_access
    on public.assets
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

create policy assets_employee_view_assigned
    on public.assets
    for select
    using (
        public.fn_is_employee(auth.uid())
        and assigned_to = auth.uid()
    );

--------------------------------------------------------------------------------
-- Purchase orders (employee create/read own, admin full control)
--------------------------------------------------------------------------------
create policy purchase_orders_admin_full_access
    on public.purchase_orders
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

create policy purchase_orders_employee_select_own
    on public.purchase_orders
    for select
    using (
        public.fn_is_employee(auth.uid())
        and applicant_id = auth.uid()
    );

create policy purchase_orders_employee_insert_own
    on public.purchase_orders
    for insert
    with check (
        public.fn_is_employee(auth.uid())
        and applicant_id = auth.uid()
    );

--------------------------------------------------------------------------------
-- Repairs (employee create/read own, admin full control)
--------------------------------------------------------------------------------
create policy repairs_admin_full_access
    on public.repairs
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

create policy repairs_employee_select_own
    on public.repairs
    for select
    using (
        public.fn_is_employee(auth.uid())
        and reported_by = auth.uid()
    );

create policy repairs_employee_insert_own
    on public.repairs
    for insert
    with check (
        public.fn_is_employee(auth.uid())
        and reported_by = auth.uid()
    );

--------------------------------------------------------------------------------
-- Buybacks (employee create/read via assigned asset, admin full control)
--------------------------------------------------------------------------------
create policy buybacks_admin_full_access
    on public.buybacks
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

create policy buybacks_employee_select_assigned
    on public.buybacks
    for select
    using (
        public.fn_is_employee(auth.uid())
        and exists (
            select 1
            from public.assets a
            where a.id = asset_id
              and a.assigned_to = auth.uid()
        )
    );

create policy buybacks_employee_insert_assigned
    on public.buybacks
    for insert
    with check (
        public.fn_is_employee(auth.uid())
        and exists (
            select 1
            from public.assets a
            where a.id = asset_id
              and a.assigned_to = auth.uid()
        )
    );

--------------------------------------------------------------------------------
-- Verifications (employee create/read own, admin full control)
--------------------------------------------------------------------------------
create policy verifications_admin_full_access
    on public.verifications
    for all
    using (public.fn_is_admin(auth.uid()))
    with check (public.fn_is_admin(auth.uid()));

create policy verifications_employee_select_own
    on public.verifications
    for select
    using (
        public.fn_is_employee(auth.uid())
        and employee_id = auth.uid()
    );

create policy verifications_employee_insert_own
    on public.verifications
    for insert
    with check (
        public.fn_is_employee(auth.uid())
        and employee_id = auth.uid()
    );

--------------------------------------------------------------------------------
-- Audit logs (admin only)
--------------------------------------------------------------------------------
create policy audit_logs_admin_read
    on public.audit_logs
    for select
    using (public.fn_is_admin(auth.uid()));

create policy audit_logs_insert_anyone
    on public.audit_logs
    for insert
    with check (true);

--------------------------------------------------------------------------------
-- View grants (read-only access)
--------------------------------------------------------------------------------
grant select on public.view_employee_assets to authenticated;

--------------------------------------------------------------------------------
-- Testing guidance (manual execution snippets)
--------------------------------------------------------------------------------
-- 以下片段可用于本地 psql 验证，需替换示例 UUID：
-- 1. 创建测试用户（假定 auth.users 中已存在对应 UUID）：
--    insert into public.users_profile (user_id, full_name, email, role)
--    values ('11111111-1111-1111-1111-111111111111', '测试员工', 'employee@example.com', 'employee');
--
-- 2. 提升为管理员 / 调整角色：
--    update public.users_profile
--       set role = 'admin'
--     where user_id = '11111111-1111-1111-1111-111111111111';
--
-- 3. psql 中模拟 employee 调用上下文：
--    set role authenticated;
--    set local "request.jwt.claims" = jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111');
--    select * from public.view_employee_assets;
--
-- 4. 切换为 admin 并验证写权限：
--    set local "request.jwt.claims" = jsonb_build_object('sub', '22222222-2222-2222-2222-222222222222');
--    -- 假设该 UUID 对应 admin 角色用户
--    insert into public.departments (name) values ('测试部门');
--
-- 5. 恢复默认上下文：
--    reset role;
--    reset "request.jwt.claims";
