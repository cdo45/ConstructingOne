import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazy init: the build's "Collecting page data" phase loads route modules
// before runtime env is available. Defer the neon() call until the first
// query so the build doesn't throw when DATABASE_URL is unset.

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _sql = neon(url);
  return _sql;
}

const sql = new Proxy(
  (() => {
    /* unused target */
  }) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_t, _this, args: unknown[]) {
      const fn = getSql();
      return (fn as unknown as (...a: unknown[]) => unknown)(...args);
    },
    get(_t, prop) {
      const fn = getSql();
      return (fn as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);

export default sql;
