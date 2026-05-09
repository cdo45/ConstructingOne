import { sql } from "@/lib/db";

export type ReconciliationData = {
  ar_balance_due: number;       // SUM(balance_due) on open invoices, active ar_invoices upload
  ar_retainage: number;         // SUM(retainage) on open invoices
  ar_total_open: number;        // ar_balance_due + ar_retainage
  aging_buckets: number;        // SUM(amount_1..amount_4) on aging detail rows, active upload
  aging_held: number;           // SUM(retainage) on aging detail rows
  aging_released: number;       // SUM(orig_rel_ret_amt) on aging detail rows
  aging_total: number;          // aging_buckets + aging_held + aging_released
  difference: number;           // ar_total_open - aging_total
};

type RawRow = {
  ar_balance_due: string | number | null;
  ar_retainage: string | number | null;
  aging_buckets: string | number | null;
  aging_held: string | number | null;
  aging_released: string | number | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const RECONCILIATION_SQL = `
WITH active_inv AS (
  SELECT id FROM uploads
  WHERE upload_type = 'ar_detail' AND is_active = TRUE
  ORDER BY uploaded_at DESC
  LIMIT 1
),
active_aging AS (
  SELECT id FROM uploads
  WHERE upload_type = 'ar_aging' AND is_active = TRUE
  ORDER BY uploaded_at DESC
  LIMIT 1
),
ar AS (
  SELECT
    COALESCE(SUM(balance_due), 0) AS ar_balance_due,
    COALESCE(SUM(retainage), 0)   AS ar_retainage
  FROM ar_invoices
  WHERE upload_id = (SELECT id FROM active_inv)
    AND is_open = 1
),
ag AS (
  SELECT
    COALESCE(SUM(amount_1 + amount_2 + amount_3 + amount_4), 0) AS aging_buckets,
    COALESCE(SUM(retainage), 0)                                 AS aging_held,
    COALESCE(SUM(orig_rel_ret_amt), 0)                          AS aging_released
  FROM ar_aging
  WHERE upload_id = (SELECT id FROM active_aging)
    AND row_type = 'detail'
)
SELECT
  ar.ar_balance_due,
  ar.ar_retainage,
  ag.aging_buckets,
  ag.aging_held,
  ag.aging_released
FROM ar, ag
`;

export async function getReconciliation(): Promise<ReconciliationData> {
  const rows = (await sql(RECONCILIATION_SQL)) as RawRow[];
  const r = rows[0] ?? {
    ar_balance_due: 0,
    ar_retainage: 0,
    aging_buckets: 0,
    aging_held: 0,
    aging_released: 0,
  };
  const ar_balance_due = num(r.ar_balance_due);
  const ar_retainage = num(r.ar_retainage);
  const ar_total_open = ar_balance_due + ar_retainage;
  const aging_buckets = num(r.aging_buckets);
  const aging_held = num(r.aging_held);
  const aging_released = num(r.aging_released);
  const aging_total = aging_buckets + aging_held + aging_released;
  return {
    ar_balance_due,
    ar_retainage,
    ar_total_open,
    aging_buckets,
    aging_held,
    aging_released,
    aging_total,
    difference: ar_total_open - aging_total,
  };
}
