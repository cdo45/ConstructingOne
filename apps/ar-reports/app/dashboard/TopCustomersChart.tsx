"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCurrency0, fmtCurrencyCompact } from "@/lib/format";

export type TopCustomerRow = {
  customer_no: string;
  customer_name: string;
  lifetime_billed: number;
};

export default function TopCustomersChart({ rows }: { rows: TopCustomerRow[] }) {
  // Recharts vertical layout puts categories on Y axis and values on X axis.
  // Reverse so the largest customer renders at the top.
  const data = [...rows].reverse();

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => fmtCurrencyCompact(Number(v))}
            stroke="#6B7280"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="customer_name"
            width={180}
            stroke="#374151"
            fontSize={11}
            tick={{ fill: "#1F4E78" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(31, 78, 120, 0.05)" }}
            formatter={(v: number) => [fmtCurrency0(v), "Lifetime Billed"]}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="lifetime_billed" fill="#1F4E78" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
