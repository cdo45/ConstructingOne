/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "@prisma/client", "bcryptjs"]
  }
};

module.exports = nextConfig;
