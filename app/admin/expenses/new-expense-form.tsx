'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['lease', 'insurance', 'maintenance', 'registration', 'cleaning', 'other'];

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export default function NewExpenseForm({
  cars,
}: {
  cars: { id: string; make: string; model: string; year: number }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [carId, setCarId] = useState('');
  const [category, setCategory] = useState('lease');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amount || !expenseDate) {
      setError('Amount and date are required.');
      return;
    }

    setSaving(true);

    let receiptUrl: string | null = null;
    if (receiptFile) {
      const path = `receipts/${Date.now()}-${sanitizeFilename(receiptFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(path, receiptFile);
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      receiptUrl = supabase.storage.from('expense-receipts').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('car_expenses').insert({
      car_id: carId || null,
      category,
      amount: Number(amount),
      expense_date: expenseDate,
      is_recurring: isRecurring,
      recurrence_frequency: isRecurring ? frequency : null,
      notes: notes || null,
      receipt_url: receiptUrl,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setCarId('');
    setAmount('');
    setExpenseDate('');
    setIsRecurring(false);
    setNotes('');
    setReceiptFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white">
      <h2 className="font-medium mb-3">Add an expense</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={carId} onChange={(e) => setCarId(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">Company-wide</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} {c.make} {c.model}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2 text-sm capitalize"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border rounded px-3 py-2 text-sm col-span-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          Recurring
        </label>
        {isRecurring && (
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        )}
      </div>

      <div className="mt-3">
        <label className="text-sm text-neutral-600 block mb-1">Receipt (optional)</label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add expense'}
      </button>
    </form>
  );
}
