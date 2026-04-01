alter table public.orders
  add column if not exists phone_number text;

alter table public.orders
  add column if not exists delivery_address text;

alter table public.orders
  add column if not exists delivery_landmark text;

alter table public.orders
  add column if not exists delivery_instructions text;
