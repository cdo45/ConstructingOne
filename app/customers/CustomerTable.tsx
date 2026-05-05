"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { CustomerStats } from "@/lib/queries/customers";
import {
  fmtCurrency0,
  fmtDays,
  fmtDecimal1,
  fmtInt,
  fmtPercent,
  heatLowerIsBetter,
  heatPercent,
  heatReconcileDiff,
} from "@/lib/format";

type Group = "core" | "aging";

type Cell = {
  text: string;
  bg?: string;
};

function buildColumns(): ColumnDef<CustomerStats, Cell>[] {
  const col = (
    id: keyof CustomerStats | string,
    header: string,
    accessor: (row: CustomerStats) => Cell,
    opts: { group?: Group; sortValue?: (row: CustomerStats) => number | string | null } = {}
  ): ColumnDef<CustomerStats, Cell> => ({
    id: String(id),
    header,
    accessorFn: accessor,
    sortingFn: (a, b) => {
      const av = opts.sortValue ? opts.sortValue(a.original) : a.getValue<Cell>(String(id)).text;
      const bv = opts.sortValue ? opts.sortValue(b.original) : b.getValue<Cell>(String(id)).text;
      // Push nulls to the bottom on ascending sort.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    },
    cell: (info) => {
      const c = info.getValue<Cell>();
      return (
        <div
          className="px-2 py-1"
          style={c.bg ? { backgroundColor: c.bg } : undefined}
        >
          {c.text}
        </div>
      );
    },
    meta: { group: opts.group ?? "core" },
  });

  return [
    col("customer_no", "Customer #", (r) => ({ text: r.customer_no }), {
      sortValue: (r) => r.customer_no,
    }),
    col(
      "customer_name",
      "Customer Name",
      (r) => ({ text: r.customer_name ?? "" }),
      { sortValue: (r) => (r.customer_name ?? "").toLowerCase() }
    ),
    col(
      "n_invoices",
      "# Invoices",
      (r) => ({ text: fmtInt(r.n_invoices) }),
      { sortValue: (r) => r.n_invoices }
    ),
    col(
      "lifetime_billed",
      "Lifetime Billed",
      (r) => ({ text: fmtCurrency0(r.lifetime_billed) }),
      { sortValue: (r) => r.lifetime_billed }
    ),
    col(
      "open_balance",
      "Open Balance",
      (r) => ({ text: fmtCurrency0(r.open_balance) }),
      { sortValue: (r) => r.open_balance }
    ),
    col(
      "median_dtp",
      "Median DTP",
      (r) => ({
        text: fmtDays(r.median_dtp),
        bg: heatLowerIsBetter(r.median_dtp, 30, 60, 120),
      }),
      { sortValue: (r) => r.median_dtp }
    ),
    col(
      "avg_dtp",
      "Avg DTP",
      (r) => ({
        text: fmtDays(r.avg_dtp),
        bg: heatLowerIsBetter(r.avg_dtp, 30, 60, 120),
      }),
      { sortValue: (r) => r.avg_dtp }
    ),
    col(
      "stddev_dtp",
      "StdDev DTP",
      (r) => ({
        text: fmtDecimal1(r.stddev_dtp),
        bg: heatLowerIsBetter(r.stddev_dtp, 15, 40, 80),
      }),
      { sortValue: (r) => r.stddev_dtp }
    ),
    col(
      "median_due_var",
      "Median Due Variance",
      (r) => ({ text: fmtDays(r.median_due_var) }),
      { sortValue: (r) => r.median_due_var }
    ),
    col(
      "pct_on_time",
      "% On Time",
      (r) => ({
        text: fmtPercent(r.pct_on_time),
        bg: heatPercent(r.pct_on_time),
      }),
      { sortValue: (r) => r.pct_on_time }
    ),
    col(
      "no_due_date_count",
      "# No Due Date",
      (r) => ({ text: fmtInt(r.no_due_date_count) }),
      { sortValue: (r) => r.no_due_date_count }
    ),
    col(
      "retainage_held",
      "Held Retention",
      (r) => ({ text: fmtCurrency0(r.retainage_held) }),
      { sortValue: (r) => r.retainage_held, group: "aging" }
    ),
    col(
      "retainage_released",
      "Released Retention",
      (r) => ({ text: fmtCurrency0(r.retainage_released) }),
      { sortValue: (r) => r.retainage_released, group: "aging" }
    ),
    col(
      "aging_buckets_total",
      "Aging Buckets Total",
      (r) => ({ text: fmtCurrency0(r.aging_buckets_total) }),
      { sortValue: (r) => r.aging_buckets_total, group: "aging" }
    ),
    col(
      "ar_aging_diff",
      "AR vs Aging Diff",
      (r) => ({
        text: fmtCurrency0(r.ar_aging_diff),
        bg: heatReconcileDiff(r.ar_aging_diff),
      }),
      { sortValue: (r) => r.ar_aging_diff, group: "aging" }
    ),
  ];
}

export default function CustomerTable({ rows }: { rows: CustomerStats[] }) {
  const columns = useMemo(buildColumns, []);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "customer_no", desc: false },
  ]);
  const [filter, setFilter] = useState("");

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    globalFilterFn: (row, _id, value) => {
      const q = String(value ?? "").trim().toLowerCase();
      if (!q) return true;
      const name = (row.original.customer_name ?? "").toLowerCase();
      return name.includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const visibleCount = table.getRowModel().rows.length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by customer name..."
          className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-vance-navy focus:outline-none focus:ring-1 focus:ring-vance-navy"
        />
        <span className="text-xs text-gray-500">
          {visibleCount} of {rows.length} customers
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-xs">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta as { group?: Group } | undefined;
                  const isAging = meta?.group === "aging";
                  const headerBg = isAging ? "bg-vance-orange" : "bg-vance-navy";
                  const sorted = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className={`${headerBg} cursor-pointer select-none px-2 py-2 text-left font-semibold text-white ${
                        h.column.id === "customer_no" || h.column.id === "customer_name"
                          ? ""
                          : "text-right"
                      }`}
                    >
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : ""}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => {
                  const id = cell.column.id;
                  const isText = id === "customer_no" || id === "customer_name";
                  return (
                    <td
                      key={cell.id}
                      className={isText ? "" : "text-right tabular-nums"}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
