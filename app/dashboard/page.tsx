import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import ReservationCard from './reservation-card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = createClient();
  const { data: reservations } = await supabase
    .from('reservations')
    .select(
      `id, start_date, end_date, pickup_time, dropoff_time, total_price, payment_status, status,
       cars ( make, model, year ),
       pickup_location:locations!reservations_pickup_location_id_fkey ( name ),
       dropoff_location:locations!reservations_dropoff_location_id_fkey ( name ),
       reservation_photos ( id, stage, photo_url )`
    )
    .eq('renter_id', profile.id)
    .order('start_date', { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink">{t('title')}</h1>
        <Link
          href="/cars"
          className="text-sm bg-accent text-white hover:bg-accent-dark transition-colors px-4 py-2 rounded-lg font-medium"
        >
          {t('bookCar')}
        </Link>
      </div>
      <div className="space-y-3">
        {reservations?.map((r: any) => (
          <ReservationCard key={r.id} reservation={r} />
        ))}
        {reservations?.length === 0 && (
          <p className="text-sm text-neutral-500">
            {t('noReservations')}{' '}
            <Link href="/cars" className="text-accent hover:text-accent-dark font-medium">
              {t('browseCars')}
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
