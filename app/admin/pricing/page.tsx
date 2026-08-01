import { createClient } from '@/lib/supabase/server';
import NewPricingRuleForm from './new-pricing-rule-form';
import PricingRuleItem from './pricing-rule-item';

export default async function AdminPricingPage() {
  const supabase = createClient();

  const { data: cars } = await supabase.from('cars').select('id, make, model, year');
  const { data: rules } = await supabase
    .from('pricing_rules')
    .select('*, cars ( make, model, year )')
    .order('start_date', { ascending: true });

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-4">Pricing</h1>
      <p className="text-sm text-neutral-600 mb-4">
        Set a different price for specific dates — a holiday surcharge, a discount for slow weeks,
        or a one-off rate for a particular car. Rules with a higher priority win if more than one
        applies to the same day.
      </p>

      <NewPricingRuleForm cars={cars ?? []} />

      <div className="mt-6 space-y-2">
        {rules?.map((rule: any) => (
          <PricingRuleItem key={rule.id} rule={rule} cars={cars ?? []} />
        ))}
        {rules?.length === 0 && <p className="text-sm text-neutral-500">No pricing rules yet.</p>}
      </div>
    </div>
  );
}
