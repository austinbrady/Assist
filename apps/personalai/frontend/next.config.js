/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Allow network access for local development
  allowedDevOrigins: ['*'],
}

module.exports = nextConfig

