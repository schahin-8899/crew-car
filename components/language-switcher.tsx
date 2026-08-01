'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

// Sets a `locale` cookie and reloads the current route so the server
// re-renders with the new language. Simple and works on every page,
// including /admin, without needing a [locale] URL segment.
export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function switchTo(next: 'en' | 'es') {
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex gap-2 text-sm">
      <button
        onClick={() => switchTo('en')}
        className={locale === 'en' ? 'font-medium' : 'text-neutral-400'}
      >
        EN
      </button>
      <span className="text-neutral-300">/</span>
      <button
        onClick={() => switchTo('es')}
        className={locale === 'es' ? 'font-medium' : 'text-neutral-400'}
      >
        ES
      </button>
    </div>
  );
}
