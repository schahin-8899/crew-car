import { createClient } from '@/lib/supabase/server';
import NewExpenseForm from './new-expense-form';
import DeleteExpenseButton from './delete-expense-button';

export default async function AdminExpensesPage() {
  const supabase = createClient();

  const { data: cars } = await supabase.from('cars').select('id, make, model, year');
  const { data: expenses } = await supabase
    .from('car_expenses')
    .select('*, cars ( make, model, year )')
    .order('expense_date', { ascending: false });

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-4">Expenses</h1>

      <NewExpenseForm cars={cars ?? []} />

      <div className="mt-6 space-y-2">
        {expenses?.map((e: any) => (
          <div
            key={e.id}
            className="border border-line rounded-lg p-3 bg-white flex justify-between items-center text-sm gap-3 flex-wrap"
          >
            <div>
              <div className="font-medium capitalize">
                {e.category} {e.is_recurring && `(${e.recurrence_frequency})`}
              </div>
              <div className="text-neutral-500">
                {e.expense_date} ·{' '}
                {e.cars ? `${e.cars.year} ${e.cars.make} ${e.cars.model}` : 'Company-wide'}
                {e.notes && ` · ${e.notes}`}
              </div>
              {e.receipt_url && (
                <a href={e.receipt_url} target="_blank" className="text-xs underline text-neutral-400">
                  View receipt
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">${Number(e.amount).toFixed(2)}</span>
              <DeleteExpenseButton id={e.id} />
            </div>
          </div>
        ))}
        {expenses?.length === 0 && <p className="text-sm text-neutral-500">No expenses logged yet.</p>}
      </div>
    </div>
  );
}
