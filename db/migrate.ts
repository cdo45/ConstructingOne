import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const url = (process.env.DATABASE_URL || "").replace(
  /[?&]channel_binding=require/g,
  ""
);
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(url);

async function main() {
  const dir = join(__dirname, "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const text = readFileSync(join(dir, file), "utf8");
    console.log(`Running migration: ${file}`);
    // Naive split on trailing semicolons — fine for our migration SQL,
    // which has no semicolons inside string literals.
    const statements = text
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      // 0.10.x exposes raw-SQL execution via the callable form `sql(text, params)`,
      // not `sql.query()` (which doesn't exist on this version).
      await sql(stmt);
    }
  }
  console.log("Migrations complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
