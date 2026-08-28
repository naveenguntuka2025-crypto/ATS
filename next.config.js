/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // bullmq optionally supports Valkey's Glide client; we use standard
    // Redis via ioredis, so this optional peer dep is never actually
    // imported at runtime — silence the "module not found" build warning.
    config.resolve.alias["@valkey/valkey-glide"] = false;
    return config;
  },
};

module.exports = nextConfig;
