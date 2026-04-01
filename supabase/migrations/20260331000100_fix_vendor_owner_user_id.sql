alter table public.vendors
  add column if not exists owner_user_id uuid;

create unique index if not exists vendors_owner_user_id_key
  on public.vendors (owner_user_id);

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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
