'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const t = useTranslations('auth');
  const supabase = createClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signUp({
      email: String(form.get('email')),
      password: String(form.get('password')),
      options: {
        data: { full_name: form.get('full_name') },
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    // A profile row is created automatically by the on_auth_user_created
    // trigger. Supabase may require email confirmation depending on your
    // project's auth settings — adjust this redirect if so.
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-xl font-medium mb-6 text-ink">{t('signup')}</h1>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="full_name"
              placeholder={t('fullName')}
              required
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <input
              name="email"
              type="email"
              placeholder={t('email')}
              required
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <input
              name="password"
              type="password"
              placeholder={t('password')}
              required
              minLength={6}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white hover:bg-accent-dark transition-colors text-sm px-4 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? t('creatingAccount') : t('signUp')}
            </button>
          </form>
        </div>
        <p className="text-sm text-neutral-500 mt-4 text-center">
          {t('haveAccount')}{' '}
          <Link href="/login" className="text-accent hover:text-accent-dark font-medium">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
