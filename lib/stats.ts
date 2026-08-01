export function countRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff === 0 ? 1 : diff;
}

type Reservation = {
  car_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  payment_status: string;
};

type Expense = {
  car_id: string | null;
  amount: number;
  expense_date?: string;
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// A reservation's price isn't stored per-day, so when it spans more than
// one calendar month, we spread its total evenly across the nights it
// actually covers and attribute each night's share to the month that
// night falls in. This keeps a July 28 → Aug 3 booking from dumping its
// entire value into July with nothing showing for August.
function splitReservationByMonth(r: Reservation): { key: string; amount: number }[] {
  const start = new Date(r.start_date);
  const end = new Date(r.end_date);
  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const perNight = Number(r.total_price) / nights;

  const totals = new Map<string, number>();

  if (start.getTime() === end.getTime()) {
    const key = monthKey(start);
    totals.set(key, Number(r.total_price));
  } else {
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = monthKey(d);
      totals.set(key, (totals.get(key) ?? 0) + perNight);
    }
  }

  return Array.from(totals.entries()).map(([key, amount]) => ({ key, amount }));
}

export type CarSummary = {
  carId: string;
  label: string;
  rentedDays: number;
  billed: number;
  paid: number;
  expenses: number;
  netProfit: number;
};

export function summarizeByCar(
  cars: { id: string; make: string; model: string; year: number }[],
  reservations: Reservation[],
  expenses: Expense[]
): CarSummary[] {
  return cars.map((car) => {
    const carReservations = reservations.filter((r) => r.car_id === car.id);
    const rentedDays = carReservations.reduce(
      (sum, r) => sum + countRentalDays(r.start_date, r.end_date),
      0
    );
    const billed = carReservations.reduce((sum, r) => sum + Number(r.total_price), 0);
    const paid = carReservations
      .filter((r) => r.payment_status === 'paid')
      .reduce((sum, r) => sum + Number(r.total_price), 0);
    // Same reasoning as carRunningTotals: give this car its share of any
    // company-wide expense so per-car and overall totals reconcile.
    const carSpecificExpenses = expenses
      .filter((e) => e.car_id === car.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const sharedExpenses = expenses
      .filter((e) => e.car_id === null)
      .reduce((sum, e) => sum + Number(e.amount) / Math.max(1, cars.length), 0);
    const carExpenses = carSpecificExpenses + sharedExpenses;

    return {
      carId: car.id,
      label: `${car.year} ${car.make} ${car.model}`,
      rentedDays,
      billed,
      paid,
      expenses: carExpenses,
      // Profit reflects reservations that happened, not whether the
      // payment has been collected yet — billed revenue minus expenses.
      netProfit: billed - carExpenses,
    };
  });
}

export type CarRunningTotal = {
  carId: string;
  label: string;
  points: { month: string; cumulativeRevenue: number; cumulativeProfit: number }[];
  finalRevenue: number;
  finalProfit: number;
};

export function carRunningTotals(
  cars: { id: string; make: string; model: string; year: number }[],
  reservations: Reservation[],
  expenses: Expense[],
  monthsBack = 12
): CarRunningTotal[] {
  const now = new Date();
  const monthDefs: { label: string; key: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthDefs.push({ key: monthKey(d), label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
  }

  return cars.map((car) => {
    const carReservations = reservations.filter((r) => r.car_id === car.id);
    // Expenses tied specifically to this car, plus an even share of any
    // company-wide expenses (car_id null) — otherwise a shared cost like
    // a phone bill or a general supply run would vanish from every car's
    // individual running total while still dragging down the combined
    // "Profit by month" chart, making the two views impossible to
    // reconcile.
    const carSpecificExpenses = expenses.filter((e) => e.car_id === car.id);
    const sharedExpenses = expenses.filter((e) => e.car_id === null);
    const carExpenses = [
      ...carSpecificExpenses,
      ...sharedExpenses.map((e) => ({ ...e, amount: Number(e.amount) / Math.max(1, cars.length) })),
    ];

    const revenueByMonth = new Map<string, number>();
    for (const r of carReservations) {
      for (const { key, amount } of splitReservationByMonth(r)) {
        revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + amount);
      }
    }

    const expensesByMonth = new Map<string, number>();
    for (const e of carExpenses) {
      if (!e.expense_date) continue;
      const key = e.expense_date.slice(0, 7);
      expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + Number(e.amount));
    }

    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    const points = monthDefs.map(({ key, label }) => {
      const monthRevenue = revenueByMonth.get(key) ?? 0;
      const monthExpenses = expensesByMonth.get(key) ?? 0;

      cumulativeRevenue += monthRevenue;
      cumulativeProfit += monthRevenue - monthExpenses;
      return { month: label, cumulativeRevenue, cumulativeProfit };
    });

    return {
      carId: car.id,
      label: `${car.year} ${car.make} ${car.model}`,
      points,
      finalRevenue: cumulativeRevenue,
      finalProfit: cumulativeProfit,
    };
  });
}

// Same reasoning as splitReservationByMonth, but for night-counts instead
// of dollar amounts — used to report "rented days" for a single month
// without double-counting nights that fall in a different month.
function splitReservationDaysByMonth(r: Reservation): { key: string; days: number }[] {
  const start = new Date(r.start_date);
  const end = new Date(r.end_date);

  if (start.getTime() === end.getTime()) {
    return [{ key: monthKey(start), days: 1 }];
  }

  const totals = new Map<string, number>();
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const key = monthKey(d);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  return Array.from(totals.entries()).map(([key, days]) => ({ key, days }));
}

export type MonthSnapshot = {
  rentedDays: number;
  billed: number;
  paid: number;
  outstanding: number;
  expenses: number;
  profit: number;
};

// Full picture for one specific month (e.g. "2026-08") — a reservation
// spanning into or out of that month only contributes its overlapping
// share, consistent with the monthly charts.
export function monthlySnapshot(
  reservations: Reservation[],
  expenses: Expense[],
  targetKey: string
): MonthSnapshot {
  let billed = 0;
  let paid = 0;
  let rentedDays = 0;

  for (const r of reservations) {
    for (const { key, amount } of splitReservationByMonth(r)) {
      if (key !== targetKey) continue;
      billed += amount;
      if (r.payment_status === 'paid') paid += amount;
    }
    for (const { key, days } of splitReservationDaysByMonth(r)) {
      if (key === targetKey) rentedDays += days;
    }
  }

  const monthExpenses = expenses
    .filter((e) => e.expense_date?.slice(0, 7) === targetKey)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    rentedDays,
    billed,
    paid,
    outstanding: billed - paid,
    expenses: monthExpenses,
    profit: billed - monthExpenses,
  };
}

export type MonthlyFinancials = { label: string; revenue: number; profit: number };

export function monthlyFinancials(
  reservations: Reservation[],
  expenses: Expense[],
  monthsBack = 12
): MonthlyFinancials[] {
  const now = new Date();
  const months: { label: string; key: string; revenue: number; expenses: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), key: monthKey(d), revenue: 0, expenses: 0 });
  }

  for (const r of reservations) {
    for (const { key, amount } of splitReservationByMonth(r)) {
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.revenue += amount;
    }
  }

  for (const e of expenses) {
    if (!e.expense_date) continue;
    const key = e.expense_date.slice(0, 7);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.expenses += Number(e.amount);
  }

  // Profit is billed revenue minus expenses for reservations that
  // happened — it does not depend on whether payment has been collected.
  return months.map(({ label, revenue, expenses }) => ({
    label,
    revenue,
    profit: revenue - expenses,
  }));
}
