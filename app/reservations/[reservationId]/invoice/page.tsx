import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({
  params,
}: {
  params: { reservationId: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/reservations/${params.reservationId}/invoice`);

  const supabase = createClient();

  // RLS already restricts this to the renter's own reservation, or any
  // reservation if the current user is an admin — so a null result here
  // means "not found or not yours", either way a 404 is the right answer.
  const { data: reservation } = await supabase
    .from('reservations')
    .select(
      `id, start_date, end_date, pickup_time, dropoff_time, total_price, payment_status, payment_method,
       guest_name, guest_email,
       cars ( make, model, year, license_plate ),
       profiles ( full_name, phone ),
       pickup_location:locations!reservations_pickup_location_id_fkey ( name, address, photo_url ),
       dropoff_location:locations!reservations_dropoff_location_id_fkey ( name, address, photo_url )`
    )
    .eq('id', params.reservationId)
    .single();

  if (!reservation) notFound();

  const { data: tolls } = await supabase
    .from('toll_charges')
    .select('charged_at, toll_plaza, amount')
    .eq('reservation_id', params.reservationId)
    .order('charged_at', { ascending: true });

  const { data: extraCharges } = await supabase
    .from('reservation_charges')
    .select('category, description, amount, charge_date')
    .eq('reservation_id', params.reservationId)
    .order('charge_date', { ascending: true });

  const tollTotal = (tolls ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  const extraTotal = (extraCharges ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const grandTotal = Number(reservation.total_price) + tollTotal + extraTotal;
  const renterName =
    (reservation as any).profiles?.full_name ?? (reservation as any).guest_name ?? 'Guest';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8 no-print">
        <Link
          href={profile.is_admin ? '/admin/reservations' : '/dashboard'}
          className="text-sm text-accent hover:text-accent-dark font-medium"
        >
          ← Back
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white border border-line rounded-2xl p-5 sm:p-8 shadow-sm print:shadow-none print:border-none">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="font-display text-xl font-medium tracking-tight text-ink">Invoice</div>
            <div className="text-sm text-neutral-500">Reservation #{reservation.id.slice(0, 8)}</div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${
              reservation.payment_status === 'paid'
                ? 'bg-accent-light text-accent-dark'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {reservation.payment_status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <div className="text-neutral-400 mb-1">Billed to</div>
            <div className="font-medium text-ink">{renterName}</div>
          </div>
          <div>
            <div className="text-neutral-400 mb-1">Vehicle</div>
            <div className="font-medium text-ink">
              {(reservation as any).cars?.year} {(reservation as any).cars?.make}{' '}
              {(reservation as any).cars?.model}
            </div>
            <div className="text-neutral-500">{(reservation as any).cars?.license_plate}</div>
          </div>
          <div>
            <div className="text-neutral-400 mb-1">Pickup</div>
            <div className="text-ink">
              {reservation.start_date} at {reservation.pickup_time}
            </div>
            {(reservation as any).pickup_location && (
              <div className="text-neutral-500">{(reservation as any).pickup_location.name}</div>
            )}
            {(reservation as any).pickup_location?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(reservation as any).pickup_location.photo_url}
                alt=""
                className="mt-2 w-full aspect-video object-cover rounded-lg"
              />
            )}
          </div>
          <div>
            <div className="text-neutral-400 mb-1">Drop-off</div>
            <div className="text-ink">
              {reservation.end_date} at {reservation.dropoff_time}
            </div>
            {(reservation as any).dropoff_location && (
              <div className="text-neutral-500">{(reservation as any).dropoff_location.name}</div>
            )}
            {(reservation as any).dropoff_location?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(reservation as any).dropoff_location.photo_url}
                alt=""
                className="mt-2 w-full aspect-video object-cover rounded-lg"
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm min-w-[300px]">
          <thead>
            <tr className="border-b border-line text-neutral-400">
              <th className="text-left font-medium py-2">Description</th>
              <th className="text-right font-medium py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-2 text-ink">Rental charge</td>
              <td className="py-2 text-right text-ink">${Number(reservation.total_price).toFixed(2)}</td>
            </tr>
            {tolls?.map((t, i) => (
              <tr key={`toll-${i}`} className="border-b border-line">
                <td className="py-2 text-ink">
                  Toll — {t.toll_plaza || 'Unknown plaza'}
                  <span className="text-neutral-400"> · {new Date(t.charged_at).toLocaleDateString()}</span>
                </td>
                <td className="py-2 text-right text-ink">${Number(t.amount).toFixed(2)}</td>
              </tr>
            ))}
            {extraCharges?.map((c, i) => (
              <tr key={`charge-${i}`} className="border-b border-line">
                <td className="py-2 text-ink capitalize">
                  {c.category}
                  {c.description && ` — ${c.description}`}
                  <span className="text-neutral-400"> · {c.charge_date}</span>
                </td>
                <td className="py-2 text-right text-ink">${Number(c.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="font-medium text-ink">Total</span>
          <span className="font-display text-lg font-medium text-ink">${grandTotal.toFixed(2)}</span>
        </div>

        {reservation.payment_method && (
          <p className="text-xs text-neutral-400 mt-6">
            Payment via {reservation.payment_method}.
          </p>
        )}

        {reservation.payment_status !== 'paid' && (
          <div className="mt-4 bg-accent-light rounded-lg p-4 text-sm">
            <div className="font-medium text-accent-dark mb-1">Payment instructions</div>
            <div className="text-neutral-700">Zelle: pavajuan79@gmail.com</div>
            <div className="text-neutral-700">Colombia (llave): 1019127971</div>
          </div>
        )}
      </div>
    </div>
  );
}
