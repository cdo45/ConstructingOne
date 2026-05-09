import { getAllCustomerStats } from "@/lib/queries/customers";
import CustomerTable from "./CustomerTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CustomersPage() {
  const rows = await getAllCustomerStats();

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 md:py-16">
      <div className="mb-10 flex items-baseline justify-between gap-6">
        <span className="eyebrow">Customers</span>
        <p className="max-w-[440px] text-right text-[14px] text-[var(--muted)]">
          Payment metrics joined with aging data. Click any column header to
          sort.
        </p>
      </div>
      <CustomerTable rows={rows} />
    </section>
  );
}
