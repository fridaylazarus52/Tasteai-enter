-- TasteAI Enterprise initial schema
-- Safe to re-run: uses IF NOT EXISTS and drops/recreates only the named policies.
-- Review all schema and RLS rules before production use.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  business_type text not null default 'restaurant'
    check (business_type in ('restaurant','cafe','catering','bakery','hotel','food_truck','other')),
  currency text not null default 'NGN',
  timezone text not null default 'Africa/Lagos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  description text,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  stock_quantity numeric(12,3) not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  sale_number text,
  status text not null default 'completed'
    check (status in ('draft','completed','refunded','cancelled')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'NGN',
  notes text,
  sold_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sale_number)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'NGN',
  spent_at date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  insight_type text not null
    check (insight_type in ('sales','inventory','customer','forecast','recommendation','alert','general')),
  title text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) check (confidence >= 0 and confidence <= 1),
  period_start date,
  period_end date,
  status text not null default 'new'
    check (status in ('new','reviewed','dismissed','actioned')),
  created_at timestamptz not null default now()
);

create index if not exists idx_businesses_owner_id on public.businesses(owner_id);
create index if not exists idx_products_business_id on public.products(business_id);
create index if not exists idx_customers_business_id on public.customers(business_id);
create index if not exists idx_sales_business_sold_at on public.sales(business_id, sold_at desc);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_expenses_business_spent_at on public.expenses(business_id, spent_at desc);
create index if not exists idx_ai_insights_business_created on public.ai_insights(business_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.ai_insights enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.sales to authenticated;
grant select, insert, update, delete on public.sale_items to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.ai_insights to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Owners can manage their businesses" on public.businesses;
create policy "Owners can manage their businesses" on public.businesses
for all to authenticated using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Business owners can manage products" on public.products;
create policy "Business owners can manage products" on public.products
for all to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
);

drop policy if exists "Business owners can manage customers" on public.customers;
create policy "Business owners can manage customers" on public.customers
for all to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
);

drop policy if exists "Business owners can manage sales" on public.sales;
create policy "Business owners can manage sales" on public.sales
for all to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
);

drop policy if exists "Business owners can manage sale items" on public.sale_items;
create policy "Business owners can manage sale items" on public.sale_items
for all to authenticated using (
  exists (
    select 1 from public.sales s
    join public.businesses b on b.id = s.business_id
    where s.id = sale_id and b.owner_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.sales s
    join public.businesses b on b.id = s.business_id
    where s.id = sale_id and b.owner_id = (select auth.uid())
  )
);

drop policy if exists "Business owners can manage expenses" on public.expenses;
create policy "Business owners can manage expenses" on public.expenses
for all to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
);

drop policy if exists "Business owners can manage AI insights" on public.ai_insights;
create policy "Business owners can manage AI insights" on public.ai_insights
for all to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
);
