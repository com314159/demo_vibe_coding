-- Seed data for IT equipment asset management system
-- Run via: supabase db set-seed

-- Ensure extension available for UUID generation
create extension if not exists "pgcrypto";

insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    email_change_token_current,
    reauthentication_token,
    reauthentication_sent_at,
    phone,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    raw_app_meta_data,
    raw_user_meta_data
)
values
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@demo.local',
        crypt('Admin#123456', gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        '',
        now(),
        '',
        null,
        '',
        '',
        null,
        '',
        '',
        null,
        null,
        '',
        '',
        null,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'alice@demo.local',
        crypt('Employee#1', gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        '',
        now(),
        '',
        null,
        '',
        '',
        null,
        '',
        '',
        null,
        null,
        '',
        '',
        null,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb
    ),
    (
        'cccccccc-cccc-cccc-cccc-ccccccccccc2',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'bob@demo.local',
        crypt('Employee#2', gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        '',
        now(),
        '',
        null,
        '',
        '',
        null,
        '',
        '',
        null,
        null,
        '',
        '',
        null,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb
    ),
    (
        'dddddddd-dddd-dddd-dddd-ddddddddddd3',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'carol@demo.local',
        crypt('Employee#3', gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        '',
        now(),
        '',
        null,
        '',
        '',
        null,
        '',
        '',
        null,
        null,
        '',
        '',
        null,
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb
    )
on conflict (id) do nothing;

insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
values
    (
        gen_random_uuid(),
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        jsonb_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'email', 'admin@demo.local'),
        'email',
        'admin@demo.local',
        now(),
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        jsonb_build_object('sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'email', 'alice@demo.local'),
        'email',
        'alice@demo.local',
        now(),
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'cccccccc-cccc-cccc-cccc-ccccccccccc2',
        jsonb_build_object('sub', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'email', 'bob@demo.local'),
        'email',
        'bob@demo.local',
        now(),
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        'dddddddd-dddd-dddd-dddd-ddddddddddd3',
        jsonb_build_object('sub', 'dddddddd-dddd-dddd-dddd-ddddddddddd3', 'email', 'carol@demo.local'),
        'email',
        'carol@demo.local',
        now(),
        now(),
        now()
    )
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Departments
--------------------------------------------------------------------------------
insert into public.departments (id, name, description)
values
    ('11111111-1111-1111-1111-111111111111', '技术部', '研发与平台维护'),
    ('22222222-2222-2222-2222-222222222222', '产品部', '产品策划与运营')
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Users profile (1 admin + 3 employees)
--------------------------------------------------------------------------------
insert into public.users_profile (user_id, full_name, department_id, job_title, role, email, is_active, created_at, last_login_at)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '陈 管理', '11111111-1111-1111-1111-111111111111', 'IT运维主管', 'admin', 'admin@demo.local', true, now(), now()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '张 三', '11111111-1111-1111-1111-111111111111', '后端工程师', 'employee', 'alice@demo.local', true, now(), now()),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '李 四', '22222222-2222-2222-2222-222222222222', '产品经理', 'employee', 'bob@demo.local', true, now(), now()),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd3', '王 五', '11111111-1111-1111-1111-111111111111', '测试工程师', 'employee', 'carol@demo.local', true, now(), now())
on conflict (user_id) do nothing;

--------------------------------------------------------------------------------
-- Purchase order (1 record)
--------------------------------------------------------------------------------
insert into public.purchase_orders (
    id,
    order_code,
    order_type,
    applicant_id,
    department_id,
    device_category,
    quantity,
    unit_budget,
    status,
    actual_amount,
    expected_arrival_at,
    vendor,
    notes
)
values (
    '50000000-0000-0000-0000-000000000001',
    'PO-2025-0001',
    'replacement',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'laptop',
    5,
    12000,
    'purchasing',
    58000,
    now() + interval '30 days',
    '京东企业购',
    '用于笔记本更新换代'
)
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Assets (10 records)
--------------------------------------------------------------------------------
insert into public.assets (
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
    notes
)
values
    ('10000000-0000-0000-0000-000000000001', 'DEV-2024-0001', 'laptop', 'MacBook Pro 14 M3', now() - interval '400 days', 13800, 14500, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'in_service', true, now() + interval '2 years', now() - interval '40 days', 1, '核心服务端设备'),
    ('10000000-0000-0000-0000-000000000002', 'DEV-2024-0002', 'laptop', 'ThinkPad X1 Carbon', now() - interval '500 days', 9800, 8900, 'cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', 'in_service', true, now() + interval '18 months', now() - interval '10 days', 1, '便携办公'),
    ('10000000-0000-0000-0000-000000000003', 'DEV-2024-0003', 'desktop', 'Dell Precision 7865', now() - interval '700 days', 15800, 12000, 'dddddddd-dddd-dddd-dddd-ddddddddddd3', '11111111-1111-1111-1111-111111111111', 'under_repair', false, null, now() - interval '5 days', 2, '图形工作站'),
    ('10000000-0000-0000-0000-000000000004', 'DEV-2024-0004', 'monitor', 'Dell UltraSharp 27', now() - interval '300 days', 3200, 3000, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'in_service', false, null, null, 0, null),
    ('10000000-0000-0000-0000-000000000005', 'DEV-2024-0005', 'monitor', 'LG UltraFine 5K', now() - interval '200 days', 5200, 4800, null, '22222222-2222-2222-2222-222222222222', 'pending_assignment', false, null, null, 0, '待分配'),
    ('10000000-0000-0000-0000-000000000006', 'DEV-2024-0006', 'phone', 'iPhone 15 Pro', now() - interval '150 days', 8999, 8200, 'cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', 'in_service', false, null, null, 0, null),
    ('10000000-0000-0000-0000-000000000007', 'DEV-2024-0007', 'tablet', 'iPad Pro 12.9', now() - interval '250 days', 10299, 9600, 'dddddddd-dddd-dddd-dddd-ddddddddddd3', '11111111-1111-1111-1111-111111111111', 'in_service', false, null, null, 0, null),
    ('10000000-0000-0000-0000-000000000008', 'DEV-2024-0008', 'desktop', 'HP Z4 G5', now() - interval '800 days', 16800, 13000, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'disposed', false, null, now() - interval '120 days', 3, '已报废'),
    ('10000000-0000-0000-0000-000000000009', 'DEV-2024-0009', 'laptop', 'Surface Laptop 5', now() - interval '100 days', 9200, 9000, 'cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', 'buyback_completed', true, now() - interval '15 days', now() - interval '15 days', 1, '已完成回购'),
    ('10000000-0000-0000-0000-00000000000a', 'DEV-2024-0010', 'laptop', 'MacBook Air M2', now() - interval '60 days', 8200, 7800, null, '11111111-1111-1111-1111-111111111111', 'pending_assignment', true, now() + interval '3 years', null, 0, '备用机')
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Repairs (2 records)
--------------------------------------------------------------------------------
insert into public.repairs (
    id,
    repair_code,
    asset_id,
    reported_by,
    issue_description,
    status,
    is_first_repair,
    repair_cost,
    company_coverage_percent,
    completed_at,
    approved_by
)
values
    ('30000000-0000-0000-0000-000000000001', 'FIX-2025-0001', '10000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '键盘偶发失灵', 'picked_up', true, 350, 80, now() - interval '40 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
    ('30000000-0000-0000-0000-000000000002', 'FIX-2025-0002', '10000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-ddddddddddd3', '显卡驱动异常', 'in_progress', false, 1200, 90, null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Buyback (1 record)
--------------------------------------------------------------------------------
insert into public.buybacks (
    id,
    buyback_code,
    asset_id,
    buyback_type,
    employee_payment,
    approval_status,
    finance_confirmed_at,
    new_purchase_order_id,
    notes
)
values (
    '40000000-0000-0000-0000-000000000001',
    'BUYBACK-2025-0001',
    '10000000-0000-0000-0000-000000000009',
    'laptop',
    100,
    'approved',
    now() - interval '10 days',
    '50000000-0000-0000-0000-000000000001',
    '员工以固定金额回购旧设备'
)
on conflict (id) do nothing;

--------------------------------------------------------------------------------
-- Optional clean-up of audit log noise during seed
--------------------------------------------------------------------------------
delete from public.audit_logs;
