/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@constructingone/ui"],
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "@prisma/client", "bcryptjs"]
  }
};

module.exports = nextConfig;
