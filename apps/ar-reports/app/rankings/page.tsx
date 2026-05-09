import Link from "next/link";
import {
  getAllCustomerStats,
  type CustomerStats,
} from "@/lib/queries/customers";
import {
  fmtCurrencyCompact,
  fmtDays,
  fmtDecimal1,
  fmtInt,
} from "@/lib/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOP_N = 20;
const DEFAULT_MIN = 5;

type RankRow = {
  rank: number;
  customer_no: string;
  customer_name: string;
  metricText: string;
  n_invoices: number;
};

function parseMin(v: string | string[] | undefined): number {
  if (Array.isArray(v)) v = v[0];
  if (!v) return DEFAULT_MIN;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MIN;
  return n;
}

function speedRanking(rows: CustomerStats[]): RankRow[] {
  return rows
    .filter((r) => r.median_dtp != null)
    .sort((a, b) => (a.median_dtp as number) - (b.median_dtp as number))
    .slice(0, TOP_N)
    .map((r, i) => ({
      rank: i + 1,
      customer_no: r.customer_no,
      customer_name: r.customer_name ?? r.customer_no,
      metricText: `${fmtDays(r.median_dtp)} days`,
      n_invoices: r.n_invoices,
    }));
}

function reliabilityRanking(rows: CustomerStats[]): RankRow[] {
  return rows
    .filter((r) => r.stddev_dtp != null)
    .sort((a, b) => (a.stddev_dtp as number) - (b.stddev_dtp as number))
    .slice(0, TOP_N)
    .map((r, i) => ({
      rank: i + 1,
      customer_no: r.customer_no,
      customer_name: r.customer_name ?? r.customer_no,
      metricText: `σ ${fmtDecimal1(r.stddev_dtp)}`,
      n_invoices: r.n_invoices,
    }));
}

function volumeRanking(rows: CustomerStats[]): RankRow[] {
  return rows
    .filter((r) => r.median_dtp != null)
    .map((r) => ({
      row: r,
      score: r.lifetime_billed / ((r.median_dtp as number) + 1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N)
    .map((entry, i) => ({
      rank: i + 1,
      customer_no: entry.row.customer_no,
      customer_name: entry.row.customer_name ?? entry.row.customer_no,
      metricText: fmtCurrencyCompact(entry.score),
      n_invoices: entry.row.n_invoices,
    }));
}

function RankingCard({
  title,
  subtitle,
  metricLabel,
  headerClass,
  rows,
}: {
  title: string;
  subtitle: string;
  metricLabel: string;
  headerClass: string;
  rows: RankRow[];
}) {
  return (
    <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
      <div className={`${headerClass} px-4 py-2 text-white`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
        <p className="text-[11px] text-white/80">{subtitle}</p>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-3 py-1.5 text-left font-semibold">#</th>
            <th className="px-3 py-1.5 text-left font-semibold">Customer</th>
            <th className="px-3 py-1.5 text-right font-semibold">{metricLabel}</th>
            <th className="px-3 py-1.5 text-right font-semibold">Invoices</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                No qualifying customers.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.customer_no}
                className="even:bg-gray-50 hover:bg-yellow-50"
              >
                <td className="px-3 py-1.5 font-bold text-gray-700 tabular-nums">
                  {r.rank}.
                </td>
                <td
                  className="px-3 py-1.5 text-gray-800"
                  title={`${r.customer_no} · ${r.customer_name}`}
                >
                  <div className="truncate max-w-[180px]">{r.customer_name}</div>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-gray-900">
                  {r.metricText}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-gray-700">
                  {fmtInt(r.n_invoices)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: { min?: string | string[] };
}) {
  const min = parseMin(searchParams?.min);
  const all = await getAllCustomerStats();
  const qualifying = all.filter((r) => r.n_invoices >= min);

  const speed = speedRanking(qualifying);
  const reliability = reliabilityRanking(qualifying);
  const volume = volumeRanking(qualifying);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-vance-navy text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xs text-gray-200 hover:underline">
                ← Home
              </Link>
              <h1 className="mt-1 text-2xl font-bold">Customer Rankings</h1>
              <p className="mt-1 text-sm text-gray-200">
                Top 20 customers by speed, reliability, and volume-weighted
                score. Customers with fewer than {min} invoices are excluded.
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
                href="/forecast"
                className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Forecast →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-6 space-y-5">
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <div>
            <label
              htmlFor="min"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              Minimum invoice count to qualify
            </label>
            <input
              id="min"
              name="min"
              type="number"
              defaultValue={min}
              min={1}
              step={1}
              className="mt-1 w-32 rounded border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-vance-navy focus:outline-none focus:ring-1 focus:ring-vance-navy"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-vance-navy px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Apply
          </button>
          <span className="text-xs text-gray-500">
            {qualifying.length} of {all.length} customers qualify at min ={" "}
            {min}.
          </span>
        </form>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <RankingCard
            title="Speed"
            subtitle="Lowest median days to pay"
            metricLabel="Median DTP"
            headerClass="bg-vance-navy"
            rows={speed}
          />
          <RankingCard
            title="Reliability"
            subtitle="Lowest stddev = most predictable"
            metricLabel="StdDev"
            headerClass="bg-teal-700"
            rows={reliability}
          />
          <RankingCard
            title="Volume-Weighted"
            subtitle="lifetime billed ÷ (median DTP + 1)"
            metricLabel="Score"
            headerClass="bg-vance-orange"
            rows={volume}
          />
        </div>
      </section>
    </main>
  );
}
