create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('placed', 'accepted', 'rejected', 'cancelled', 'out_for_delivery', 'delivered');
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
  owner_user_id uuid unique,
  is_open boolean not null default true
);

alter table public.vendors
  add column if not exists owner_user_id uuid unique;

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
  phone_number text,
  delivery_address text,
  delivery_landmark text,
  delivery_instructions text,
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

alter table public.orders
  add column if not exists phone_number text;

alter table public.orders
  add column if not exists delivery_address text;

alter table public.orders
  add column if not exists delivery_landmark text;

alter table public.orders
  add column if not exists delivery_instructions text;

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

  if coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer'::public.user_role) = 'vendor'::public.user_role then
    insert into public.vendors (
      id,
      name,
      type,
      distance,
      address,
      avatar,
      owner_user_id,
      is_open
    )
    values (
      'vendor-' || replace(left(new.id::text, 8), '-', ''),
      coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'New Vendor'),
      'Local Shop',
      '0 km',
      'Update your shop address',
      '🏪',
      new.id,
      true
    )
    on conflict (owner_user_id) do update set
      name = excluded.name,
      type = excluded.type,
      distance = excluded.distance,
      address = excluded.address,
      avatar = excluded.avatar,
      is_open = excluded.is_open;
  end if;

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

drop policy if exists "Vendors insert products" on public.products;
create policy "Vendors insert products"
on public.products for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
);

drop policy if exists "Vendors update products" on public.products;
create policy "Vendors update products"
on public.products for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
);

drop policy if exists "Vendors delete products" on public.products;
create policy "Vendors delete products"
on public.products for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
);

drop policy if exists "Public read vendor_products" on public.vendor_products;
create policy "Public read vendor_products"
on public.vendor_products for select
to anon, authenticated
using (true);

drop policy if exists "Vendors insert vendor_products" on public.vendor_products;
create policy "Vendors insert vendor_products"
on public.vendor_products for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
);

drop policy if exists "Vendors update vendor_products" on public.vendor_products;
create policy "Vendors update vendor_products"
on public.vendor_products for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
);

drop policy if exists "Vendors delete vendor_products" on public.vendor_products;
create policy "Vendors delete vendor_products"
on public.vendor_products for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'vendor'
  )
);

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

insert into public.categories (id, name, emoji) values
  ('1', 'Vegetables', '🥬'),
  ('2', 'Fruits', '🍎'),
  ('3', 'Dairy', '🥛'),
  ('4', 'Snacks', '🍿'),
  ('5', 'Beverages', '🧃'),
  ('6', 'Grocery', '🛒'),
  ('7', 'Bakery', '🍞'),
  ('8', 'Meat & Fish', '🥩')
on conflict (id) do update set
  name = excluded.name,
  emoji = excluded.emoji;

insert into public.vendors (id, name, type, rating, review_count, distance, address, avatar, is_open) values
  ('v1', 'Ramesh''s Fresh Veggies', 'Street Vendor', 4.5, 128, '0.3 km', '12 Main Market, Sector 5', '🧑‍🌾', true),
  ('v2', 'Sharma General Store', 'Local Shop', 4.2, 85, '0.5 km', '45 Gandhi Road', '🏪', true),
  ('v3', 'Lakshmi Dairy Corner', 'Dairy Shop', 4.8, 210, '0.8 km', '78 Nehru Street', '🐄', true),
  ('v4', 'Anwar''s Fruit Cart', 'Street Vendor', 4.3, 64, '0.2 km', 'Near Bus Stand', '🍉', false),
  ('v5', 'Singh Kirana Store', 'Grocery Store', 4.6, 156, '1.1 km', '23 Market Complex', '🏬', true)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  rating = excluded.rating,
  review_count = excluded.review_count,
  distance = excluded.distance,
  address = excluded.address,
  avatar = excluded.avatar,
  is_open = excluded.is_open;

insert into public.products (id, name, category_id, image) values
  ('p1', 'Fresh Tomatoes', '1', '🍅'),
  ('p2', 'Onions', '1', '🧅'),
  ('p3', 'Potatoes', '1', '🥔'),
  ('p4', 'Milk (1L)', '3', '🥛'),
  ('p5', 'Curd (500g)', '3', '🫙'),
  ('p6', 'Apples', '2', '🍎'),
  ('p7', 'Bananas', '2', '🍌'),
  ('p8', 'Bread', '7', '🍞'),
  ('p9', 'Eggs (12pc)', '6', '🥚'),
  ('p10', 'Rice (1kg)', '6', '🍚'),
  ('p11', 'Chips', '4', '🍟'),
  ('p12', 'Biscuits', '4', '🍪'),
  ('p13', 'Green Chillies', '1', '🌶️'),
  ('p14', 'Orange Juice', '5', '🧃'),
  ('p15', 'Paneer (250g)', '3', '🧀')
on conflict (id) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  image = excluded.image;

insert into public.vendor_products (id, product_id, vendor_id, price, unit, in_stock) values
  ('vp1', 'p1', 'v1', 40, 'per kg', true),
  ('vp2', 'p1', 'v2', 45, 'per kg', true),
  ('vp3', 'p1', 'v5', 38, 'per kg', true),
  ('vp4', 'p2', 'v1', 30, 'per kg', true),
  ('vp5', 'p2', 'v2', 35, 'per kg', true),
  ('vp6', 'p3', 'v1', 25, 'per kg', true),
  ('vp7', 'p4', 'v3', 56, 'per L', true),
  ('vp8', 'p4', 'v2', 60, 'per L', true),
  ('vp9', 'p5', 'v3', 40, 'per 500g', true),
  ('vp10', 'p6', 'v4', 150, 'per kg', false),
  ('vp11', 'p6', 'v5', 160, 'per kg', true),
  ('vp12', 'p7', 'v4', 50, 'per dozen', false),
  ('vp13', 'p7', 'v1', 45, 'per dozen', true),
  ('vp14', 'p8', 'v2', 35, 'per pack', true),
  ('vp15', 'p9', 'v2', 80, 'per dozen', true),
  ('vp16', 'p10', 'v5', 55, 'per kg', true),
  ('vp17', 'p11', 'v2', 20, 'per pack', true),
  ('vp18', 'p12', 'v2', 30, 'per pack', true),
  ('vp19', 'p13', 'v1', 15, 'per 100g', true),
  ('vp20', 'p14', 'v2', 25, 'per pack', true),
  ('vp21', 'p15', 'v3', 80, 'per 250g', true)
on conflict (id) do update set
  product_id = excluded.product_id,
  vendor_id = excluded.vendor_id,
  price = excluded.price,
  unit = excluded.unit,
  in_stock = excluded.in_stock;
