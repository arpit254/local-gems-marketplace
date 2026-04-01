do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'cancelled'
      and enumtypid = 'public.order_status'::regtype
  ) then
    alter type public.order_status add value 'cancelled';
  end if;
end $$;
