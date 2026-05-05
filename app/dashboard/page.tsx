import Link from "next/link";
import {
  getDashboardKpis,
  getBilledCollectedByYear,
} from "@/lib/queries/dashboard-kpis";
import { getAllCustomerStats } from "@/lib/queries/customers";
import {
  fmtCurrency0,
  fmtCurrencyCompact,
  fmtDays,
  fmtInt,
} from "@/lib/format";
import TopCustomersChart, { type TopCustomerRow } from "./TopCustomersChart";
import BilledCollectedChart, {
  type BilledCollectedRow,
} from "./BilledCollectedChart";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CardSize = "lg" | "sm";

function KpiCard({
  label,
  value,
  size,
}: {
  label: string;
  value: string;
  size: CardSize;
}) {
  const valueClass =
    size === "lg"
      ? "text-3xl font-bold text-vance-navy"
      : "text-xl font-semibold text-vance-navy";
  const padClass = size === "lg" ? "p-5" : "p-4";
  return (
    <div className={`rounded border border-gray-200 bg-white shadow-sm ${padClass}`}>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 ${valueClass} tabular-nums`}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const [kpis, customers, byYear] = await Promise.all([
    getDashboardKpis(),
    getAllCustomerStats(),
    getBilledCollectedByYear(),
  ]);

  const top10: TopCustomerRow[] = [...customers]
    .sort((a, b) => b.lifetime_billed - a.lifetime_billed)
    .slice(0, 10)
    .map((c) => ({
      customer_no: c.customer_no,
      customer_name: c.customer_name ?? c.customer_no,
      lifetime_billed: c.lifetime_billed,
    }));

  const billedCollectedRows: BilledCollectedRow[] = byYear.map((r) => ({
    year: r.year,
    billed: r.billed,
    collected: r.collected,
    is_ytd: r.is_ytd,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-vance-navy text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xs text-gray-200 hover:underline">
                ← Home
              </Link>
              <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-200">
                AR portfolio at a glance — KPIs, top customers, and yearly
                billing vs collections.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/customers"
                className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Customer List
              </Link>
              <Link
                href="/rankings"
                className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Rankings
              </Link>
              <Link
                href="/forecast"
                className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Forecast →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
        {/* Top KPI block — 4 large cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Invoices"
            value={fmtInt(kpis.total_invoices)}
            size="lg"
          />
          <KpiCard
            label="Unique Customers"
            value={fmtInt(kpis.unique_customers)}
            size="lg"
          />
          <KpiCard
            label="Lifetime Billed"
            value={fmtCurrency0(kpis.lifetime_billed)}
            size="lg"
          />
          <KpiCard
            label="Open Balance"
            value={fmtCurrency0(kpis.open_balance)}
            size="lg"
          />
        </div>

        {/* Second KPI row — 4 smaller cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total Paid Invoices"
            value={fmtInt(kpis.total_paid_invoices)}
            size="sm"
          />
          <KpiCard
            label="Median Days to Pay"
            value={fmtDays(kpis.median_dtp_all)}
            size="sm"
          />
          <KpiCard
            label="Avg Days to Pay"
            value={fmtDays(kpis.avg_dtp_all)}
            size="sm"
          />
          <KpiCard
            label="Invoices Missing Due Date"
            value={fmtInt(kpis.invoices_missing_due_date)}
            size="sm"
          />
        </div>

        {/* Top 10 customers chart */}
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-vance-navy rounded-t px-4 py-2 text-white">
            <h2 className="text-sm font-semibold">
              Top 10 Customers by Lifetime Billed
            </h2>
          </div>
          <div className="p-4">
            <TopCustomersChart rows={top10} />
            <p className="mt-2 text-right text-xs text-gray-500">
              Largest:{" "}
              <span className="font-semibold text-vance-navy">
                {top10[0]?.customer_name ?? "—"}
              </span>{" "}
              · {fmtCurrencyCompact(top10[0]?.lifetime_billed ?? 0)}
            </p>
          </div>
        </div>

        {/* Billed vs Collected by Year */}
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-vance-navy rounded-t px-4 py-2 text-white">
            <h2 className="text-sm font-semibold">Billed vs Collected by Year</h2>
          </div>
          <div className="p-4">
            <BilledCollectedChart rows={billedCollectedRows} />
            <p className="mt-2 text-xs text-gray-500">
              Billed = SUM(total_invoice) by year of invoice_date · Collected =
              SUM(paid_to_date) by year of date_paid. Older invoices may pay
              into current years.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
