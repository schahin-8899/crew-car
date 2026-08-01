'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteLocationButton({ id }: { id: string }) {
  const supabase = createClient();
  const router = useRouter();

  async function handleDelete() {
    await supabase.from('locations').delete().eq('id', id);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-neutral-400 hover:text-red-600 text-xs">
      Remove
    </button>
  );
}
