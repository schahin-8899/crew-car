'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseSunPassCsv, matchTollsToReservations } from '@/lib/tolls';

export default function TollUpload() {
  const supabase = createClient();
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const text = await file.text();
      const tolls = parseSunPassCsv(text);

      const { data: cars } = await supabase.from('cars').select('id, transponder_number');
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, car_id, start_date, end_date, pickup_time, dropoff_time');

      const matched = matchTollsToReservations(tolls, cars ?? [], reservations ?? []);
      setPreview(matched.map((m) => ({ ...m, source_file: file.name })));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('toll_charges').insert(
      preview.map((p) => ({
        reservation_id: p.reservation_id,
        transponder_number: p.transponder_number,
        toll_plaza: p.toll_plaza,
        charged_at: p.charged_at,
        amount: p.amount,
        matched: p.reservation_id !== null,
        source_file: p.source_file,
      }))
    );
    setSaving(false);
    if (error) setError(error.message);
    else setPreview([]);
  }

  const unmatchedCount = preview.filter((p) => p.reservation_id === null).length;

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFile} className="mb-4 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      {preview.length > 0 && (
        <>
          <p className="text-sm text-neutral-600 mb-2">
            {preview.length} tolls parsed, {unmatchedCount} unmatched.
          </p>
          <div className="space-y-1 mb-4 max-h-96 overflow-y-auto">
            {preview.map((p, i) => (
              <div
                key={i}
                className={`text-sm border rounded px-3 py-2 flex justify-between ${
                  p.reservation_id ? 'border-line bg-white' : 'border-amber-300 bg-amber-50'
                }`}
              >
                <span>
                  {p.transponder_number} · {p.toll_plaza} ·{' '}
                  {new Date(p.charged_at).toLocaleString()}
                </span>
                <span>${p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save toll charges'}
          </button>
        </>
      )}
    </div>
  );
}
