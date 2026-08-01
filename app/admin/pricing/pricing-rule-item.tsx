'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PricingRuleItem({
  rule,
  cars,
}: {
  rule: any;
  cars: { id: string; make: string; model: string; year: number }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: rule.name,
    car_id: rule.car_id ?? '',
    start_date: rule.start_date ?? '',
    end_date: rule.end_date ?? '',
    priceType: rule.price_override !== null ? 'override' : 'multiplier',
    priceValue: rule.price_override ?? rule.price_multiplier ?? '',
    priority: rule.priority,
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('pricing_rules')
      .update({
        name: form.name,
        car_id: form.car_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        price_override: form.priceType === 'override' ? Number(form.priceValue) : null,
        price_multiplier: form.priceType === 'multiplier' ? Number(form.priceValue) : null,
        priority: Number(form.priority),
      })
      .eq('id', rule.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    await supabase.from('pricing_rules').delete().eq('id', rule.id);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="border border-line rounded-lg p-3 bg-white text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Rule name"
            className="border rounded px-2 py-1.5 text-sm col-span-1 sm:col-span-2"
          />
          <select
            value={form.car_id}
            onChange={(e) => setForm((f) => ({ ...f, car_id: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">All cars</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.year} {c.make} {c.model}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            placeholder="Priority"
            className="border rounded px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm"
          />
          <select
            value={form.priceType}
            onChange={(e) => setForm((f) => ({ ...f, priceType: e.target.value }))}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="override">Flat price per day ($)</option>
            <option value="multiplier">Multiplier</option>
          </select>
          <input
            type="number"
            step="0.01"
            value={form.priceValue}
            onChange={(e) => setForm((f) => ({ ...f, priceValue: e.target.value }))}
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
    <div className="border border-line rounded-lg p-3 bg-white flex justify-between items-center text-sm gap-3 flex-wrap">
      <div>
        <div className="font-medium">{rule.name}</div>
        <div className="text-neutral-500">
          {rule.cars ? `${rule.cars.year} ${rule.cars.make} ${rule.cars.model}` : 'All cars'}
          {rule.start_date && ` · ${rule.start_date} → ${rule.end_date}`}
          {rule.day_of_week !== null && ` · ${DAY_NAMES[rule.day_of_week]}s`}
          {' · '}
          {rule.price_override !== null ? `$${rule.price_override}/day` : `×${rule.price_multiplier}`}
          {' · priority '}
          {rule.priority}
        </div>
      </div>
      <div className="flex gap-3">
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
