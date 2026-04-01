create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.order_items
  where order_id in (
    select id
    from public.orders
    where customer_id = current_user_id
  );

  delete from public.orders
  where customer_id = current_user_id;

  delete from public.vendor_products
  where vendor_id in (
    select id
    from public.vendors
    where owner_user_id = current_user_id
  );

  delete from public.vendors
  where owner_user_id = current_user_id;

  delete from public.profiles
  where id = current_user_id;

  delete from auth.users
  where id = current_user_id;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
