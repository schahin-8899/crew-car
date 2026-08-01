import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import BookingForm from './booking-form';

export const dynamic = 'force-dynamic';

export default async function BookCarPage({ params }: { params: { carId: string } }) {
  const t = await getTranslations('book');
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/cars/${params.carId}/book`);

  const supabase = createClient();

  const { data: car } = await supabase
    .from('cars')
    .select('*')
    .eq('id', params.carId)
    .eq('is_active', true)
    .single();

  if (!car) notFound();

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true);

  const { data: pricingRules } = await supabase
    .from('pricing_rules')
    .select('*')
    .or(`car_id.eq.${params.carId},car_id.is.null`);

  // Existing confirmed reservations, so the form can block already-booked dates.
  const { data: reservations } = await supabase
    .from('reservations')
    .select('start_date, end_date')
    .eq('car_id', params.carId)
    .eq('status', 'confirmed');

  const { data: blackouts } = await supabase
    .from('car_blackout_dates')
    .select('start_date, end_date')
    .eq('car_id', params.carId);

  const { data: photos } = await supabase
    .from('car_photos')
    .select('photo_url')
    .eq('car_id', params.carId)
    .limit(1);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link href="/cars" className="text-sm text-accent hover:text-accent-dark font-medium mb-4 inline-block">
        ← Back to cars
      </Link>
      {photos?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photos[0].photo_url}
          alt={`${car.make} ${car.model}`}
          className="w-full aspect-video object-cover rounded-2xl mb-4"
        />
      )}
      <h1 className="font-display text-xl font-medium tracking-tight text-ink mb-1">
        {car.year} {car.make} {car.model}
      </h1>
      <p className="text-sm text-neutral-500 mb-6">${car.base_daily_price}/day {t('baseRate')}</p>
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
        <BookingForm
          car={car}
          locations={locations ?? []}
          pricingRules={pricingRules ?? []}
          bookedRanges={reservations ?? []}
          blackoutRanges={blackouts ?? []}
          renterId={profile.id}
          defaultPickupId={car.default_pickup_location_id}
          defaultDropoffId={car.default_dropoff_location_id}
        />
      </div>
    </div>
  );
}
