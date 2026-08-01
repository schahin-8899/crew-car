import { createClient } from '@/lib/supabase/server';
import {
  summarizeByCar,
  monthlyFinancials,
  carRunningTotals,
  countRentalDays,
  monthlySnapshot,
} from '@/lib/stats';
import RunningTotalChart from '@/components/running-total-chart';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const { data: cars } = await supabase.from('cars').select('id, make, model, year');
  const { data: reservations } = await supabase
    .from('reservations')
    .select('car_id, start_date, end_date, total_price, payment_status')
    .neq('status', 'cancelled');
  const { data: expenses } = await supabase.from('car_expenses').select('car_id, amount, expense_date');

  const carList = cars ?? [];
  const reservationList = (reservations as any[]) ?? [];
  const expenseList = (expenses as any[]) ?? [];

  const totalRentedDays = reservationList.reduce(
    (sum, r) => sum + countRentalDays(r.start_date, r.end_date),
    0
  );
  const totalBilled = reservationList.reduce((sum, r) => sum + Number(r.total_price), 0);
  const totalPaid = reservationList
    .filter((r) => r.payment_status === 'paid')
    .reduce((sum, r) => sum + Number(r.total_price), 0);
  const totalOutstanding = totalBilled - totalPaid;
  const totalExpenses = expenseList.reduce((sum, e) => sum + Number(e.amount), 0);

  const carSummaries = summarizeByCar(carList, reservationList, expenseList);
  const monthly = monthlyFinancials(reservationList, expenseList);
  const runningTotals = carRunningTotals(carList, reservationList, expenseList);
  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));
  const maxProfitMagnitude = Math.max(1, ...monthly.map((m) => Math.abs(m.profit)));

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const thisMonth = monthlySnapshot(reservationList, expenseList, currentMonthKey);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink mb-4">Dashboard</h1>

      <h2 className="font-medium mb-2">{currentMonthLabel}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Rented days" value={thisMonth.rentedDays.toString()} />
        <StatCard label="Billed" value={`$${thisMonth.billed.toFixed(2)}`} />
        <StatCard label="Collected" value={`$${thisMonth.paid.toFixed(2)}`} />
        <StatCard label="Outstanding" value={`$${thisMonth.outstanding.toFixed(2)}`} />
        <StatCard label="Expenses" value={`$${thisMonth.expenses.toFixed(2)}`} />
        <StatCard label="Net profit" value={`$${thisMonth.profit.toFixed(2)}`} highlight />
      </div>

      <h2 className="font-medium mb-2">All time</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Rented days" value={totalRentedDays.toString()} />
        <StatCard label="Total billed" value={`$${totalBilled.toFixed(2)}`} />
        <StatCard label="Total collected" value={`$${totalPaid.toFixed(2)}`} />
        <StatCard label="Outstanding" value={`$${totalOutstanding.toFixed(2)}`} />
        <StatCard label="Total expenses" value={`$${totalExpenses.toFixed(2)}`} />
        <StatCard label="Net profit" value={`$${(totalBilled - totalExpenses).toFixed(2)}`} />
      </div>

      <h2 className="font-medium mb-2">Revenue by month</h2>
      <div className="border border-line rounded-lg p-4 bg-white mb-6">
        <div className="flex items-end gap-1">
          {monthly.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                {m.revenue > 0 ? `$${m.revenue.toFixed(0)}` : ''}
              </span>
              <div className="w-full h-28 flex items-end">
                <div
                  className="w-full bg-accent rounded-t"
                  style={{ height: `${m.revenue > 0 ? Math.max(2, (m.revenue / maxRevenue) * 100) : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-medium mb-2">Profit by month</h2>
      <div className="border border-line rounded-lg p-4 bg-white mb-6">
        <div className="flex items-end gap-1">
          {monthly.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                {m.profit !== 0 ? `$${m.profit.toFixed(0)}` : ''}
              </span>
              <div className="w-full h-28 flex items-end">
                <div
                  className={`w-full rounded-t ${m.profit < 0 ? 'bg-red-400' : 'bg-accent'}`}
                  style={{
                    height: `${m.profit !== 0 ? Math.max(2, (Math.abs(m.profit) / maxProfitMagnitude) * 100) : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-neutral-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-medium mb-2">Running total by car</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {runningTotals.map((rt) => (
          <RunningTotalChart key={rt.carId} data={rt} />
        ))}
        {runningTotals.length === 0 && <p className="text-sm text-neutral-500">No cars yet.</p>}
      </div>

      <h2 className="font-medium mb-2">By car</h2>
      <div className="border border-line rounded-lg bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-paper text-neutral-500 text-left">
            <tr>
              <th className="p-3 font-medium">Car</th>
              <th className="p-3 font-medium">Rented days</th>
              <th className="p-3 font-medium">Billed</th>
              <th className="p-3 font-medium">Paid</th>
              <th className="p-3 font-medium">Expenses</th>
              <th className="p-3 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {carSummaries.map((c) => (
              <tr key={c.carId} className="border-t border-neutral-100">
                <td className="p-3">{c.label}</td>
                <td className="p-3">{c.rentedDays}</td>
                <td className="p-3">${c.billed.toFixed(2)}</td>
                <td className="p-3">${c.paid.toFixed(2)}</td>
                <td className="p-3">${c.expenses.toFixed(2)}</td>
                <td className="p-3 font-medium">${c.netProfit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {carSummaries.length === 0 && (
          <p className="text-sm text-neutral-500 p-3">No cars yet.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        highlight ? 'border-accent-dark bg-accent text-white' : 'border-line bg-white'
      }`}
    >
      <div className={`text-xs mb-1 ${highlight ? 'text-neutral-300' : 'text-neutral-500'}`}>
        {label}
      </div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}
