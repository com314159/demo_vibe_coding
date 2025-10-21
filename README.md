# demo_vibe_coding


子任务 1：数据库初始化（一次性让表落地）

复制给 Codex：

读取 PRD 的“表单设计方案”，生成 supabase/migrations/0001_init_schema.sql：
	•	表：assets, repairs, buybacks, verifications, purchase_orders, users_profile, departments, audit_logs；
	•	关键字段：参照 PRD 表头；金额 numeric(12,2)、时间 timestamptz、软删 deleted_at；
	•	约束：NOT NULL、外键、唯一索引（如设备ID）、CHECK（回购金额=100；状态枚举）；
	•	触发器：对上述业务表的 INSERT/UPDATE/DELETE 写入 audit_logs（记录表名、操作人、旧值/新值摘要、时间）；
	•	初始视图：为“员工可见设备列表”建只读 view_employee_assets（已做列脱敏）；
	•	给出执行命令：supabase db push + 最小校验 SQL（select/insert 示例）。

⸻

子任务 2：RLS 策略

在 0002_rls_policies.sql：
	•	角色：employee/admin，以 auth.uid() 关联 users_profile.id；
	•	assets：employee 只能 select 自己 assigned_user_id = auth.uid() 的行；admin 全量 RW；
	•	repairs/buybacks/verifications/purchase_orders：employee 仅能创建与本人相关的记录并读到；admin 全量 RW；
	•	为 view_employee_assets 开放只读；
	•	附带：创建测试用户、切换 role 的方法与 psql 验证片段。

⸻

子任务 3：种子数据 & 导入模板

生成 supabase/seed.sql 与 scripts/sample_import.csv：
	•	插入 2 个部门、1 管理员 + 3 员工、10 台设备、2 条维修、1 条回购、1 条采购；
	•	给出：supabase db reset && supabase db push && supabase db set-seed 的命令；
	•	输出一个 CSV 导入模板列头与校验规则。

⸻

子任务 4：Next.js 骨架

初始化 frontend/：
	•	依赖：@supabase/supabase-js @tanstack/react-table react-hook-form zod、Tailwind、shadcn/ui；
	•	.env.local 读取 NEXT_PUBLIC_SUPABASE_URL/ANON_KEY；
	•	新建 /app/(auth)/login 与会话守卫；
	•	/app/assets：表格（服务端分页/筛选/排序），右侧抽屉编辑，表单校验用 Zod；
	•	提供启动命令与最小 e2e 测试步骤（创建/编辑/权限验证）。

⸻

子任务 5：流程状态机（维修/回购/年度确认）

	•	在 supabase/functions/ 新建：repairs-flow、buyback-flow、annual-verification（Deno）；
	•	每个函数：输入参数、状态流转校验、写审计、错误码；
	•	给出 supabase functions serve 本地调试与 curl 示例；
	•	前端在对应列表页增加“发起/流转”按钮并调用函数。

⸻

子任务 6：仪表盘

	•	SQL 视图/物化视图：设备状态分布、部门资产总额、维修次数趋势；
	•	/app/dashboard 用简单图表展示；
	•	附上刷新策略与索引建议。

⸻

子任务 7（可选）：AI 增强最小闭环

	•	建表 ai_embeddings(id, type, ref_id, content, embedding vector) 并创建 ivfflat 索引；
	•	写一个 Edge Function qa：embedding 相似检索 + 规则查询，返回“明年采购建议”和“高风险设备”；
	•	给 curl 示例与前端调用代码。



## 记录
管理员：admin@demo.local / Admin#123456
员工：alice@demo.local / Employee#1 



## 启动命令


## 系统prompt
你是资深全栈工程师（Next.js + Supabase + Postgres + RLS + Deno Edge Functions）。
请严格以仓库根目录下的《IT设备资产管理系统_PRD_v1.1_含表单设计.md》为唯一需求来源。
所有输出必须可直接运行，并包含：文件路径、完整代码、执行命令、最小测试步骤。
数据库变更用 Supabase migrations（新建 supabase/migrations/xxxxx.sql），同时给回滚思路。
禁止臆造需求，如有不确定，用安全缺省实现并标注 TODO。 
web端界面设计上参考飞书多维表格或者monday类似的产品