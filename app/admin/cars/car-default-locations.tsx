'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CarDefaultLocations({
  carId,
  locations,
  defaultPickupId,
  defaultDropoffId,
}: {
  carId: string;
  locations: { id: string; name: string }[];
  defaultPickupId: string | null;
  defaultDropoffId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [pickup, setPickup] = useState(defaultPickupId ?? '');
  const [dropoff, setDropoff] = useState(defaultDropoffId ?? '');
  const [saving, setSaving] = useState(false);

  async function handleChange(field: 'pickup' | 'dropoff', value: string) {
    if (field === 'pickup') setPickup(value);
    else setDropoff(value);

    setSaving(true);
    await supabase
      .from('cars')
      .update({
        default_pickup_location_id: field === 'pickup' ? value || null : pickup || null,
        default_dropoff_location_id: field === 'dropoff' ? value || null : dropoff || null,
      })
      .eq('id', carId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-xs text-neutral-500">
        Default pickup
        <select
          value={pickup}
          onChange={(e) => handleChange('pickup', e.target.value)}
          className="block w-full border rounded px-2 py-1.5 text-sm mt-1"
        >
          <option value="">None</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-neutral-500">
        Default drop-off
        <select
          value={dropoff}
          onChange={(e) => handleChange('dropoff', e.target.value)}
          className="block w-full border rounded px-2 py-1.5 text-sm mt-1"
        >
          <option value="">None</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      {saving && <p className="text-xs text-neutral-400 col-span-2">Saving…</p>}
    </div>
  );
}
