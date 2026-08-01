'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PhotoUpload from '@/components/photo-upload';

const CHARGE_CATEGORIES = ['gas', 'cleaning', 'damage', 'misc', 'other'];

export default function ReservationRow({
  reservation,
  cars,
  locations,
}: {
  reservation: any;
  cars: { id: string; make: string; model: string; year: number }[];
  locations: { id: string; name: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<{ id: string; stage: string; photo_url: string }[]>(
    reservation.reservation_photos ?? []
  );
  const [paymentStatus, setPaymentStatus] = useState(reservation.payment_status);
  const [paymentMethod, setPaymentMethod] = useState(reservation.payment_method ?? '');
  const [savingPayment, setSavingPayment] = useState(false);

  const [charges, setCharges] = useState<any[]>(reservation.reservation_charges ?? []);
  const [chargeCategory, setChargeCategory] = useState('gas');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [savingCharge, setSavingCharge] = useState(false);

  const [form, setForm] = useState({
    car_id: reservation.car_id,
    start_date: reservation.start_date,
    end_date: reservation.end_date,
    pickup_time: reservation.pickup_time?.slice(0, 5) ?? '10:00',
    dropoff_time: reservation.dropoff_time?.slice(0, 5) ?? '10:00',
    pickup_location_id: reservation.pickup_location_id ?? '',
    dropoff_location_id: reservation.dropoff_location_id ?? '',
    total_price: reservation.total_price,
    status: reservation.status,
  });

  async function handleUploaded(stage: 'pickup' | 'dropoff', url: string) {
    const { data, error } = await supabase
      .from('reservation_photos')
      .insert({ reservation_id: reservation.id, stage, photo_url: url })
      .select()
      .single();
    if (!error && data) setPhotos((prev) => [...prev, data]);
  }

  async function handleDeleted(id: string) {
    const { error } = await supabase.from('reservation_photos').delete().eq('id', id);
    if (!error) setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function updatePayment(field: 'payment_status' | 'payment_method', value: string) {
    if (field === 'payment_status') setPaymentStatus(value);
    else setPaymentMethod(value);

    setSavingPayment(true);
    await supabase
      .from('reservations')
      .update({ [field]: value || null })
      .eq('id', reservation.id);
    setSavingPayment(false);
    router.refresh();
  }

  async function handleAddCharge() {
    if (!chargeAmount) return;
    setSavingCharge(true);
    const { data, error } = await supabase
      .from('reservation_charges')
      .insert({
        reservation_id: reservation.id,
        category: chargeCategory,
        description: chargeDescription || null,
        amount: Number(chargeAmount),
      })
      .select()
      .single();
    setSavingCharge(false);
    if (!error && data) {
      setCharges((prev) => [...prev, data]);
      setChargeDescription('');
      setChargeAmount('');
    }
  }

  async function handleDeleteCharge(id: string) {
    const { error } = await supabase.from('reservation_charges').delete().eq('id', id);
    if (!error) setCharges((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleDelete() {
    if (!window.confirm('Delete this reservation? This cannot be undone.')) return;
    setSavingEdit(true);
    const { error } = await supabase.from('reservations').delete().eq('id', reservation.id);
    setSavingEdit(false);
    if (error) {
      setEditError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleSaveEdit() {
    setSavingEdit(true);
    setEditError(null);
    const { error } = await supabase
      .from('reservations')
      .update({
        car_id: form.car_id,
        start_date: form.start_date,
        end_date: form.end_date,
        pickup_time: form.pickup_time,
        dropoff_time: form.dropoff_time,
        pickup_location_id: form.pickup_location_id || null,
        dropoff_location_id: form.dropoff_location_id || null,
        total_price: Number(form.total_price),
        status: form.status,
      })
      .eq('id', reservation.id);
    setSavingEdit(false);
    if (error) {
      setEditError(
        error.message.includes('no_overlapping_reservations')
          ? 'Those dates overlap another reservation for this car.'
          : error.message
      );
      return;
    }
    setEditing(false);
    router.refresh();
  }

  const pickupPhotos = photos.filter((p) => p.stage === 'pickup');
  const dropoffPhotos = photos.filter((p) => p.stage === 'dropoff');

  return (
    <div className="border border-line rounded-lg p-4 bg-white">
      {editing ? (
        <div className="mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <select
              value={form.car_id}
              onChange={(e) => setForm((f) => ({ ...f, car_id: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.year} {c.make} {c.model}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={form.pickup_time}
              onChange={(e) => setForm((f) => ({ ...f, pickup_time: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={form.dropoff_time}
              onChange={(e) => setForm((f) => ({ ...f, dropoff_time: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              value={form.pickup_location_id}
              onChange={(e) => setForm((f) => ({ ...f, pickup_location_id: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Pickup location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              value={form.dropoff_location_id}
              onChange={(e) => setForm((f) => ({ ...f, dropoff_location_id: e.target.value }))}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Drop-off location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={form.total_price}
              onChange={(e) => setForm((f) => ({ ...f, total_price: e.target.value }))}
              placeholder="Total price"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          {editError && <p className="text-sm text-red-600 mb-2">{editError}</p>}
          <div className="flex gap-2 justify-between flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-neutral-500 px-4 py-2">
                Cancel
              </button>
            </div>
            <button
              onClick={handleDelete}
              disabled={savingEdit}
              className="text-sm text-red-600 hover:text-red-700 px-4 py-2 disabled:opacity-50"
            >
              Delete reservation
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <button onClick={() => setExpanded((v) => !v)} className="text-left flex-1">
            <div className="font-medium">
              {reservation.cars?.make} {reservation.cars?.model} ·{' '}
              {reservation.profiles?.full_name ?? reservation.guest_name ?? 'Unknown renter'}
            </div>
            <div className="text-sm text-neutral-500">
              {reservation.start_date} {reservation.pickup_time} → {reservation.end_date}{' '}
              {reservation.dropoff_time}
            </div>
            {(reservation.pickup_location || reservation.dropoff_location) && (
              <div className="text-xs text-neutral-400">
                {reservation.pickup_location?.name ?? 'Pickup TBD'} →{' '}
                {reservation.dropoff_location?.name ?? 'Drop-off TBD'}
              </div>
            )}
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 capitalize">
              {reservation.status}
            </span>
          </button>
          <div className="text-right">
            <div className="font-medium mb-1">${reservation.total_price}</div>
            <div className="flex items-center gap-1 justify-end">
              <select
                value={paymentStatus}
                onChange={(e) => updatePayment('payment_status', e.target.value)}
                className="text-xs border border-line rounded px-1.5 py-1 capitalize"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
              <select
                value={paymentMethod}
                onChange={(e) => updatePayment('payment_method', e.target.value)}
                className="text-xs border border-line rounded px-1.5 py-1 capitalize"
              >
                <option value="">—</option>
                <option value="zelle">Zelle</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            {savingPayment && <p className="text-[10px] text-neutral-400 mt-0.5">Saving…</p>}
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-accent hover:text-accent-dark font-medium"
              >
                Edit
              </button>
              <Link
                href={`/reservations/${reservation.id}/invoice`}
                className="text-xs text-accent hover:text-accent-dark font-medium"
              >
                View bill
              </Link>
            </div>
          </div>
        </div>
      )}

      {expanded && !editing && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium mb-2">Pickup condition photos</p>
              <PhotoUpload
                bucket="reservation-photos"
                pathPrefix={`reservations/${reservation.id}/pickup`}
                photos={pickupPhotos}
                onUploaded={(url) => handleUploaded('pickup', url)}
                onDeleted={handleDeleted}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Drop-off condition photos</p>
              <PhotoUpload
                bucket="reservation-photos"
                pathPrefix={`reservations/${reservation.id}/dropoff`}
                photos={dropoffPhotos}
                onUploaded={(url) => handleUploaded('dropoff', url)}
                onDeleted={handleDeleted}
              />
            </div>
          </div>

          <p className="text-sm font-medium mb-2">Extra charges (gas, cleaning, damage, misc)</p>
          <div className="space-y-1 mb-2">
            {charges.map((c) => (
              <div
                key={c.id}
                className="text-sm flex justify-between items-center bg-neutral-50 rounded px-2 py-1"
              >
                <span className="capitalize">
                  {c.category} {c.description && `· ${c.description}`}
                </span>
                <div className="flex items-center gap-2">
                  <span>${Number(c.amount).toFixed(2)}</span>
                  <button
                    onClick={() => handleDeleteCharge(c.id)}
                    className="text-neutral-400 hover:text-red-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {charges.length === 0 && <p className="text-sm text-neutral-400">No extra charges yet.</p>}
          </div>
          <div className="flex gap-2 items-end">
            <select
              value={chargeCategory}
              onChange={(e) => setChargeCategory(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm capitalize"
            >
              {CHARGE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
            <input
              placeholder="Description (optional)"
              value={chargeDescription}
              onChange={(e) => setChargeDescription(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm flex-1"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm w-24"
            />
            <button
              onClick={handleAddCharge}
              disabled={savingCharge}
              className="bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-3 py-2 rounded disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
