'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TollItem({
  toll,
  reservations,
}: {
  toll: any;
  reservations: { id: string; label: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chargedAt = new Date(toll.charged_at);
  const [form, setForm] = useState({
    reservation_id: toll.reservation_id ?? '',
    toll_plaza: toll.toll_plaza ?? '',
    amount: toll.amount,
    date: chargedAt.toISOString().slice(0, 10),
    time: chargedAt.toISOString().slice(11, 16),
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('toll_charges')
      .update({
        reservation_id: form.reservation_id || null,
        toll_plaza: form.toll_plaza || null,
        amount: Number(form.amount),
        charged_at: new Date(`${form.date}T${form.time}`).toISOString(),
        matched: !!form.reservation_id,
      })
      .eq('id', toll.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    await supabase.from('toll_charges').delete().eq('id', toll.id);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="border border-line rounded-lg p-3 bg-white text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <select
            value={form.reservation_id}
            onChange={(e) => setForm((f) => ({ ...f, reservation_id: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm col-span-1 sm:col-span-2"
          >
            <option value="">No reservation match</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            value={form.toll_plaza}
            onChange={(e) => setForm((f) => ({ ...f, toll_plaza: e.target.value }))}
            placeholder="Plaza"
            className="border rounded px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Amount"
            className="border rounded px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm"
          />
        </div>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-white hover:bg-accent-dark transition-colors px-3 py-2 rounded disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="text-neutral-500 px-3 py-2">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`text-sm border rounded px-3 py-2 flex justify-between items-center gap-3 flex-wrap ${
        toll.reservation_id ? 'border-line bg-white' : 'border-amber-300 bg-amber-50'
      }`}
    >
      <span>
        {toll.toll_plaza || 'Unknown plaza'} · {chargedAt.toLocaleString()}
        {!toll.reservation_id && <span className="text-amber-600"> · unmatched</span>}
      </span>
      <div className="flex items-center gap-3">
        <span>${Number(toll.amount).toFixed(2)}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-accent hover:text-accent-dark font-medium"
        >
          Edit
        </button>
        <button onClick={handleDelete} className="text-neutral-400 hover:text-red-600 text-xs">
          Remove
        </button>
      </div>
    </div>
  );
}
