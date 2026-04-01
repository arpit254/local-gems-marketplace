do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'rejected'
      and enumtypid = 'public.order_status'::regtype
  ) then
    alter type public.order_status add value 'rejected';
  end if;
end $$;

drop policy if exists "Vendors read own orders" on public.orders;
create policy "Vendors read own orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1
    from public.vendors
    where vendors.id = orders.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists "Vendors update own orders" on public.orders;
create policy "Vendors update own orders"
on public.orders for update
to authenticated
using (
  exists (
    select 1
    from public.vendors
    where vendors.id = orders.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors
    where vendors.id = orders.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);
