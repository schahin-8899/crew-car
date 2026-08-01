import { CarRunningTotal } from '@/lib/stats';

const WIDTH = 400;
const HEIGHT = 60;
const PADDING = 4;

function buildLine(values: number[]) {
  const max = Math.max(1, ...values, 0);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const stepX = (WIDTH - PADDING * 2) / Math.max(1, values.length - 1);

  return values
    .map((v, i) => {
      const x = PADDING + i * stepX;
      const y = HEIGHT - PADDING - ((v - min) / range) * (HEIGHT - PADDING * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function RunningTotalChart({ data }: { data: CarRunningTotal }) {
  const revenueValues = data.points.map((p) => p.cumulativeRevenue);
  const profitValues = data.points.map((p) => p.cumulativeProfit);

  const revenueLine = buildLine(revenueValues);
  const profitLine = buildLine(profitValues);

  return (
    <div className="border border-line rounded-lg p-3 bg-white">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-ink">{data.label}</span>
        <div className="text-right text-xs">
          <div className="text-accent-dark font-medium">Rev ${data.finalRevenue.toFixed(2)}</div>
          <div className={data.finalProfit < 0 ? 'text-red-500 font-medium' : 'text-neutral-500'}>
            Profit ${data.finalProfit.toFixed(2)}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-14" preserveAspectRatio="none">
        <polyline points={revenueLine} fill="none" stroke="#1E6F5C" strokeWidth={2} />
        <polyline points={profitLine} fill="none" stroke="#B45309" strokeWidth={2} strokeDasharray="4 3" />
      </svg>
      <div className="flex gap-3 mt-1 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[#1E6F5C] inline-block" /> Revenue
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-[#B45309] inline-block" style={{ borderTop: '1px dashed' }} /> Profit
        </span>
      </div>
    </div>
  );
}
