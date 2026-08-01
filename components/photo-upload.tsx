'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  bucket: 'car-photos' | 'reservation-photos' | 'expense-receipts' | 'location-photos';
  pathPrefix: string; // e.g. `cars/${carId}` or `reservations/${reservationId}/pickup`
  photos: { id: string; photo_url: string }[];
  onUploaded: (url: string) => void;
  onDeleted?: (id: string) => void;
};

// Supabase Storage keys reject spaces, colons, and other characters that
// are common in phone screenshot/photo filenames (e.g. "Screenshot 2026-08-01
// at 10.45.52 AM.png"). Strip anything that isn't alphanumeric, a dot, or a
// dash/underscore before building the storage path.
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export default function PhotoUpload({ bucket, pathPrefix, photos, onUploaded, onDeleted }: Props) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const path = `${pathPrefix}/${Date.now()}-${sanitizeFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onUploaded(data.publicUrl);
    }

    setUploading(false);
    e.target.value = '';
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {photos.map((p) => (
          <div key={p.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo_url} alt="" className="w-full aspect-square object-cover rounded" />
            {onDeleted && (
              <button
                onClick={() => onDeleted(p.id)}
                className="absolute top-1 right-1 bg-white/90 rounded text-xs px-1.5 py-0.5 opacity-0 group-hover:opacity-100"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        disabled={uploading}
        className="text-sm"
      />
      {uploading && <p className="text-sm text-neutral-500 mt-1">Uploading…</p>}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
