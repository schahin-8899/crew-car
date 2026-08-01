import './globals.css';
import Link from 'next/link';
import { Space_Grotesk, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import LanguageSwitcher from '@/components/language-switcher';
import LogoutButton from '@/components/logout-button';
import { getCurrentProfile } from '@/lib/supabase/server';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata = {
  title: 'Crew Car',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  const locale = await getLocale();
  const profile = await getCurrentProfile();

  return (
    <html lang={locale} className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-line bg-white no-print">
            <Link
              href="/cars"
              className="font-display font-medium text-ink hover:text-accent transition-colors"
            >
              Crew Car
            </Link>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/cars" className="text-sm text-neutral-500 hover:text-ink transition-colors">
                Browse cars
              </Link>
              {profile && !profile.is_admin && (
                <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-ink transition-colors">
                  My reservations
                </Link>
              )}
              {profile?.is_admin && (
                <Link href="/admin" className="text-sm text-neutral-500 hover:text-ink transition-colors">
                  Admin
                </Link>
              )}
              {profile && <LogoutButton />}
              <LanguageSwitcher />
            </div>
          </div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
