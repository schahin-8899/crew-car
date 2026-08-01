import { createClient } from '@/lib/supabase/server';
import NewCarForm from './new-car-form';
import CarItem from './car-item';

export default async function AdminCarsPage() {
  const supabase = createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select('*, car_photos ( id, photo_url ), car_blackout_dates ( id, start_date, end_date, reason )')
    .order('created_at', { ascending: false });

  const { data: locations } = await supabase.from('locations').select('id, name').eq('is_active', true);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-4">Cars</h1>

      <NewCarForm />

      <div className="mt-8 space-y-4">
        {cars?.map((car) => (
          <CarItem key={car.id} car={car} locations={locations ?? []} />
        ))}
        {cars?.length === 0 && (
          <p className="text-sm text-neutral-500">No cars yet — add your first one above.</p>
        )}
      </div>
    </div>
  );
}
