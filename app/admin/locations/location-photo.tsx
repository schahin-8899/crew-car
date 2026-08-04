'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export default function LocationPhoto({
  locationId,
  photoUrl,
}: {
  locationId: string;
  photoUrl: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const path = `locations/${locationId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('location-photos').upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('location-photos').getPublicUrl(path);
    const { error: updateError } = await supabase
      .from('locations')
      .update({ photo_url: data.publicUrl })
      .eq('id', locationId);

    setUploading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function handleRemove() {
    setUploading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('locations')
      .update({ photo_url: null })
      .eq('id', locationId);

    setUploading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {photoUrl && (
        <div className="mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="" className="w-full max-w-xs aspect-video object-cover rounded mb-1" />
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
          >
            Remove photo
          </button>
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="text-sm" />
      {uploading && <p className="text-sm text-neutral-500 mt-1">Uploading…</p>}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
