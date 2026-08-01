'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewCarForm() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from('cars').insert({
      make: form.get('make'),
      model: form.get('model'),
      year: Number(form.get('year')),
      license_plate: form.get('license_plate'),
      transponder_number: form.get('transponder_number') || null,
      base_daily_price: Number(form.get('base_daily_price')),
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white">
      <h2 className="font-medium mb-3">Add a car</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="make" placeholder="Make" required className="border rounded px-3 py-2 text-sm" />
        <input name="model" placeholder="Model" required className="border rounded px-3 py-2 text-sm" />
        <input
          name="year"
          type="number"
          placeholder="Year"
          required
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          name="license_plate"
          placeholder="License plate"
          required
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          name="transponder_number"
          placeholder="SunPass transponder # (optional)"
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          name="base_daily_price"
          type="number"
          step="0.01"
          placeholder="Base daily price"
          required
          className="border rounded px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add car'}
      </button>
    </form>
  );
}
