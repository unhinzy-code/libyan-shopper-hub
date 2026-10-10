create type public.app_role as enum ('admin','user');
create type public.order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null unique,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text := coalesce(new.raw_user_meta_data->>'phone', split_part(new.email,'@',1));
begin
  insert into public.profiles(id, name, phone) values (new.id, coalesce(new.raw_user_meta_data->>'name',''), p);
  insert into public.user_roles(user_id, role) values (new.id, 'user');
  if p = '0924554163' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read cats" on public.categories for select to anon, authenticated using (true);
create policy "admin write cats" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2),
  stock int not null default 0,
  sizes text[] not null default '{}',
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read active products" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  delivery_fee numeric(10,2) not null default 0,
  active boolean not null default true
);
grant select on public.cities to anon, authenticated;
grant insert, update, delete on public.cities to authenticated;
grant all on public.cities to service_role;
alter table public.cities enable row level security;
create policy "public read cities" on public.cities for select to anon, authenticated using (true);
create policy "admin write cities" on public.cities for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  user_id uuid not null,
  customer_name text not null,
  phone text not null,
  city text not null,
  address_details text not null default '',
  payment_method text not null check (payment_method in ('cash','transfer')),
  bank text,
  status order_status not null default 'pending',
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  notes text not null default '',
  admin_note text not null default '',
  receipt_url text,
  created_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own or admin orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  name text not null,
  image_url text,
  price numeric(10,2) not null,
  qty int not null,
  size text
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items via order" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create or replace function public.place_order(_items jsonb, _city_id uuid, _details text, _payment text, _bank text, _notes text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  prof record; c record; it jsonb; p record;
  sub numeric := 0; oid uuid; onum bigint; q int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if _payment not in ('cash','transfer') then raise exception 'bad payment'; end if;
  if _payment = 'transfer' and coalesce(_bank,'') = '' then raise exception 'choose bank'; end if;
  select * into prof from profiles where id = uid;
  select * into c from cities where id = _city_id and active;
  if c.id is null then raise exception 'invalid city'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'empty cart'; end if;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'qty')::int;
    if q < 1 or q > 50 then raise exception 'bad qty'; end if;
    select * into p from products where id = (it->>'product_id')::uuid and active for update;
    if p.id is null then raise exception 'product unavailable'; end if;
    if p.stock < q then raise exception 'نفذت الكمية: %', p.name; end if;
    sub := sub + p.price * q;
  end loop;
  insert into orders(user_id, customer_name, phone, city, address_details, payment_method, bank, subtotal, delivery_fee, total, notes)
  values (uid, prof.name, prof.phone, c.name, left(coalesce(_details,''),500), _payment, case when _payment='transfer' then _bank end, sub, c.delivery_fee, sub + c.delivery_fee, left(coalesce(_notes,''),500))
  returning id, order_number into oid, onum;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'qty')::int;
    select * into p from products where id = (it->>'product_id')::uuid;
    insert into order_items(order_id, product_id, name, image_url, price, qty, size)
    values (oid, p.id, p.name, p.image_url, p.price, q, nullif(it->>'size',''));
    update products set stock = stock - q where id = p.id;
  end loop;
  return jsonb_build_object('id', oid, 'order_number', onum);
end $$;
revoke all on function public.place_order(jsonb, uuid, text, text, text, text) from public, anon;
grant execute on function public.place_order(jsonb, uuid, text, text, text, text) to authenticated;

create or replace function public.attach_receipt(_order_id uuid, _url text)
returns void language sql security definer set search_path = public as $$
  update orders set receipt_url = _url where id = _order_id and user_id = auth.uid();
$$;
revoke all on function public.attach_receipt(uuid, text) from public, anon;
grant execute on function public.attach_receipt(uuid, text) to authenticated;

create policy "public product images" on storage.objects for select to anon, authenticated using (bucket_id = 'products');
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.has_role(auth.uid(),'admin'));
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.has_role(auth.uid(),'admin'));
create policy "user upload receipts" on storage.objects for insert to authenticated with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read receipts" on storage.objects for select to authenticated using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));

insert into public.cities(name, delivery_fee) values
('طرابلس',15),('بنغازي',25),('مصراتة',20),('الزاوية',20),('زليتن',20),('الخمس',20),('سبها',35),('سرت',25),('البيضاء',30),('طبرق',35),('درنة',35),('غريان',20),('صبراتة',20),('زوارة',25),('اجدابيا',30),('ترهونة',20),('بني وليد',25),('المرج',30),('غدامس',40),('أوباري',40);

insert into public.categories(name, sort_order) values ('أحذية نسائية',1),('أحذية رجالية',2),('أحذية أطفال',3),('شنط',4);