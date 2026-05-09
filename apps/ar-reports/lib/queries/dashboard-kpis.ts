import { sql } from "@/lib/db";

export type DashboardKpis = {
  total_invoices: number;
  unique_customers: number;
  lifetime_billed: number;
  open_balance: number;
  total_paid_invoices: number;
  median_dtp_all: number | null;
  avg_dtp_all: number | null;
  invoices_missing_due_date: number;
};

type RawKpiRow = {
  total_invoices: string | number;
  unique_customers: string | number;
  lifetime_billed: string | number | null;
  open_balance: string | number | null;
  total_paid_invoices: string | number;
  median_dtp_all: string | number | null;
  avg_dtp_all: string | number | null;
  invoices_missing_due_date: string | number;
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

const DASHBOARD_KPIS_SQL = `
WITH active_inv AS (
  SELECT id FROM uploads
  WHERE upload_type = 'ar_detail' AND is_active = TRUE
  ORDER BY uploaded_at DESC
  LIMIT 1
)
SELECT
  COUNT(*)                                                       AS total_invoices,
  COUNT(DISTINCT customer_no_clean)                              AS unique_customers,
  COALESCE(SUM(total_invoice), 0)                                AS lifetime_billed,
  COALESCE(SUM(balance_due), 0)                                  AS open_balance,
  COUNT(*) FILTER (WHERE is_paid = 1)                            AS total_paid_invoices,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_pay)
    FILTER (WHERE is_paid = 1)                                   AS median_dtp_all,
  AVG(days_to_pay) FILTER (WHERE is_paid = 1)                    AS avg_dtp_all,
  COUNT(*) FILTER (WHERE due_date IS NULL)                       AS invoices_missing_due_date
FROM ar_invoices
WHERE upload_id = (SELECT id FROM active_inv)
`;

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const rows = (await sql(DASHBOARD_KPIS_SQL)) as RawKpiRow[];
  const r = rows[0];
  if (!r) {
    return {
      total_invoices: 0,
      unique_customers: 0,
      lifetime_billed: 0,
      open_balance: 0,
      total_paid_invoices: 0,
      median_dtp_all: null,
      avg_dtp_all: null,
      invoices_missing_due_date: 0,
    };
  }
  return {
    total_invoices: num(r.total_invoices),
    unique_customers: num(r.unique_customers),
    lifetime_billed: num(r.lifetime_billed),
    open_balance: num(r.open_balance),
    total_paid_invoices: num(r.total_paid_invoices),
    median_dtp_all: numOrNull(r.median_dtp_all),
    avg_dtp_all: numOrNull(r.avg_dtp_all),
    invoices_missing_due_date: num(r.invoices_missing_due_date),
  };
}

export type BilledCollectedYear = {
  year: number;
  billed: number;
  collected: number;
  is_ytd: boolean;
};

// Billed and collected come from different date columns (invoice_date vs
// date_paid), so a single GROUP BY won't work — aggregate each side
// independently and FULL OUTER JOIN on year so years with only one of the
// two metrics still show up.
const BILLED_COLLECTED_BY_YEAR_SQL = `
WITH active_inv AS (
  SELECT id FROM uploads
  WHERE upload_type = 'ar_detail' AND is_active = TRUE
  ORDER BY uploaded_at DESC
  LIMIT 1
),
billed AS (
  SELECT EXTRACT(YEAR FROM invoice_date)::int AS year,
         SUM(total_invoice)                  AS billed
  FROM ar_invoices
  WHERE upload_id = (SELECT id FROM active_inv)
    AND invoice_date IS NOT NULL
  GROUP BY EXTRACT(YEAR FROM invoice_date)
),
collected AS (
  SELECT EXTRACT(YEAR FROM date_paid)::int AS year,
         SUM(paid_to_date)                AS collected
  FROM ar_invoices
  WHERE upload_id = (SELECT id FROM active_inv)
    AND date_paid IS NOT NULL
  GROUP BY EXTRACT(YEAR FROM date_paid)
)
SELECT
  COALESCE(b.year, c.year)        AS year,
  COALESCE(b.billed, 0)           AS billed,
  COALESCE(c.collected, 0)        AS collected
FROM billed b
FULL OUTER JOIN collected c ON b.year = c.year
ORDER BY year ASC
`;

type RawBilledCollectedRow = {
  year: number | string;
  billed: number | string | null;
  collected: number | string | null;
};

export async function getBilledCollectedByYear(): Promise<BilledCollectedYear[]> {
  const rows = (await sql(BILLED_COLLECTED_BY_YEAR_SQL)) as RawBilledCollectedRow[];
  const currentYear = new Date().getFullYear();
  return rows.map((r) => {
    const year = typeof r.year === "number" ? r.year : Number(r.year);
    return {
      year,
      billed: num(r.billed),
      collected: num(r.collected),
      is_ytd: year === currentYear,
    };
  });
}
