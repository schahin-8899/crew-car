'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LocationPhoto from './location-photo';
import DeleteLocationButton from './delete-location-button';

export default function LocationItem({ location }: { location: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: location.name,
    address: location.address,
    is_active: location.is_active,
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('locations')
      .update({ name: form.name, address: form.address, is_active: form.is_active })
      .eq('id', location.id);
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
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Address"
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
            <button onClick={() => setEditing(false)} className="text-sm text-neutral-500 px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start mb-3 gap-3 flex-wrap">
          <div>
            <div className="font-medium">{location.name}</div>
            <div className="text-sm text-neutral-500">{location.address}</div>
            <div className="text-xs text-neutral-400">{location.is_active ? 'Active' : 'Inactive'}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-accent hover:text-accent-dark font-medium"
            >
              Edit
            </button>
            <DeleteLocationButton id={location.id} />
          </div>
        </div>
      )}
      <p className="text-sm font-medium mb-2">Photo / map</p>
      <LocationPhoto locationId={location.id} photoUrl={location.photo_url} />
    </div>
  );
}
