import Link from "next/link";

type Accent = "navy" | "orange" | "good" | "teal";

const cards: Array<{
  href: string;
  title: string;
  description: string;
  accent: Accent;
}> = [
  {
    href: "/upload",
    title: "Upload",
    description:
      "Upload Foundation AR detail and aging reports. New uploads replace prior data.",
    accent: "navy",
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "KPIs, top customers chart, and yearly billing vs collections.",
    accent: "navy",
  },
  {
    href: "/customers",
    title: "Customers",
    description:
      "Sortable table of every customer with payment metrics and aging buckets.",
    accent: "orange",
  },
  {
    href: "/rankings",
    title: "Rankings",
    description:
      "Top 20 customers by speed, reliability, and volume-weighted score.",
    accent: "teal",
  },
  {
    href: "#",
    title: "Forecast",
    description:
      "Three-scenario collections forecast with weekly, monthly, and daily views.",
    accent: "good",
  },
];

const accentClasses: Record<Accent, string> = {
  navy: "border-t-4 border-vance-navy",
  orange: "border-t-4 border-vance-orange",
  good: "border-t-4 border-vance-good",
  teal: "border-t-4 border-teal-700",
};

const titleClasses: Record<Accent, string> = {
  navy: "text-vance-navy",
  orange: "text-vance-orange",
  good: "text-vance-good",
  teal: "text-teal-700",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-vance-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-bold">Vance AR Analysis Tool</h1>
          <p className="mt-2 text-sm text-gray-200">
            Accounts Receivable analytics for Vance Corp.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`block rounded-md bg-white p-6 shadow-sm transition hover:shadow-md ${accentClasses[card.accent]}`}
            >
              <h2
                className={`text-xl font-semibold ${titleClasses[card.accent]}`}
              >
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
