import { neon } from "@neondatabase/serverless";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  throw new Error("DATABASE_URL is not set");
}

// channel_binding=require breaks the @neondatabase/serverless driver
// in some Vercel runtimes — strip it programmatically before connecting.
const url = rawUrl.replace(/[?&]channel_binding=require/g, "");

export const sql = neon(url);
