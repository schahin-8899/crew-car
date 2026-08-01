'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Row = { date: string; time: string; plaza: string; amount: string };

function emptyRow(): Row {
  return { date: '', time: '12:00', plaza: '', amount: '' };
}

export default function ManualTollForm({
  reservations,
}: {
  reservations: { id: string; label: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [reservationId, setReservationId] = useState('');
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validRows = rows.filter((r) => r.date && r.amount);
    if (validRows.length === 0) {
      setError('Add at least one row with a date and amount.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('toll_charges').insert(
      validRows.map((r) => ({
        reservation_id: reservationId || null,
        transponder_number: 'manual',
        toll_plaza: r.plaza || null,
        charged_at: new Date(`${r.date}T${r.time}`).toISOString(),
        amount: Number(r.amount),
        matched: !!reservationId,
        source_file: 'manual entry',
      }))
    );

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setRows([emptyRow()]);
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white mb-6">
      <h2 className="font-medium mb-3">Add tolls manually</h2>
      <p className="text-sm text-neutral-500 mb-3">
        Pick the reservation these tolls belong to, then add one row per toll — useful for
        entering a batch of dates from a statement at once.
      </p>

      <select
        value={reservationId}
        onChange={(e) => setReservationId(e.target.value)}
        className="border rounded px-3 py-2 text-sm w-full mb-3"
      >
        <option value="">No reservation match (review later)</option>
        {reservations.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      <div className="space-y-2 mb-3">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center border-b border-line pb-2 sm:border-0 sm:pb-0">
            <input
              type="date"
              value={row.date}
              onChange={(e) => updateRow(i, 'date', e.target.value)}
              className="border rounded px-2 py-1.5 text-sm"
            />
            <input
              type="time"
              value={row.time}
              onChange={(e) => updateRow(i, 'time', e.target.value)}
              className="border rounded px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Plaza (optional)"
              value={row.plaza}
              onChange={(e) => updateRow(i, 'plaza', e.target.value)}
              className="border rounded px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={row.amount}
              onChange={(e) => updateRow(i, 'amount', e.target.value)}
              className="border rounded px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              className="text-neutral-400 hover:text-red-600 text-xs disabled:opacity-30 col-span-2 sm:col-span-1 text-right sm:text-left"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="text-sm text-accent hover:text-accent-dark font-medium mb-3"
      >
        + Add another date
      </button>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {success && <p className="text-sm text-accent-dark mb-2">Tolls added.</p>}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving…' : `Add ${rows.filter((r) => r.date && r.amount).length || ''} toll(s)`}
        </button>
      </div>
    </form>
  );
}
