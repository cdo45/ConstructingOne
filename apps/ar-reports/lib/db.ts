import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Module load runs during Vercel's "Collecting page data" build phase, before
// runtime env vars are available. Defer connection creation until the first
// query so the build doesn't crash when DATABASE_URL is absent.

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is not set");
  // channel_binding=require breaks the @neondatabase/serverless driver
  // in some Vercel runtimes — strip it before connecting.
  const url = rawUrl.replace(/[?&]channel_binding=require/g, "");
  _sql = neon(url);
  return _sql;
}

// Re-export `sql` as a Proxy so callers keep the same `sql(text, params)` /
// `sql\`...\`` / `sql.transaction(...)` API. The Proxy lazily resolves the
// underlying neon function on first use.
export const sql = new Proxy(
  (() => {
    /* unused target */
  }) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args: unknown[]) {
      const fn = getSql();
      return (fn as unknown as (...a: unknown[]) => unknown)(...args);
    },
    get(_target, prop) {
      const fn = getSql();
      return (fn as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);
