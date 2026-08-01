'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import PhotoUpload from '@/components/photo-upload';

export default function ReservationCard({ reservation }: { reservation: any }) {
  const t = useTranslations('dashboard');
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; stage: string; photo_url: string }[]>(
    reservation.reservation_photos ?? []
  );

  async function handleUploaded(stage: 'pickup' | 'dropoff', url: string) {
    const { data, error } = await supabase
      .from('reservation_photos')
      .insert({ reservation_id: reservation.id, stage, photo_url: url })
      .select()
      .single();
    if (!error && data) setPhotos((prev) => [...prev, data]);
  }

  async function handleDeleted(id: string) {
    const { error } = await supabase.from('reservation_photos').delete().eq('id', id);
    if (!error) setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  const pickupPhotos = photos.filter((p) => p.stage === 'pickup');
  const dropoffPhotos = photos.filter((p) => p.stage === 'dropoff');

  return (
    <div className="border border-line rounded-xl p-4 bg-white shadow-sm">
      <div className="flex justify-between">
        <button onClick={() => setExpanded((v) => !v)} className="text-left flex-1">
          <div className="font-medium text-ink">
            {reservation.cars?.year} {reservation.cars?.make} {reservation.cars?.model}
          </div>
          <div className="text-sm text-neutral-500">
            {reservation.start_date} {reservation.pickup_time} → {reservation.end_date}{' '}
            {reservation.dropoff_time}
          </div>
          {(reservation.pickup_location || reservation.dropoff_location) && (
            <div className="text-xs text-neutral-400">
              {reservation.pickup_location?.name ?? t('pickupTBD')} →{' '}
              {reservation.dropoff_location?.name ?? t('dropoffTBD')}
            </div>
          )}
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent-dark capitalize">
            {reservation.status}
          </span>
        </button>
        <div className="text-right">
          <div className="font-display font-medium text-ink">${reservation.total_price}</div>
          <div className="text-sm text-neutral-500 capitalize">{reservation.payment_status}</div>
          <Link
            href={`/reservations/${reservation.id}/invoice`}
            className="text-xs text-accent hover:text-accent-dark font-medium"
          >
            {t('viewBill')}
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">{t('pickupPhotos')}</p>
            <PhotoUpload
              bucket="reservation-photos"
              pathPrefix={`reservations/${reservation.id}/pickup`}
              photos={pickupPhotos}
              onUploaded={(url) => handleUploaded('pickup', url)}
              onDeleted={handleDeleted}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t('dropoffPhotos')}</p>
            <PhotoUpload
              bucket="reservation-photos"
              pathPrefix={`reservations/${reservation.id}/dropoff`}
              photos={dropoffPhotos}
              onUploaded={(url) => handleUploaded('dropoff', url)}
              onDeleted={handleDeleted}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-accent hover:text-accent-dark font-medium mt-2"
      >
        {expanded ? t('hidePhotos') : t('addPhotos')}
      </button>
    </div>
  );
}
