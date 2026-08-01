import { calculateTotalPrice, PricingRule } from './pricing';

export type DayStatus = 'available' | 'booked' | 'blackout';

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  inMonth: boolean;
  status: DayStatus;
  label?: string; // renter/guest name or blackout reason
  price: number;
};

type ReservationRange = {
  start_date: string;
  end_date: string;
  guest_name: string | null;
  profiles?: { full_name: string | null } | null;
};

type BlackoutRange = { start_date: string; end_date: string; reason: string | null };

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isWithin(dateStr: string, start: string, end: string) {
  return dateStr >= start && dateStr <= end;
}

// Builds a 6-week grid (42 days) for the given month, starting on Sunday,
// with each day's booking/blackout status and effective price.
export function getMonthCalendar(
  year: number,
  month: number, // 0-11
  basePrice: number,
  reservations: ReservationRange[],
  blackouts: BlackoutRange[],
  pricingRules: PricingRule[],
  carId: string
): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startOffset = firstOfMonth.getUTCDay(); // 0 = Sunday
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - startOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    const dateStr = toDateOnly(d);
    const inMonth = d.getUTCMonth() === month;

    const reservation = reservations.find((r) => isWithin(dateStr, r.start_date, r.end_date));
    const blackout = blackouts.find((b) => isWithin(dateStr, b.start_date, b.end_date));

    let status: DayStatus = 'available';
    let label: string | undefined;
    if (reservation) {
      status = 'booked';
      label = reservation.profiles?.full_name ?? reservation.guest_name ?? 'Reserved';
    } else if (blackout) {
      status = 'blackout';
      label = blackout.reason ?? 'Blocked';
    }

    const price = calculateTotalPrice(basePrice, carId, dateStr, dateStr, pricingRules);

    days.push({ date: dateStr, dayOfMonth: d.getUTCDate(), inMonth, status, label, price });
  }

  return days;
}
