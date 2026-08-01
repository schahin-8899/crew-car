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
    const carExpenses = expenses
      .filter((e) => e.car_id === car.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      carId: car.id,
      label: `${car.year} ${car.make} ${car.model}`,
      rentedDays,
      billed,
      paid,
      expenses: carExpenses,
      netProfit: paid - carExpenses,
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
    monthDefs.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
  }

  return cars.map((car) => {
    const carReservations = reservations.filter((r) => r.car_id === car.id);
    const carExpenses = expenses.filter((e) => e.car_id === car.id);

    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    const points = monthDefs.map(({ key, label }) => {
      const monthRevenue = carReservations
        .filter((r) => r.start_date.slice(0, 7) === key)
        .reduce((sum, r) => sum + Number(r.total_price), 0);
      const monthPaid = carReservations
        .filter((r) => r.start_date.slice(0, 7) === key && r.payment_status === 'paid')
        .reduce((sum, r) => sum + Number(r.total_price), 0);
      const monthExpenses = carExpenses
        .filter((e) => e.expense_date?.slice(0, 7) === key)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      cumulativeRevenue += monthRevenue;
      cumulativeProfit += monthPaid - monthExpenses;
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

export type MonthlyFinancials = { label: string; revenue: number; profit: number };

export function monthlyFinancials(
  reservations: Reservation[],
  expenses: Expense[],
  monthsBack = 12
): MonthlyFinancials[] {
  const now = new Date();
  const months: { label: string; key: string; revenue: number; paid: number; expenses: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ label, key, revenue: 0, paid: 0, expenses: 0 });
  }

  for (const r of reservations) {
    // r.start_date is a plain "YYYY-MM-DD" string. Parsing it with
    // `new Date(str)` treats it as UTC midnight, which can shift to the
    // previous day (and sometimes previous month) once converted to the
    // server's local timezone — silently dropping revenue from this
    // chart. Pull the year/month directly from the string instead.
    const key = r.start_date.slice(0, 7);
    const bucket = months.find((m) => m.key === key);
    if (!bucket) continue;
    bucket.revenue += Number(r.total_price);
    if (r.payment_status === 'paid') bucket.paid += Number(r.total_price);
  }

  for (const e of expenses) {
    if (!e.expense_date) continue;
    const key = e.expense_date.slice(0, 7);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.expenses += Number(e.amount);
  }

  return months.map(({ label, revenue, paid, expenses }) => ({
    label,
    revenue,
    profit: paid - expenses,
  }));
}
