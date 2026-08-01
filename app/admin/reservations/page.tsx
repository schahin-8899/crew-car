import { createClient } from '@/lib/supabase/server';
import ReservationRow from './reservation-row';
import NewReservationForm from './new-reservation-form';

export default async function AdminReservationsPage() {
  const supabase = createClient();

  const { data: reservations } = await supabase
    .from('reservations')
    .select(
      `id, car_id, start_date, end_date, pickup_time, dropoff_time, pickup_location_id, dropoff_location_id, total_price, payment_status, payment_method, status,
       guest_name, guest_phone, guest_email,
       cars ( make, model, license_plate ),
       profiles ( full_name, phone ),
       pickup_location:locations!reservations_pickup_location_id_fkey ( name ),
       dropoff_location:locations!reservations_dropoff_location_id_fkey ( name ),
       reservation_photos ( id, stage, photo_url ),
       reservation_charges ( id, category, description, amount )`
    )
    .order('start_date', { ascending: true });

  const { data: cars } = await supabase
    .from('cars')
    .select('id, make, model, year, base_daily_price')
    .eq('is_active', true);

  const { data: renters } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_admin', false);

  const { data: locations } = await supabase.from('locations').select('id, name').eq('is_active', true);

  const { data: pricingRules } = await supabase.from('pricing_rules').select('*');

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-medium mb-4">Reservations</h1>

      <NewReservationForm
        cars={cars ?? []}
        renters={renters ?? []}
        locations={locations ?? []}
        pricingRules={pricingRules ?? []}
      />

      <div className="space-y-2">
        {reservations?.map((r: any) => (
          <ReservationRow key={r.id} reservation={r} cars={cars ?? []} locations={locations ?? []} />
        ))}
        {reservations?.length === 0 && (
          <p className="text-sm text-neutral-500">No reservations yet.</p>
        )}
      </div>
    </div>
  );
}
