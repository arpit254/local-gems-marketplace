
-- Allow vendors to read orders placed to their shop
CREATE POLICY "Vendors read own vendor orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = orders.vendor_id
      AND vendors.owner_user_id = auth.uid()
  )
);

-- Allow vendors to update status on their orders (e.g. accepted → out_for_delivery → delivered)
CREATE POLICY "Vendors update own vendor orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = orders.vendor_id
      AND vendors.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = orders.vendor_id
      AND vendors.owner_user_id = auth.uid()
  )
);

-- Allow vendors to read order items for their orders
CREATE POLICY "Vendors read own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.vendors ON vendors.id = orders.vendor_id
    WHERE orders.id = order_items.order_id
      AND vendors.owner_user_id = auth.uid()
  )
);
