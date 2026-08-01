import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Supported languages — add more here later if needed.
export const locales = ['en', 'es'] as const;
export const defaultLocale = 'en' as const;
export const localeCookieName = 'locale';

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get(localeCookieName)?.value;
  const locale = locales.includes(cookieLocale as any) ? cookieLocale! : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
