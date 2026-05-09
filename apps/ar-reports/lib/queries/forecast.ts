import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomerProjectionStats = {
  customer_no_clean: string;
  avg_dtp: number | null;
  p90_dtp: number | null;
  n_paid_invoices: number;
};

export type OpenInvoiceProjection = {
  customer_no: string;
  customer_name: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  due_date: string | null;
  balance_due: number;
  best_case_date: string | null;
  realistic_date: string | null;
  worst_case_date: string | null;
  customer_paid_count: number;
};

export type ForecastBucket = {
  bucket_start: string; // YYYY-MM-DD
  bucket_end: string;   // YYYY-MM-DD (exclusive)
  best_case_amount: number;
  realistic_amount: number;
  worst_case_amount: number;
  invoice_count: number; // invoices whose realistic_date falls in [start, end)
};

export type OverdueTotals = {
  best: number;
  realistic: number;
  worst: number;
  count: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(d: Date): string {
  // Local-agnostic YYYY-MM-DD. Use UTC components so server timezone doesn't
  // shift the date. Inputs from the URL are already YYYY-MM-DD strings parsed
  // via new Date("yyyy-mm-dd") which is interpreted as UTC midnight.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function dateOrNull(v: string | Date | null | undefined): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date && !Number.isNaN(v.getTime())) return isoDate(v);
  return null;
}

// ---------------------------------------------------------------------------
// Shared CTE block — defines `projections` with one row per OPEN invoice.
// Consumers prepend `WITH ${PROJECTIONS_CTES}, ...` and SELECT from
// `projections`. The fragment intentionally does not start with WITH.
// ---------------------------------------------------------------------------

const PROJECTIONS_CTES = `
active_inv AS (
  SELECT id FROM uploads
  WHERE upload_type = 'ar_detail' AND is_active = TRUE
  ORDER BY uploaded_at DESC
  LIMIT 1
),
per_cust AS (
  SELECT
    customer_no_clean,
    AVG(days_to_pay) FILTER (WHERE is_paid = 1) AS avg_dtp,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_to_pay)
      FILTER (WHERE is_paid = 1) AS p90_dtp,
    COUNT(*) FILTER (WHERE is_paid = 1) AS n_paid
  FROM ar_invoices
  WHERE upload_id = (SELECT id FROM active_inv)
  GROUP BY customer_no_clean
),
opens AS (
  SELECT
    i.customer_no_clean,
    i.customer_no,
    i.customer_name,
    i.invoice_no,
    i.invoice_date,
    i.due_date,
    i.balance_due
  FROM ar_invoices i
  WHERE i.upload_id = (SELECT id FROM active_inv)
    AND i.is_open = 1
),
projections AS (
  SELECT
    o.customer_no_clean,
    o.customer_no,
    o.customer_name,
    o.invoice_no,
    o.invoice_date,
    o.due_date,
    o.balance_due,
    COALESCE(p.n_paid, 0)::int AS customer_paid_count,
    GREATEST(
      COALESCE(o.due_date, o.invoice_date + 30),
      o.invoice_date + 30
    ) AS best_case_date,
    COALESCE(
      CASE
        WHEN COALESCE(p.n_paid, 0) >= 1 AND p.avg_dtp IS NOT NULL
          THEN o.invoice_date + ROUND(p.avg_dtp)::int
      END,
      o.due_date,
      o.invoice_date + 30
    ) AS realistic_date,
    COALESCE(
      CASE
        WHEN COALESCE(p.n_paid, 0) >= 2 AND p.p90_dtp IS NOT NULL
          THEN o.invoice_date + ROUND(p.p90_dtp)::int
      END,
      o.due_date,
      o.invoice_date + 30
    ) AS worst_case_date
  FROM opens o
  LEFT JOIN per_cust p USING (customer_no_clean)
)
`;

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function getCustomerProjections(): Promise<CustomerProjectionStats[]> {
  const rows = (await sql(`
    WITH active_inv AS (
      SELECT id FROM uploads
      WHERE upload_type = 'ar_detail' AND is_active = TRUE
      ORDER BY uploaded_at DESC
      LIMIT 1
    )
    SELECT
      customer_no_clean,
      AVG(days_to_pay) FILTER (WHERE is_paid = 1)                    AS avg_dtp,
      PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_to_pay)
        FILTER (WHERE is_paid = 1)                                   AS p90_dtp,
      COUNT(*) FILTER (WHERE is_paid = 1)                            AS n_paid
    FROM ar_invoices
    WHERE upload_id = (SELECT id FROM active_inv)
    GROUP BY customer_no_clean
    ORDER BY customer_no_clean
  `)) as Array<{
    customer_no_clean: string;
    avg_dtp: string | number | null;
    p90_dtp: string | number | null;
    n_paid: string | number;
  }>;
  return rows.map((r) => ({
    customer_no_clean: r.customer_no_clean,
    avg_dtp: numOrNull(r.avg_dtp),
    p90_dtp: numOrNull(r.p90_dtp),
    n_paid_invoices: num(r.n_paid),
  }));
}

export async function getOpenInvoiceProjections(
  _asOfDate?: Date
): Promise<OpenInvoiceProjection[]> {
  const rows = (await sql(`
    WITH ${PROJECTIONS_CTES}
    SELECT
      customer_no, customer_name, invoice_no,
      invoice_date::text  AS invoice_date,
      due_date::text      AS due_date,
      balance_due,
      best_case_date::text AS best_case_date,
      realistic_date::text AS realistic_date,
      worst_case_date::text AS worst_case_date,
      customer_paid_count
    FROM projections
    ORDER BY realistic_date NULLS LAST, customer_no_clean, invoice_no
  `)) as Array<{
    customer_no: string;
    customer_name: string | null;
    invoice_no: string | null;
    invoice_date: string | Date | null;
    due_date: string | Date | null;
    balance_due: string | number | null;
    best_case_date: string | Date | null;
    realistic_date: string | Date | null;
    worst_case_date: string | Date | null;
    customer_paid_count: number | string;
  }>;
  return rows.map((r) => ({
    customer_no: r.customer_no,
    customer_name: r.customer_name,
    invoice_no: r.invoice_no,
    invoice_date: dateOrNull(r.invoice_date),
    due_date: dateOrNull(r.due_date),
    balance_due: num(r.balance_due),
    best_case_date: dateOrNull(r.best_case_date),
    realistic_date: dateOrNull(r.realistic_date),
    worst_case_date: dateOrNull(r.worst_case_date),
    customer_paid_count: num(r.customer_paid_count),
  }));
}

type RawBucketRow = {
  bucket_start: string | Date;
  bucket_end: string | Date;
  best_case_amount: string | number | null;
  realistic_amount: string | number | null;
  worst_case_amount: string | number | null;
  invoice_count: string | number;
};

function mapBucketRows(rows: RawBucketRow[]): ForecastBucket[] {
  return rows.map((r) => ({
    bucket_start: dateOrNull(r.bucket_start) ?? "",
    bucket_end: dateOrNull(r.bucket_end) ?? "",
    best_case_amount: num(r.best_case_amount),
    realistic_amount: num(r.realistic_amount),
    worst_case_amount: num(r.worst_case_amount),
    invoice_count: num(r.invoice_count),
  }));
}

export async function getWeeklyForecast(
  asOf: Date,
  weeks: number = 26
): Promise<ForecastBucket[]> {
  const rows = (await sql(
    `WITH ${PROJECTIONS_CTES},
     buckets AS (
       SELECT
         n,
         ($1::date + (n * 7))           AS bucket_start,
         ($1::date + ((n + 1) * 7))     AS bucket_end
       FROM generate_series(0, $2::int - 1) AS gs(n)
     )
     SELECT
       b.bucket_start::text AS bucket_start,
       b.bucket_end::text   AS bucket_end,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.best_case_date >= b.bucket_start AND p.best_case_date < b.bucket_end
       ), 0) AS best_case_amount,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.realistic_date >= b.bucket_start AND p.realistic_date < b.bucket_end
       ), 0) AS realistic_amount,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.worst_case_date >= b.bucket_start AND p.worst_case_date < b.bucket_end
       ), 0) AS worst_case_amount,
       COUNT(*) FILTER (
         WHERE p.realistic_date >= b.bucket_start AND p.realistic_date < b.bucket_end
       ) AS invoice_count
     FROM buckets b
     LEFT JOIN projections p ON TRUE
     GROUP BY b.n, b.bucket_start, b.bucket_end
     ORDER BY b.bucket_start`,
    [isoDate(asOf), weeks]
  )) as RawBucketRow[];
  return mapBucketRows(rows);
}

export async function getMonthlyForecast(
  asOf: Date,
  months: number = 12
): Promise<ForecastBucket[]> {
  // Month 0 starts at asOf and runs to the first day of next month so that
  // the partial first month never overlaps the Overdue bucket. Months 1..N
  // are full calendar months.
  const rows = (await sql(
    `WITH ${PROJECTIONS_CTES},
     buckets AS (
       SELECT
         n,
         CASE WHEN n = 0 THEN $1::date
              ELSE (date_trunc('month', $1::date) + (n * INTERVAL '1 month'))::date
         END AS bucket_start,
         (date_trunc('month', $1::date) + ((n + 1) * INTERVAL '1 month'))::date AS bucket_end
       FROM generate_series(0, $2::int - 1) AS gs(n)
     )
     SELECT
       b.bucket_start::text AS bucket_start,
       b.bucket_end::text   AS bucket_end,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.best_case_date >= b.bucket_start AND p.best_case_date < b.bucket_end
       ), 0) AS best_case_amount,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.realistic_date >= b.bucket_start AND p.realistic_date < b.bucket_end
       ), 0) AS realistic_amount,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.worst_case_date >= b.bucket_start AND p.worst_case_date < b.bucket_end
       ), 0) AS worst_case_amount,
       COUNT(*) FILTER (
         WHERE p.realistic_date >= b.bucket_start AND p.realistic_date < b.bucket_end
       ) AS invoice_count
     FROM buckets b
     LEFT JOIN projections p ON TRUE
     GROUP BY b.n, b.bucket_start, b.bucket_end
     ORDER BY b.bucket_start`,
    [isoDate(asOf), months]
  )) as RawBucketRow[];
  return mapBucketRows(rows);
}

export async function getDailyForecast(
  asOf: Date,
  days: number = 90
): Promise<ForecastBucket[]> {
  const rows = (await sql(
    `WITH ${PROJECTIONS_CTES},
     buckets AS (
       SELECT
         n,
         ($1::date + n)       AS bucket_start,
         ($1::date + n + 1)   AS bucket_end
       FROM generate_series(0, $2::int - 1) AS gs(n)
     )
     SELECT
       b.bucket_start::text AS bucket_start,
       b.bucket_end::text   AS bucket_end,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.best_case_date >= b.bucket_start AND p.best_case_date < b.bucket_end
       ), 0) AS best_case_amount,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.realistic_date >= b.bucket_start AND p.realistic_date < b.bucket_end
       ), 0) AS realistic_amount,
       COALESCE(SUM(p.balance_due) FILTER (
         WHERE p.worst_case_date >= b.bucket_start AND p.worst_case_date < b.bucket_end
       ), 0) AS worst_case_amount,
       COUNT(*) FILTER (
         WHERE p.realistic_date >= b.bucket_start AND p.realistic_date < b.bucket_end
       ) AS invoice_count
     FROM buckets b
     LEFT JOIN projections p ON TRUE
     GROUP BY b.n, b.bucket_start, b.bucket_end
     ORDER BY b.bucket_start`,
    [isoDate(asOf), days]
  )) as RawBucketRow[];
  return mapBucketRows(rows);
}

export async function getOverdueAmounts(asOf: Date): Promise<OverdueTotals> {
  const rows = (await sql(
    `WITH ${PROJECTIONS_CTES}
     SELECT
       COALESCE(SUM(balance_due) FILTER (WHERE best_case_date  < $1::date), 0) AS best,
       COALESCE(SUM(balance_due) FILTER (WHERE realistic_date  < $1::date), 0) AS realistic,
       COALESCE(SUM(balance_due) FILTER (WHERE worst_case_date < $1::date), 0) AS worst,
       COUNT(*) FILTER (WHERE realistic_date < $1::date) AS count
     FROM projections`,
    [isoDate(asOf)]
  )) as Array<{
    best: string | number | null;
    realistic: string | number | null;
    worst: string | number | null;
    count: string | number;
  }>;
  const r = rows[0] ?? { best: 0, realistic: 0, worst: 0, count: 0 };
  return {
    best: num(r.best),
    realistic: num(r.realistic),
    worst: num(r.worst),
    count: num(r.count),
  };
}
