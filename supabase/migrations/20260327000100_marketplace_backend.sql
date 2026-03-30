create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('placed', 'accepted', 'out_for_delivery', 'delivered');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('customer', 'vendor');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('online', 'cod');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid', 'failed');
  end if;
end $$;

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  emoji text not null
);

create table if not exists public.vendors (
  id text primary key,
  name text not null,
  type text not null,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  distance text not null,
  address text not null,
  avatar text not null,
  is_open boolean not null default true
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category_id text not null references public.categories (id) on delete cascade,
  image text not null
);

create table if not exists public.vendor_products (
  id text primary key,
  product_id text not null references public.products (id) on delete cascade,
  vendor_id text not null references public.vendors (id) on delete cascade,
  price numeric(10, 2) not null,
  unit text not null,
  in_stock boolean not null default true
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.user_role not null
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'users'
  ) then
    insert into public.profiles (id, email, name, role)
    select id, email, name, role
    from public.users
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      role = excluded.role;
  end if;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid(),
  customer_name text not null default 'Guest Customer',
  vendor_id text not null references public.vendors (id) on delete cascade,
  payment_method public.payment_method not null default 'cod',
  payment_status public.payment_status not null default 'pending',
  status public.order_status not null default 'placed',
  total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists payment_method public.payment_method not null default 'cod';

alter table public.orders
  add column if not exists payment_status public.payment_status not null default 'pending';

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  vendor_product_id text not null references public.vendor_products (id) on delete cascade,
  quantity integer not null check (quantity > 0)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'User'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer'::public.user_role)
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.vendor_products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Public read vendors" on public.vendors;
create policy "Public read vendors"
on public.vendors for select
to anon, authenticated
using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "Public read vendor_products" on public.vendor_products;
create policy "Public read vendor_products"
on public.vendor_products for select
to anon, authenticated
using (true);

drop policy if exists "Profiles read own profile" on public.profiles;
create policy "Profiles read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Profiles insert own profile" on public.profiles;
create policy "Profiles insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Profiles update own profile" on public.profiles;
create policy "Profiles update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders"
on public.orders for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "Customers insert own orders" on public.orders;
create policy "Customers insert own orders"
on public.orders for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists "Customers update own orders" on public.orders;
create policy "Customers update own orders"
on public.orders for update
to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
  )
);

drop policy if exists "Customers insert own order items" on public.order_items;
create policy "Customers insert own order items"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
  )
);
