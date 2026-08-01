// Computes the total price for a reservation, applying any pricing_rules
// that overlap the requested date range (day-of-week or explicit date
// range rules), highest priority first.

export type PricingRule = {
  car_id: string | null;
  start_date: string | null;
  end_date: string | null;
  day_of_week: number | null;
  price_override: number | null;
  price_multiplier: number | null;
  priority: number;
};

function ruleAppliesToDate(rule: PricingRule, date: Date): boolean {
  if (rule.day_of_week !== null && date.getDay() !== rule.day_of_week) {
    return false;
  }
  if (rule.start_date && new Date(rule.start_date) > date) return false;
  if (rule.end_date && new Date(rule.end_date) < date) return false;
  return true;
}

function priceForDay(
  baseDailyPrice: number,
  date: Date,
  carId: string,
  rules: PricingRule[]
): number {
  const applicable = rules
    .filter((r) => (r.car_id === null || r.car_id === carId) && ruleAppliesToDate(r, date))
    .sort((a, b) => b.priority - a.priority);

  if (applicable.length === 0) return baseDailyPrice;

  const winningRule = applicable[0];
  if (winningRule.price_override !== null) return winningRule.price_override;
  if (winningRule.price_multiplier !== null) {
    return baseDailyPrice * winningRule.price_multiplier;
  }
  return baseDailyPrice;
}

export function calculateTotalPrice(
  baseDailyPrice: number,
  carId: string,
  startDate: string,
  endDate: string,
  rules: PricingRule[],
  pickupTime: string = '00:00',
  dropoffTime: string = '00:00'
): number {
  const start = new Date(`${startDate}T${pickupTime}`);
  const end = new Date(`${endDate}T${dropoffTime}`);

  // Billing is by elapsed time, not calendar days: any amount of time
  // over a 24-hour block bills as another day (25 hours = 2 days,
  // 49 hours = 3 days), matching how the business actually charges.
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const billedDays = Math.max(1, Math.ceil(hours / 24));

  let total = 0;
  for (let d = 0; d < billedDays; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);
    total += priceForDay(baseDailyPrice, day, carId, rules);
  }

  return Math.round(total * 100) / 100;
}
