'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewPricingRuleForm({
  cars,
}: {
  cars: { id: string; make: string; model: string; year: number }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [carId, setCarId] = useState(''); // '' = all cars
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priceType, setPriceType] = useState<'override' | 'multiplier'>('override');
  const [priceValue, setPriceValue] = useState('');
  const [priority, setPriority] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !startDate || !endDate || !priceValue) {
      setError('Name, dates, and a price are required.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('pricing_rules').insert({
      car_id: carId || null,
      name,
      start_date: startDate,
      end_date: endDate,
      price_override: priceType === 'override' ? Number(priceValue) : null,
      price_multiplier: priceType === 'multiplier' ? Number(priceValue) : null,
      priority: Number(priority),
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setName('');
    setStartDate('');
    setEndDate('');
    setPriceValue('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white">
      <h2 className="font-medium mb-3">Add a pricing rule</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          placeholder="Rule name (e.g. Thanksgiving surcharge)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 text-sm col-span-2"
        />
        <select value={carId} onChange={(e) => setCarId(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All cars</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} {c.make} {c.model}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Priority (higher wins)"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <label className="text-sm">
          From
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mt-1"
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mt-1"
          />
        </label>
        <select
          value={priceType}
          onChange={(e) => setPriceType(e.target.value as any)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="override">Flat price per day ($)</option>
          <option value="multiplier">Multiplier (e.g. 1.25 = +25%)</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder={priceType === 'override' ? 'e.g. 65.00' : 'e.g. 1.25'}
          value={priceValue}
          onChange={(e) => setPriceValue(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add rule'}
      </button>
    </form>
  );
}
