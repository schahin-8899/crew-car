'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { getMonthCalendar, CalendarDay } from '@/lib/calendar';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Props = {
  carId: string;
  basePrice: number;
  bookedRanges: { start_date: string; end_date: string }[];
  blackoutRanges: { start_date: string; end_date: string }[];
  pricingRules: any[];
  startDate: string;
  endDate: string;
  onSelectStart: (date: string) => void;
  onSelectEnd: (date: string) => void;
};

export default function AvailabilityCalendar({
  carId,
  basePrice,
  bookedRanges,
  blackoutRanges,
  pricingRules,
  startDate,
  endDate,
  onSelectStart,
  onSelectEnd,
}: Props) {
  const t = useTranslations('book');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const todayStr = new Date().toISOString().slice(0, 10);

  const days = getMonthCalendar(year, month, basePrice, bookedRanges, blackoutRanges, pricingRules, carId);

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

  function handleDayClick(day: CalendarDay) {
    if (day.date < todayStr) return;
    if (day.status !== 'available') return;

    if (!startDate || (startDate && endDate)) {
      onSelectStart(day.date);
      onSelectEnd('');
      return;
    }

    if (day.date < startDate) {
      onSelectStart(day.date);
      return;
    }

    onSelectEnd(day.date);
  }

  return (
    <div className="border border-line rounded-2xl p-4 bg-white mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-ink">{MONTH_NAMES[month]} {year}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => changeMonth(-1)} className="text-sm px-3 py-2 border border-line rounded">
            ←
          </button>
          <button type="button" onClick={() => changeMonth(1)} className="text-sm px-3 py-2 border border-line rounded">
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-neutral-400 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected =
            day.inMonth &&
            ((startDate && day.date === startDate) ||
              (endDate && day.date === endDate) ||
              (startDate && endDate && day.date > startDate && day.date < endDate));
          const isPast = day.date < todayStr;
          const isClickable = day.inMonth && day.status === 'available' && !isPast;

          return (
            <button
              type="button"
              key={day.date}
              onClick={() => handleDayClick(day)}
              disabled={!isClickable}
              className={`aspect-square rounded p-1 text-[10px] border flex flex-col justify-between text-left
                ${!day.inMonth ? 'opacity-20' : ''}
                ${isPast ? 'bg-transparent border-transparent' : ''}
                ${!isClickable && day.inMonth && !isPast ? 'bg-neutral-100 border-neutral-200 cursor-not-allowed' : ''}
                ${isClickable && !isSelected ? 'bg-white border-line hover:border-accent cursor-pointer' : ''}
                ${isSelected ? 'bg-accent border-accent-dark' : ''}
              `}
            >
              <span
                className={
                  isSelected
                    ? 'text-white'
                    : isPast
                    ? 'text-neutral-300'
                    : !isClickable && day.inMonth
                    ? 'text-neutral-400'
                    : 'text-ink'
                }
              >
                {day.dayOfMonth}
              </span>
              {day.inMonth && day.status === 'available' && !isPast && (
                <span className={isSelected ? 'text-white' : 'text-accent-dark'}>${day.price.toFixed(0)}</span>
              )}
              {day.inMonth && day.status !== 'available' && !isPast && (
                <span className="text-neutral-400">—</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-3 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-white border border-line inline-block" /> {t('available')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-neutral-100 border border-neutral-200 inline-block" /> {t('unavailable')}
        </span>
      </div>

      {(startDate || endDate) && (
        <p className="text-xs text-neutral-500 mt-2">
          {startDate || '—'} → {endDate || '…'}
        </p>
      )}
    </div>
  );
}
