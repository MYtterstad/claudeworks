/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Externalize native modules so they don't break the client bundle
  serverExternalPackages: ['better-sqlite3', 'next-auth', 'bcryptjs'],
}

export default nextConfig
