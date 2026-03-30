# LocalKart Marketplace

This app now uses Supabase as a persistent backend for catalog data and customer orders.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_PUBLISHABLE_KEY`
   `VITE_SUPABASE_PROJECT_ID`
3. In Supabase Dashboard, enable `Authentication -> Providers -> Anonymous`.
4. Apply the backend schema:
   CLI flow:
   `supabase login`
   `supabase link --project-ref ghpnuzigdcctetfghgpy`
   `supabase db push`
   Manual flow:
   run [setup.sql](/c:/Users/arpit/OneDrive/Desktop/localKart-2/local-gems-marketplace/supabase/setup.sql) in the SQL editor.
5. Start the app.

## Notes

- Public catalog tables are `categories`, `vendors`, `products`, and `vendor_products`.
- Persistent customer data is stored in `orders` and `order_items`.
- Orders are now protected with RLS and tied to the current anonymous Supabase user instead of being publicly readable.
- The frontend automatically creates an anonymous session so checkout can persist without a visible sign-in step.
- Source-controlled schema files live in [supabase/migrations/20260327000100_marketplace_backend.sql](/c:/Users/arpit/OneDrive/Desktop/localKart-2/local-gems-marketplace/supabase/migrations/20260327000100_marketplace_backend.sql) and [supabase/seed.sql](/c:/Users/arpit/OneDrive/Desktop/localKart-2/local-gems-marketplace/supabase/seed.sql).
- [setup.sql](/c:/Users/arpit/OneDrive/Desktop/localKart-2/local-gems-marketplace/supabase/setup.sql) is the combined dashboard-friendly version of the same backend plus starter data.
