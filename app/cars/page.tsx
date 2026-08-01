import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export default async function CarsPage() {
  const t = await getTranslations('carsList');
  const supabase = createClient();
  const { data: cars } = await supabase
    .from('cars')
    .select('*, car_photos ( photo_url )')
    .eq('is_active', true)
    .order('base_daily_price', { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink mb-1">
        {t('title')}
      </h1>
      <p className="text-sm text-neutral-500 mb-6">{t('subtitle')}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {cars?.map((car: any) => (
          <Link
            key={car.id}
            href={`/cars/${car.id}/book`}
            className="group block border border-line rounded-2xl bg-white overflow-hidden hover:shadow-md hover:border-accent/40 transition-all"
          >
            <div className="aspect-video bg-accent-light overflow-hidden">
              {car.car_photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={car.car_photos[0].photo_url}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-accent-dark/40 text-sm">
                  {t('noPhoto')}
                </div>
              )}
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="font-medium text-ink">
                {car.year} {car.make} {car.model}
              </div>
              <div className="font-display font-medium text-accent-dark">
                ${car.base_daily_price}
                <span className="text-xs text-neutral-400">{t('perDay')}</span>
              </div>
            </div>
          </Link>
        ))}
        {cars?.length === 0 && <p className="text-sm text-neutral-500 col-span-2">{t('noCars')}</p>}
      </div>
    </div>
  );
}
