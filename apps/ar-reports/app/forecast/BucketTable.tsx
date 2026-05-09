import type { ForecastBucket } from "@/lib/queries/forecast";
import {
  fmtCurrency0,
  fmtInt,
  heatWhiteToGreen,
} from "@/lib/format";

export type Granularity = "weekly" | "monthly" | "daily";

function formatDateLabel(iso: string): string {
  // "2026-05-05" → "May 5, 2026". Avoid Date() interpretation issues by
  // splitting the ISO string directly.
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  if (!y || !m || !d) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

function formatDayOfWeek(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => Number(s));
  if (!y || !m || !d) return "";
  const dt = new Date(Date.UTC(y, m - 1, d));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getUTCDay()];
}

function bucketLabel(b: ForecastBucket, granularity: Granularity): string {
  switch (granularity) {
    case "weekly": {
      // Show start..(end-1)
      const [ey, em, ed] = b.bucket_end.split("-").map((s) => Number(s));
      const endInclusive = new Date(Date.UTC(ey, em - 1, ed - 1));
      const endIso = `${endInclusive.getUTCFullYear()}-${String(
        endInclusive.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(endInclusive.getUTCDate()).padStart(2, "0")}`;
      return `${formatDateLabel(b.bucket_start)} – ${formatDateLabel(endIso)}`;
    }
    case "monthly": {
      const [y, m] = b.bucket_start.split("-").map((s) => Number(s));
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      return `${months[m - 1]} ${y}`;
    }
    case "daily":
      return `${formatDayOfWeek(b.bucket_start)} ${formatDateLabel(b.bucket_start)}`;
  }
}

export type OverdueRow = {
  best: number;
  realistic: number;
  worst: number;
  count: number;
};

export default function BucketTable({
  title,
  granularity,
  buckets,
  overdue,
  totalLabel,
}: {
  title: string;
  granularity: Granularity;
  buckets: ForecastBucket[];
  overdue: OverdueRow;
  totalLabel: string;
}) {
  // Heatmap normalization based on the largest bucket realistic_amount only.
  // Keeps the gradient comparable across columns within a single table.
  const maxAmount = buckets.reduce(
    (m, b) =>
      Math.max(m, b.best_case_amount, b.realistic_amount, b.worst_case_amount),
    0
  );

  const totalBest = buckets.reduce((s, b) => s + b.best_case_amount, 0);
  const totalRealistic = buckets.reduce((s, b) => s + b.realistic_amount, 0);
  const totalWorst = buckets.reduce((s, b) => s + b.worst_case_amount, 0);
  const totalCount = buckets.reduce((s, b) => s + b.invoice_count, 0);

  return (
    <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-vance-navy rounded-t px-4 py-2 text-white">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-3 py-1.5 text-left font-semibold">Bucket</th>
              <th className="px-3 py-1.5 text-right font-semibold">Best Case</th>
              <th className="px-3 py-1.5 text-right font-semibold">Realistic</th>
              <th className="px-3 py-1.5 text-right font-semibold">Worst Case</th>
              <th className="px-3 py-1.5 text-right font-semibold">Invoices</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-red-50">
              <td className="px-3 py-1.5 font-semibold text-red-800">
                Overdue (before as-of)
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-red-800">
                {fmtCurrency0(overdue.best)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-red-800">
                {fmtCurrency0(overdue.realistic)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-red-800">
                {fmtCurrency0(overdue.worst)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-red-800">
                {fmtInt(overdue.count)}
              </td>
            </tr>
            {buckets.map((b) => (
              <tr key={b.bucket_start} className="border-t border-gray-100">
                <td className="px-3 py-1.5 text-gray-800">
                  {bucketLabel(b, granularity)}
                </td>
                <td
                  className="px-3 py-1.5 text-right tabular-nums text-gray-900"
                  style={{
                    backgroundColor: heatWhiteToGreen(
                      b.best_case_amount,
                      maxAmount
                    ),
                  }}
                >
                  {fmtCurrency0(b.best_case_amount)}
                </td>
                <td
                  className="px-3 py-1.5 text-right tabular-nums text-gray-900"
                  style={{
                    backgroundColor: heatWhiteToGreen(
                      b.realistic_amount,
                      maxAmount
                    ),
                  }}
                >
                  {fmtCurrency0(b.realistic_amount)}
                </td>
                <td
                  className="px-3 py-1.5 text-right tabular-nums text-gray-900"
                  style={{
                    backgroundColor: heatWhiteToGreen(
                      b.worst_case_amount,
                      maxAmount
                    ),
                  }}
                >
                  {fmtCurrency0(b.worst_case_amount)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-gray-700">
                  {fmtInt(b.invoice_count)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-semibold text-gray-900">
              <td className="px-3 py-1.5">{totalLabel}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {fmtCurrency0(totalBest)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {fmtCurrency0(totalRealistic)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {fmtCurrency0(totalWorst)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {fmtInt(totalCount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
