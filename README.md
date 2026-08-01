# Car rental app — starter

This now covers the full loop: admin manages cars/reservations/tolls,
renters sign up, browse cars, book, and see their reservations — with an
EN/ES language toggle in the top-right corner. Email invoices and reminders
are the one piece still missing (see bottom of this file).

## What's here

- `supabase/schema.sql` — full database schema, run this first
- `lib/supabase/` — client and server Supabase helpers
- `lib/pricing.ts` — demand-based pricing calculation
- `lib/tolls.ts` — SunPass CSV parser + toll-to-reservation matcher
- `app/admin/cars` — add and view cars
- `app/admin/reservations` — view all reservations
- `app/admin/tolls` — upload a SunPass CSV, preview matches, save
- `app/login`, `app/signup` — renter auth
- `app/cars` — public list of available cars
- `app/cars/[carId]/book` — booking form with live pricing and a check
  against already-booked dates
- `app/dashboard` — renter's own reservations
- `components/language-switcher.tsx` — EN/ES toggle, stored in a cookie
  (no URL prefix, so it works on every route including `/admin`)

## Setup

1. **Create a Supabase project** at supabase.com if you don't have one yet.
2. **Run the schema**: open the SQL editor in your Supabase dashboard,
   paste in `supabase/schema.sql`, and run it.
3. **Make yourself an admin**: after you sign up once through Supabase Auth
   (you'll wire up the login page next), run this in the SQL editor,
   swapping in your user's UUID from the `auth.users` table:
   ```sql
   insert into profiles (id, is_admin) values ('your-user-uuid', true);
   ```
4. **Copy `.env.example` to `.env.local`** and fill in your Supabase project
   URL and anon key (Project Settings → API in the Supabase dashboard).
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
6. Visit `http://localhost:3000/admin/cars` to add your first car.

## Deploying

Push this to a GitHub repo, then import it in Vercel. Add the same two
environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.

## A note on the SunPass CSV format

`lib/tolls.ts` guesses column names (`Transponder`, `Post Date/Time`,
`Plaza`, `Amount`). Export a real SunPass statement and check the header
row — if the columns don't match, update `COLUMN_ALIASES` at the top of
that file.

## Not built yet (next slice)

- Email invoices and pickup/return reminders (needs a Resend account +
  API key from you, plus a scheduled job for reminders)
- Editable pickup/drop-off locations UI (table exists, no admin UI yet —
  for now, add rows directly in the Supabase table editor)
- Pricing rules UI (table + logic exist, no admin UI yet — same, add rows
  directly in Supabase for now)
- A calendar view of availability (the booking form currently warns on
  overlapping dates but doesn't show a visual calendar)
- Supabase project settings: depending on your project, email signups may
  require confirmation before login works — check Authentication →
  Providers → Email in your Supabase dashboard if signup/login seems stuck
