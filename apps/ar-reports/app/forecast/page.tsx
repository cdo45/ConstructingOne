import Link from "next/link";
import {
  getOpenInvoiceProjections,
  getWeeklyForecast,
  getMonthlyForecast,
  getDailyForecast,
  getOverdueAmounts,
} from "@/lib/queries/forecast";
import { getReconciliation } from "@/lib/queries/reconciliation";
import {
  fmtCurrency0,
  fmtInt,
  heatForecastReconcile,
} from "@/lib/format";
import BucketTable from "./BucketTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function todayIso(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAsOf(v: string | string[] | undefined): {
  iso: string;
  date: Date;
} {
  let raw = Array.isArray(v) ? v[0] : v;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    raw = todayIso();
  }
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    const fallback = todayIso();
    return { iso: fallback, date: new Date(`${fallback}T00:00:00Z`) };
  }
  return { iso: raw, date };
}

function fmtDateCell(iso: string | null): string {
  if (!iso) return "—";
  return iso;
}

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: { asOf?: string | string[] };
}) {
  const { iso: asOfIso, date: asOf } = parseAsOf(searchParams?.asOf);

  const [projections, weekly, monthly, daily, overdue, reconcile] =
    await Promise.all([
      getOpenInvoiceProjections(asOf),
      getWeeklyForecast(asOf, 26),
      getMonthlyForecast(asOf, 12),
      getDailyForecast(asOf, 90),
      getOverdueAmounts(asOf),
      getReconciliation(),
    ]);

  const totalOpenBalance = projections.reduce((s, p) => s + p.balance_due, 0);
  const openInvoiceCount = projections.length;
  const customersWithOpen = new Set(projections.map((p) => p.customer_no)).size;
  const invoicesWithoutHistory = projections.filter(
    (p) => p.customer_paid_count === 0
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-vance-navy text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xs text-gray-200 hover:underline">
                ← Home
              </Link>
              <h1 className="mt-1 text-2xl font-bold">Collections Forecast</h1>
              <p className="mt-1 text-sm text-gray-200">
                Three scenarios projected from each open invoice. Best case
                respects due dates. Realistic uses customer avg DTP. Worst uses
                customer P90 DTP.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Dashboard
              </Link>
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
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
        {/* KPIs + as-of date input */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Total Open Balance
            </div>
            <div className="mt-1 text-2xl font-bold text-vance-navy tabular-nums">
              {fmtCurrency0(totalOpenBalance)}
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Open Invoices
            </div>
            <div className="mt-1 text-2xl font-bold text-vance-navy tabular-nums">
              {fmtInt(openInvoiceCount)}
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Customers w/ Open Balance
            </div>
            <div className="mt-1 text-2xl font-bold text-vance-navy tabular-nums">
              {fmtInt(customersWithOpen)}
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Invoices Without Payment History
            </div>
            <div className="mt-1 text-2xl font-bold text-vance-navy tabular-nums">
              {fmtInt(invoicesWithoutHistory)}
            </div>
          </div>
          <form
            method="get"
            className="rounded border-2 border-yellow-300 bg-yellow-50 p-4 shadow-sm"
          >
            <label
              htmlFor="asOf"
              className="block text-xs font-semibold uppercase tracking-wide text-yellow-800"
            >
              Forecast as of
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="asOf"
                name="asOf"
                type="date"
                defaultValue={asOfIso}
                className="flex-1 rounded border border-yellow-400 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600"
              />
              <button
                type="submit"
                className="rounded bg-yellow-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-yellow-600"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Reconciliation block */}
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-vance-navy rounded-t px-4 py-2 text-white">
            <h2 className="text-sm font-semibold">AR vs Aging Reconciliation</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">AR balance_due</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtCurrency0(reconcile.ar_balance_due)}
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">+ AR retainage</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtCurrency0(reconcile.ar_retainage)}
                </td>
              </tr>
              <tr className="border-t border-gray-100 font-semibold">
                <td className="px-4 py-2 text-gray-900">= AR Total Open</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtCurrency0(reconcile.ar_total_open)}
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">Aging File Total</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtCurrency0(reconcile.aging_total)}
                </td>
              </tr>
              <tr className="border-t border-gray-200 font-semibold">
                <td className="px-4 py-2 text-gray-900">Difference</td>
                <td
                  className="px-4 py-2 text-right tabular-nums"
                  style={{
                    backgroundColor: heatForecastReconcile(reconcile.difference),
                  }}
                >
                  {fmtCurrency0(reconcile.difference)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Open invoice detail */}
        <div className="rounded border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-vance-navy rounded-t px-4 py-2 text-white">
            <h2 className="text-sm font-semibold">
              Open Invoice Detail ({fmtInt(openInvoiceCount)} invoices)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-1.5 text-left font-semibold">Customer</th>
                  <th className="px-3 py-1.5 text-left font-semibold">Invoice #</th>
                  <th className="px-3 py-1.5 text-left font-semibold">Invoice Date</th>
                  <th className="px-3 py-1.5 text-left font-semibold">Due Date</th>
                  <th className="px-3 py-1.5 text-right font-semibold">Balance Due</th>
                  <th className="px-3 py-1.5 text-left font-semibold">Best Case</th>
                  <th className="px-3 py-1.5 text-left font-semibold">Realistic</th>
                  <th className="px-3 py-1.5 text-left font-semibold">Worst Case</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((p, i) => (
                  <tr
                    key={`${p.customer_no}-${p.invoice_no}-${i}`}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td
                      className="px-3 py-1.5 text-gray-800"
                      title={p.customer_no}
                    >
                      <div className="truncate max-w-[200px]">
                        {p.customer_name ?? p.customer_no}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-gray-700">
                      {p.invoice_no ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-gray-700">
                      {fmtDateCell(p.invoice_date)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-gray-700">
                      {fmtDateCell(p.due_date)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-gray-900">
                      {fmtCurrency0(p.balance_due)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-gray-700">
                      {fmtDateCell(p.best_case_date)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums font-semibold text-gray-900">
                      {fmtDateCell(p.realistic_date)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-gray-700">
                      {fmtDateCell(p.worst_case_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly */}
        <BucketTable
          title="Weekly Forecast (next 26 weeks)"
          granularity="weekly"
          buckets={weekly}
          overdue={overdue}
          totalLabel="26-Week Total"
        />

        {/* Monthly */}
        <BucketTable
          title="Monthly Forecast (next 12 months)"
          granularity="monthly"
          buckets={monthly}
          overdue={overdue}
          totalLabel="12-Month Total"
        />

        {/* Daily */}
        <BucketTable
          title="Daily Forecast (next 90 days)"
          granularity="daily"
          buckets={daily}
          overdue={overdue}
          totalLabel="90-Day Total"
        />
      </section>
    </main>
  );
}
