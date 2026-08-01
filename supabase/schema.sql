-- Car rental app schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)

-- Profiles: extends Supabase auth.users with app-specific fields
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Locations: pickup / drop-off points, editable by admin
create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cars: the vehicles available to rent
create table cars (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year int not null,
  license_plate text not null unique,
  transponder_number text, -- SunPass transponder tag, used to match toll charges
  base_daily_price numeric(10, 2) not null,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pricing rules: demand-based overrides on top of base_daily_price
-- e.g. weekend surcharge, holiday surcharge, seasonal multiplier
create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references cars (id) on delete cascade, -- null = applies to all cars
  name text not null,
  start_date date,
  end_date date,
  day_of_week int, -- 0 = Sunday ... 6 = Saturday, null = any day
  price_override numeric(10, 2), -- flat override
  price_multiplier numeric(4, 2), -- e.g. 1.25 for +25%
  priority int not null default 0, -- higher priority wins when rules overlap
  created_at timestamptz not null default now()
);

-- Reservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars (id),
  renter_id uuid not null references profiles (id),
  pickup_location_id uuid references locations (id),
  dropoff_location_id uuid references locations (id),
  start_date date not null,
  end_date date not null,
  pickup_time time not null default '10:00:00',
  dropoff_time time not null default '10:00:00',
  total_price numeric(10, 2) not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid')),
  payment_method text check (payment_method in ('zelle', 'cash', 'other')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  constraint valid_dates check (end_date >= start_date)
);

-- Prevent double-booking the same car for overlapping dates
create extension if not exists btree_gist;
alter table reservations
  add constraint no_overlapping_reservations
  exclude using gist (
    car_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status = 'confirmed');

-- Toll charges: parsed from an uploaded SunPass statement, matched to a reservation
create table toll_charges (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations (id),
  transponder_number text not null,
  toll_plaza text,
  charged_at timestamptz not null,
  amount numeric(10, 2) not null,
  matched boolean not null default false, -- true once matched to a reservation
  source_file text, -- name of the uploaded statement this came from
  created_at timestamptz not null default now()
);

-- Automatically create a profile row whenever someone signs up through
-- Supabase Auth, so the app never has to remember to do it manually.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Photo storage: car listing photos (public) and pickup/dropoff condition
-- photos per reservation (also public here, for simplicity — switch to
-- signed URLs if these should be private later)
insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true);
insert into storage.buckets (id, name, public) values ('reservation-photos', 'reservation-photos', true);

create table car_photos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars (id) on delete cascade,
  photo_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table reservation_photos (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations (id) on delete cascade,
  stage text not null check (stage in ('pickup', 'dropoff')),
  photo_url text not null,
  created_at timestamptz not null default now()
);

alter table car_photos enable row level security;
alter table reservation_photos enable row level security;

-- Row Level Security
alter table profiles enable row level security;
alter table cars enable row level security;
alter table locations enable row level security;
alter table pricing_rules enable row level security;
alter table reservations enable row level security;
alter table toll_charges enable row level security;

-- Checks admin status via a security-definer function rather than a
-- subquery on profiles directly inside a profiles policy — querying the
-- same table a policy is defined on, from within that policy, causes
-- infinite recursion in Postgres RLS.
create function is_admin(user_id uuid)
returns boolean as $$
  select coalesce((select p.is_admin from profiles p where p.id = user_id), false);
$$ language sql security definer stable;

-- Photo policies (defined here, after is_admin exists)
create policy anyone_view_car_photos on car_photos
  for select using (true);
create policy admins_manage_car_photos on car_photos
  for all using (is_admin(auth.uid()));

create policy renters_view_own_reservation_photos on reservation_photos
  for select using (
    exists (select 1 from reservations r where r.id = reservation_id and r.renter_id = auth.uid())
  );
create policy admins_manage_reservation_photos on reservation_photos
  for all using (is_admin(auth.uid()));

create policy public_view_car_photos_storage on storage.objects
  for select using (bucket_id = 'car-photos');
create policy admins_upload_car_photos on storage.objects
  for insert with check (bucket_id = 'car-photos' and is_admin(auth.uid()));
create policy admins_delete_car_photos on storage.objects
  for delete using (bucket_id = 'car-photos' and is_admin(auth.uid()));

create policy public_view_reservation_photos_storage on storage.objects
  for select using (bucket_id = 'reservation-photos');
create policy admins_manage_reservation_photo_files on storage.objects
  for all using (bucket_id = 'reservation-photos' and is_admin(auth.uid()));

-- Profiles: users can read/update their own; admins can read all
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles
  for select using (is_admin(auth.uid()));

-- Cars & locations: publicly readable (active only), admin-writable
create policy "Anyone can view active cars" on cars
  for select using (is_active = true);
create policy "Admins manage cars" on cars
  for all using (is_admin(auth.uid()));

create policy "Anyone can view active locations" on locations
  for select using (is_active = true);
create policy "Admins manage locations" on locations
  for all using (is_admin(auth.uid()));

create policy "Admins manage pricing" on pricing_rules
  for all using (is_admin(auth.uid()));

-- Reservations: renters see their own; admins see all
create policy "Renters view own reservations" on reservations
  for select using (auth.uid() = renter_id);
create policy "Renters create own reservations" on reservations
  for insert with check (auth.uid() = renter_id);
create policy "Admins manage all reservations" on reservations
  for all using (is_admin(auth.uid()));

-- Toll charges: admin only (they're the ones reconciling statements)
create policy "Admins manage toll charges" on toll_charges
  for all using (is_admin(auth.uid()));
create policy "Renters view tolls on their reservations" on toll_charges
  for select using (
    exists (select 1 from reservations r where r.id = reservation_id and r.renter_id = auth.uid())
  );
