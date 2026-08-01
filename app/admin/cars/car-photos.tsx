'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PhotoUpload from '@/components/photo-upload';

export default function CarPhotos({
  carId,
  initialPhotos,
}: {
  carId: string;
  initialPhotos: { id: string; photo_url: string }[];
}) {
  const supabase = createClient();
  const [photos, setPhotos] = useState(initialPhotos);

  async function handleUploaded(url: string) {
    const { data, error } = await supabase
      .from('car_photos')
      .insert({ car_id: carId, photo_url: url })
      .select()
      .single();
    if (!error && data) setPhotos((prev) => [...prev, data]);
  }

  async function handleDeleted(id: string) {
    const { error } = await supabase.from('car_photos').delete().eq('id', id);
    if (!error) setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <PhotoUpload
      bucket="car-photos"
      pathPrefix={`cars/${carId}`}
      photos={photos}
      onUploaded={handleUploaded}
      onDeleted={handleDeleted}
    />
  );
}
