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
