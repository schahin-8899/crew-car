import { CarRunningTotal } from '@/lib/stats';

const WIDTH = 400;
const HEIGHT = 70;
const PADDING = 4;

function buildLine(values: number[], min: number, max: number) {
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

  // Both lines share one scale (rather than each normalizing to its own
  // min/max) so "zero" sits in the same place for both, and a flat
  // no-activity stretch reads as flat at the baseline instead of
  // floating at an arbitrary height.
  const allValues = [...revenueValues, ...profitValues, 0];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  const revenueLine = buildLine(revenueValues, min, max);
  const profitLine = buildLine(profitValues, min, max);
  const zeroY = HEIGHT - PADDING - ((0 - min) / Math.max(1, max - min)) * (HEIGHT - PADDING * 2);

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
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-16" preserveAspectRatio="none">
        {min < 0 && (
          <line
            x1={PADDING}
            y1={zeroY}
            x2={WIDTH - PADDING}
            y2={zeroY}
            stroke="#E4E0D6"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
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
        {min < 0 && <span className="text-neutral-300">- - dashed gray line = $0</span>}
      </div>
    </div>
  );
}
