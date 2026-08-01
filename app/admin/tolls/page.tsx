import { createClient } from '@/lib/supabase/server';
import ManualTollForm from './manual-toll-form';
import TollUpload from './toll-upload';
import TollItem from './toll-item';

export default async function AdminTollsPage() {
  const supabase = createClient();

  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, start_date, end_date, cars ( make, model ), profiles ( full_name ), guest_name')
    .order('start_date', { ascending: false });

  const reservationOptions = (reservations ?? []).map((r: any) => ({
    id: r.id,
    label: `${r.start_date} → ${r.end_date} · ${r.cars?.make} ${r.cars?.model} · ${
      r.profiles?.full_name ?? r.guest_name ?? 'Unknown'
    }`,
  }));

  const { data: tolls } = await supabase
    .from('toll_charges')
    .select('*')
    .order('charged_at', { ascending: false });

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-medium mb-4">Tolls</h1>

      <ManualTollForm reservations={reservationOptions} />

      <div className="border border-line rounded-lg p-4 bg-white mb-6">
        <h2 className="font-medium mb-1">Upload SunPass statement</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Each toll is matched to a reservation by transponder number and date — cars need a
          transponder number set on their profile for this to work.
        </p>
        <TollUpload />
      </div>

      <h2 className="font-medium mb-2">All tolls</h2>
      <div className="space-y-2">
        {tolls?.map((toll) => (
          <TollItem key={toll.id} toll={toll} reservations={reservationOptions} />
        ))}
        {tolls?.length === 0 && <p className="text-sm text-neutral-500">No tolls logged yet.</p>}
      </div>
    </div>
  );
}
