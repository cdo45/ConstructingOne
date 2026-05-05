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
