'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Blackout = { id: string; start_date: string; end_date: string; reason: string | null };

export default function CarBlackouts({
  carId,
  initialBlackouts,
}: {
  carId: string;
  initialBlackouts: Blackout[];
}) {
  const supabase = createClient();
  const [blackouts, setBlackouts] = useState(initialBlackouts);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) return;

    const { data, error } = await supabase
      .from('car_blackout_dates')
      .insert({ car_id: carId, start_date: startDate, end_date: endDate, reason: reason || null })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    setBlackouts((prev) => [...prev, data]);
    setStartDate('');
    setEndDate('');
    setReason('');
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('car_blackout_dates').delete().eq('id', id);
    if (!error) setBlackouts((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div>
      <div className="space-y-1 mb-2">
        {blackouts.map((b) => (
          <div key={b.id} className="text-sm flex justify-between items-center bg-paper rounded px-2 py-1 gap-2 flex-wrap">
            <span>
              {b.start_date} → {b.end_date} {b.reason && `· ${b.reason}`}
            </span>
            <button onClick={() => handleDelete(b.id)} className="text-neutral-400 hover:text-red-600 text-xs">
              Remove
            </button>
          </div>
        ))}
        {blackouts.length === 0 && (
          <p className="text-sm text-neutral-400">No blocked dates — car is available whenever it's not booked.</p>
        )}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 items-end">
        <label className="text-xs text-neutral-500">
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block border rounded px-2 py-1 text-sm mt-0.5"
          />
        </label>
        <label className="text-xs text-neutral-500">
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block border rounded px-2 py-1 text-sm mt-0.5"
          />
        </label>
        <input
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <button type="submit" className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-3 py-1.5 rounded">
          Block dates
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
