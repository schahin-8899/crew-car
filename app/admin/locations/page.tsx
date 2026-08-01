import { createClient } from '@/lib/supabase/server';
import NewLocationForm from './new-location-form';
import LocationItem from './location-item';

export default async function AdminLocationsPage() {
  const supabase = createClient();
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-4">Locations</h1>

      <NewLocationForm />

      <div className="mt-6 space-y-4">
        {locations?.map((loc) => (
          <LocationItem key={loc.id} location={loc} />
        ))}
        {locations?.length === 0 && (
          <p className="text-sm text-neutral-500">No locations yet — add your first one above.</p>
        )}
      </div>
    </div>
  );
}
