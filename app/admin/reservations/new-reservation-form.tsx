'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateTotalPrice } from '@/lib/pricing';

type Props = {
  cars: { id: string; make: string; model: string; year: number; base_daily_price: number }[];
  renters: { id: string; full_name: string | null }[];
  locations: { id: string; name: string }[];
  pricingRules: any[];
};

export default function NewReservationForm({ cars, renters, locations, pricingRules }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [carId, setCarId] = useState('');
  const [bookingType, setBookingType] = useState<'existing' | 'guest'>('existing');
  const [renterId, setRenterId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'cash' | 'other'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'partial' | 'paid'>('pending');
  const [priceOverride, setPriceOverride] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCar = cars.find((c) => c.id === carId);

  const calculatedPrice = useMemo(() => {
    if (!selectedCar || !startDate || !endDate) return 0;
    return calculateTotalPrice(
      selectedCar.base_daily_price,
      carId,
      startDate,
      endDate,
      pricingRules,
      pickupTime,
      dropoffTime
    );
  }, [selectedCar, carId, startDate, endDate, pickupTime, dropoffTime, pricingRules]);

  const finalPrice = priceOverride !== '' ? Number(priceOverride) : calculatedPrice;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!carId || !startDate || !endDate) {
      setError('Car and dates are required.');
      return;
    }
    if (bookingType === 'existing' && !renterId) {
      setError('Select a renter, or switch to guest booking.');
      return;
    }
    if (bookingType === 'guest' && !guestName.trim()) {
      setError('Guest name is required.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('reservations').insert({
      car_id: carId,
      renter_id: bookingType === 'existing' ? renterId : null,
      guest_name: bookingType === 'guest' ? guestName.trim() : null,
      guest_phone: bookingType === 'guest' ? guestPhone.trim() || null : null,
      guest_email: bookingType === 'guest' ? guestEmail.trim() || null : null,
      pickup_location_id: pickupLocation || null,
      dropoff_location_id: dropoffLocation || null,
      start_date: startDate,
      end_date: endDate,
      pickup_time: pickupTime,
      dropoff_time: dropoffTime,
      total_price: finalPrice,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
    });

    setSaving(false);
    if (error) {
      setError(
        error.message.includes('no_overlapping_reservations')
          ? 'Those dates overlap an existing reservation for this car.'
          : error.message
      );
      return;
    }

    setCarId('');
    setRenterId('');
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setStartDate('');
    setEndDate('');
    setPriceOverride('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line rounded-lg p-4 bg-white mb-6">
      <h2 className="font-medium mb-3">Create a reservation</h2>
      <div className="flex gap-4 mb-3 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={bookingType === 'existing'}
            onChange={() => setBookingType('existing')}
          />
          Existing renter
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={bookingType === 'guest'}
            onChange={() => setBookingType('guest')}
          />
          Guest (no account)
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Select a car…</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} {c.make} {c.model}
            </option>
          ))}
        </select>

        {bookingType === 'existing' ? (
          <select
            value={renterId}
            onChange={(e) => setRenterId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Select a renter…</option>
            {renters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name ?? r.id}
              </option>
            ))}
          </select>
        ) : (
          <input
            placeholder="Guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        )}

        {bookingType === 'guest' && (
          <>
            <input
              placeholder="Guest phone (optional)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Guest email (optional)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </>
        )}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={dropoffTime}
          onChange={(e) => setDropoffTime(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        {locations.length > 0 && (
          <>
            <select
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
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
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Drop-off location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </>
        )}
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as any)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="cash">Cash</option>
          <option value="zelle">Zelle</option>
          <option value="other">Other</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as any)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <label className="text-sm text-neutral-600">
          Price{' '}
          <input
            type="number"
            step="0.01"
            placeholder={calculatedPrice ? calculatedPrice.toFixed(2) : '0.00'}
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-28 ml-1"
          />
        </label>
        <span className="text-sm text-neutral-400">
          (auto-calculated as ${calculatedPrice.toFixed(2)} — override if needed)
        </span>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-3 bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create reservation'}
      </button>
    </form>
  );
}
