'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMonthCalendar, CalendarDay } from '@/lib/calendar';

type Car = { id: string; make: string; model: string; year: number; base_daily_price: number };

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView({ cars }: { cars: Car[] }) {
  const supabase = createClient();
  const [carId, setCarId] = useState(cars[0]?.id ?? '');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedCar = cars.find((c) => c.id === carId);

  useEffect(() => {
    if (!carId) return;
    setLoading(true);

    (async () => {
      const [{ data: reservations }, { data: blackouts }, { data: pricingRules }] = await Promise.all([
        supabase
          .from('reservations')
          .select('start_date, end_date, guest_name, profiles ( full_name )')
          .eq('car_id', carId)
          .eq('status', 'confirmed'),
        supabase.from('car_blackout_dates').select('start_date, end_date, reason').eq('car_id', carId),
        supabase.from('pricing_rules').select('*').or(`car_id.eq.${carId},car_id.is.null`),
      ]);

      const basePrice = selectedCar?.base_daily_price ?? 0;
      setDays(
        getMonthCalendar(
          year,
          month,
          basePrice,
          (reservations as any) ?? [],
          blackouts ?? [],
          (pricingRules as any) ?? [],
          carId
        )
      );
      setLoading(false);
    })();
  }, [carId, year, month]);

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <select
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full sm:w-auto"
        >
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} {c.make} {c.model}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="text-sm px-3 py-2 border rounded">
            ←
          </button>
          <span className="text-sm font-medium w-32 text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={() => changeMonth(1)} className="text-sm px-3 py-2 border rounded">
            →
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-2 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-white border inline-block" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" /> Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-neutral-200 border inline-block" /> Blocked
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-neutral-400 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
        {days.map((day) => (
          <div
            key={day.date}
            title={day.label}
            className={`aspect-square rounded p-1 text-xs border flex flex-col justify-between
              ${!day.inMonth ? 'opacity-30' : ''}
              ${day.status === 'booked' ? 'bg-red-100 border-red-300' : ''}
              ${day.status === 'blackout' ? 'bg-neutral-200 border-neutral-300' : ''}
              ${day.status === 'available' ? 'bg-white border-line' : ''}
            `}
          >
            <span>{day.dayOfMonth}</span>
            {day.inMonth && day.status === 'available' && (
              <span className="text-neutral-400">${day.price.toFixed(0)}</span>
            )}
            {day.inMonth && day.label && (
              <span className="truncate text-[10px]">{day.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
