/** @type {import('next').NextConfig} */
const nextConfig = {};

// Fail fast during build if required env vars are missing
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}. ` +
        `Set it in your Vercel project settings or in .env.local for local development.`
    );
  }
}

module.exports = nextConfig;
