import { createClient } from '@/lib/supabase/server';
import CalendarView from './calendar-view';

export default async function AdminCalendarPage() {
  const supabase = createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select('id, make, model, year, base_daily_price')
    .eq('is_active', true);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-4">Calendar</h1>
      <CalendarView cars={cars ?? []} />
    </div>
  );
}
