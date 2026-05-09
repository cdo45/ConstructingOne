"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCurrency0, fmtCurrencyCompact } from "@/lib/format";

export type BilledCollectedRow = {
  year: number;
  billed: number;
  collected: number;
  is_ytd: boolean;
};

export default function BilledCollectedChart({
  rows,
}: {
  rows: BilledCollectedRow[];
}) {
  const data = rows.map((r) => ({
    yearLabel: r.is_ytd ? `${r.year} YTD` : String(r.year),
    Billed: r.billed,
    Collected: r.collected,
  }));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis
            dataKey="yearLabel"
            stroke="#374151"
            fontSize={11}
            tick={{ fill: "#1F4E78" }}
          />
          <YAxis
            tickFormatter={(v) => fmtCurrencyCompact(Number(v))}
            stroke="#6B7280"
            fontSize={11}
          />
          <Tooltip
            cursor={{ fill: "rgba(31, 78, 120, 0.05)" }}
            formatter={(v: number, name) => [fmtCurrency0(v), name]}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Billed" fill="#1F4E78" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Collected" fill="#63BE7B" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
