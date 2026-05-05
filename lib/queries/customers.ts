import { sql } from "@/lib/db";

export type CustomerStats = {
  customer_no: string;
  customer_name: string | null;
  n_invoices: number;
  lifetime_billed: number;
  open_balance: number;
  median_dtp: number | null;
  avg_dtp: number | null;
  stddev_dtp: number | null;
  p90_dtp: number | null;
  median_due_var: number | null;
  pct_on_time: number | null;
  no_due_date_count: number;
  retainage_held: number;
  retainage_released: number;
  aging_buckets_total: number;
  ar_aging_diff: number;
};

type RawCustomerRow = {
  customer_no: string;
  customer_name: string | null;
  n_invoices: string | number;
  lifetime_billed: string | number | null;
  open_balance: string | number | null;
  median_dtp: string | number | null;
  avg_dtp: string | number | null;
  stddev_dtp: string | number | null;
  p90_dtp: string | number | null;
  median_due_var: string | number | null;
  pct_on_time: string | number | null;
  no_due_date_count: string | number;
  retainage_held: string | number | null;
  retainage_released: string | number | null;
  aging_buckets_total: string | number | null;
  ar_aging_diff: string | number | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapRow(r: RawCustomerRow): CustomerStats {
  return {
    customer_no: r.customer_no,
    customer_name: r.customer_name,
    n_invoices: num(r.n_invoices),
    lifetime_billed: num(r.lifetime_billed),
    open_balance: num(r.open_balance),
    median_dtp: numOrNull(r.median_dtp),
    avg_dtp: numOrNull(r.avg_dtp),
    stddev_dtp: numOrNull(r.stddev_dtp),
    p90_dtp: numOrNull(r.p90_dtp),
    median_due_var: numOrNull(r.median_due_var),
    pct_on_time: numOrNull(r.pct_on_time),
    no_due_date_count: num(r.no_due_date_count),
    retainage_held: num(r.retainage_held),
    retainage_released: num(r.retainage_released),
    aging_buckets_total: num(r.aging_buckets_total),
    ar_aging_diff: num(r.ar_aging_diff),
  };
}

// CTE-based query that joins per-customer stats from ar_invoices (active
// upload) with per-customer aging aggregates (active upload, row_type='detail').
// $1 is an optional customer_no_clean filter — pass NULL to return all rows.
const CUSTOMER_STATS_SQL = `
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
inv_per_cust AS (
  SELECT
    customer_no_clean,
    MAX(customer_no) AS customer_no,
    MAX(customer_name) AS customer_name,
    COUNT(*) AS n_invoices,
    SUM(total_invoice) AS lifetime_billed,
    SUM(balance_due) AS open_balance,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_pay)
      FILTER (WHERE is_paid = 1) AS median_dtp,
    AVG(days_to_pay) FILTER (WHERE is_paid = 1) AS avg_dtp,
    STDDEV_SAMP(days_to_pay) FILTER (WHERE is_paid = 1) AS stddev_dtp,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_to_pay)
      FILTER (WHERE is_paid = 1) AS p90_dtp,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY due_variance)
      FILTER (WHERE due_variance IS NOT NULL) AS median_due_var,
    AVG(on_time::numeric) FILTER (WHERE on_time IS NOT NULL) AS pct_on_time,
    COUNT(*) FILTER (WHERE is_paid = 1 AND due_date IS NULL) AS no_due_date_count
  FROM ar_invoices
  WHERE upload_id = (SELECT id FROM active_inv)
  GROUP BY customer_no_clean
),
aging_per_cust AS (
  SELECT
    customer_no_clean,
    SUM(retainage) AS retainage_held,
    SUM(orig_rel_ret_amt) AS retainage_released,
    SUM(amount_1 + amount_2 + amount_3 + amount_4) AS aging_buckets_total
  FROM ar_aging
  WHERE upload_id = (SELECT id FROM active_aging)
    AND row_type = 'detail'
  GROUP BY customer_no_clean
)
SELECT
  i.customer_no,
  i.customer_name,
  i.n_invoices,
  i.lifetime_billed,
  i.open_balance,
  i.median_dtp,
  i.avg_dtp,
  i.stddev_dtp,
  i.p90_dtp,
  i.median_due_var,
  i.pct_on_time,
  i.no_due_date_count,
  COALESCE(a.retainage_held, 0)        AS retainage_held,
  COALESCE(a.retainage_released, 0)    AS retainage_released,
  COALESCE(a.aging_buckets_total, 0)   AS aging_buckets_total,
  i.open_balance
    - (COALESCE(a.retainage_held, 0)
       + COALESCE(a.retainage_released, 0)
       + COALESCE(a.aging_buckets_total, 0))             AS ar_aging_diff
FROM inv_per_cust i
LEFT JOIN aging_per_cust a ON a.customer_no_clean = i.customer_no_clean
WHERE $1::text IS NULL OR i.customer_no_clean = $1::text
ORDER BY i.customer_no_clean
`;

export async function getAllCustomerStats(): Promise<CustomerStats[]> {
  const rows = (await sql(CUSTOMER_STATS_SQL, [null])) as RawCustomerRow[];
  return rows.map(mapRow);
}

export async function getCustomerByNo(
  customerNo: string
): Promise<CustomerStats | null> {
  const cleaned = customerNo.trim();
  if (!cleaned) return null;
  const rows = (await sql(CUSTOMER_STATS_SQL, [cleaned])) as RawCustomerRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}
