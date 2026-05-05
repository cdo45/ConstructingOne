import Link from "next/link";
import { getAllCustomerStats } from "@/lib/queries/customers";
import CustomerTable from "./CustomerTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CustomersPage() {
  const rows = await getAllCustomerStats();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-vance-navy text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xs text-gray-200 hover:underline">
                ← Home
              </Link>
              <h1 className="mt-1 text-2xl font-bold">Customer List</h1>
              <p className="mt-1 text-sm text-gray-200">
                Payment metrics joined with aging data. Click any column header to sort.
              </p>
            </div>
            <Link
              href="/forecast"
              className="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              Forecast →
            </Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-[1400px] px-6 py-6">
        <CustomerTable rows={rows} />
      </section>
    </main>
  );
}
