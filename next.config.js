const withNextIntl = require('next-intl/plugin')('./i18n.ts');

// Note: language is switched via a cookie (see lib/locale.ts), not a URL
// prefix, so /admin and other routes don't need a [locale] folder.
/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withNextIntl(nextConfig);
