const withNextIntl = require('next-intl/plugin')(
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = withNextIntl(nextConfig);
