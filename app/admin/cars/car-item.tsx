'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CarPhotos from './car-photos';
import CarBlackouts from './car-blackouts';
import CarDefaultLocations from './car-default-locations';

export default function CarItem({
  car,
  locations,
}: {
  car: any;
  locations: { id: string; name: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    make: car.make,
    model: car.model,
    year: car.year,
    license_plate: car.license_plate,
    transponder_number: car.transponder_number ?? '',
    base_daily_price: car.base_daily_price,
    is_active: car.is_active,
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('cars')
      .update({
        make: form.make,
        model: form.model,
        year: Number(form.year),
        license_plate: form.license_plate,
        transponder_number: form.transponder_number || null,
        base_daily_price: Number(form.base_daily_price),
        is_active: form.is_active,
      })
      .eq('id', car.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="border border-line rounded-lg p-4 bg-white">
      {editing ? (
        <div className="mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
              placeholder="Make"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="Model"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              placeholder="Year"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              value={form.license_plate}
              onChange={(e) => setForm((f) => ({ ...f, license_plate: e.target.value }))}
              placeholder="License plate"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              value={form.transponder_number}
              onChange={(e) => setForm((f) => ({ ...f, transponder_number: e.target.value }))}
              placeholder="Transponder #"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              value={form.base_daily_price}
              onChange={(e) => setForm((f) => ({ ...f, base_daily_price: e.target.value }))}
              placeholder="Base daily price"
              className="border rounded px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-neutral-500 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
          <div>
            <div className="font-medium">
              {car.year} {car.make} {car.model}
            </div>
            <div className="text-sm text-neutral-500">
              Plate: {car.license_plate} · Transponder: {car.transponder_number ?? 'not set'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">${car.base_daily_price}/day</div>
            <div className="text-sm text-neutral-500">{car.is_active ? 'Active' : 'Inactive'}</div>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-accent hover:text-accent-dark font-medium"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      <p className="text-sm font-medium mb-2">Photos</p>
      <CarPhotos carId={car.id} initialPhotos={car.car_photos ?? []} />
      <p className="text-sm font-medium mt-4 mb-2">Default pickup / drop-off</p>
      <CarDefaultLocations
        carId={car.id}
        locations={locations}
        defaultPickupId={car.default_pickup_location_id}
        defaultDropoffId={car.default_dropoff_location_id}
      />
      <p className="text-sm font-medium mt-4 mb-2">Blocked dates</p>
      <CarBlackouts carId={car.id} initialBlackouts={car.car_blackout_dates ?? []} />
    </div>
  );
}
