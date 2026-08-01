'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { calculateTotalPrice } from '@/lib/pricing';
import AvailabilityCalendar from './availability-calendar';

type Props = {
  car: any;
  locations: any[];
  pricingRules: any[];
  bookedRanges: { start_date: string; end_date: string }[];
  blackoutRanges: { start_date: string; end_date: string }[];
  renterId: string;
  defaultPickupId?: string | null;
  defaultDropoffId?: string | null;
};

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) <= new Date(bEnd) && new Date(bStart) <= new Date(aEnd);
}

export default function BookingForm({
  car,
  locations,
  pricingRules,
  bookedRanges,
  blackoutRanges,
  renterId,
  defaultPickupId,
  defaultDropoffId,
}: Props) {
  const t = useTranslations('book');
  const supabase = createClient();
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [pickupLocation, setPickupLocation] = useState(defaultPickupId ?? '');
  const [dropoffLocation, setDropoffLocation] = useState(defaultDropoffId ?? '');
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'cash'>('zelle');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculateTotalPrice(car.base_daily_price, car.id, startDate, endDate, pricingRules, pickupTime, dropoffTime);
  }, [startDate, endDate, pickupTime, dropoffTime, car, pricingRules]);

  const overlapsExisting =
    startDate &&
    endDate &&
    bookedRanges.some((r) => rangesOverlap(startDate, endDate, r.start_date, r.end_date));

  const overlapsBlackout =
    startDate &&
    endDate &&
    blackoutRanges.some((r) => rangesOverlap(startDate, endDate, r.start_date, r.end_date));

  const isBlocked = overlapsExisting || overlapsBlackout;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (isBlocked) {
      setError(t('datesUnavailable'));
      return;
    }
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      setError(t('datesUnavailable'));
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('reservations').insert({
      car_id: car.id,
      renter_id: renterId,
      pickup_location_id: pickupLocation || null,
      dropoff_location_id: dropoffLocation || null,
      start_date: startDate,
      end_date: endDate,
      pickup_time: pickupTime,
      dropoff_time: dropoffTime,
      total_price: total,
      payment_method: paymentMethod,
      payment_status: 'pending',
    });

    setSaving(false);
    if (error) {
      // The database's exclusion constraint also blocks overlapping
      // reservations at the DB level, in case of a race condition.
      setError(
        error.message.includes('no_overlapping_reservations') ? t('datesUnavailable') : error.message
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  if (success) {
    return <p className="text-sm text-green-700">{t('confirmed')}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <AvailabilityCalendar
        carId={car.id}
        basePrice={car.base_daily_price}
        bookedRanges={bookedRanges}
        blackoutRanges={blackoutRanges}
        pricingRules={pricingRules}
        startDate={startDate}
        endDate={endDate}
        onSelectStart={setStartDate}
        onSelectEnd={setEndDate}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          {t('pickupTime')}
          <input
            type="time"
            required
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mt-1"
          />
        </label>
        <label className="text-sm">
          {t('dropoffTime')}
          <input
            type="time"
            required
            value={dropoffTime}
            onChange={(e) => setDropoffTime(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mt-1"
          />
        </label>
      </div>

      {locations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            {t('pickupLocation')}
            <select
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mt-1"
            >
              <option value="">{t('selectLocation')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {locations.find((l) => l.id === pickupLocation)?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={locations.find((l) => l.id === pickupLocation)?.photo_url}
                alt=""
                className="mt-2 w-full aspect-video object-cover rounded"
              />
            )}
          </label>
          <label className="text-sm">
            {t('dropoffLocation')}
            <select
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mt-1"
            >
              <option value="">{t('selectLocation')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {locations.find((l) => l.id === dropoffLocation)?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={locations.find((l) => l.id === dropoffLocation)?.photo_url}
                alt=""
                className="mt-2 w-full aspect-video object-cover rounded"
              />
            )}
          </label>
        </div>
      )}

      <label className="text-sm block">
        {t('paymentMethod')}
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'zelle' | 'cash')}
          className="w-full border rounded px-3 py-2 text-sm mt-1"
        >
          <option value="zelle">{t('zelle')}</option>
          <option value="cash">{t('cash')}</option>
        </select>
      </label>

      {isBlocked && <p className="text-sm text-amber-600">{t('datesUnavailable')}</p>}

      <div className="flex justify-between items-center pt-2 border-t">
        <span className="text-sm text-neutral-500">{t('total')}</span>
        <span className="font-medium text-lg">${total.toFixed(2)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || !!isBlocked || !startDate || !endDate}
        className="w-full bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? t('confirming') : t('confirm')}
      </button>
      <p className="text-xs text-neutral-500 text-center">{t('paymentInstructions')}</p>
    </form>
  );
}
