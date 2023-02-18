/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  serverRuntimeConfig: {
    publicDir: `${__dirname}/public`,
  },
}

module.exports = nextConfig
