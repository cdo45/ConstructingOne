import Link from "next/link";

const cards = [
  {
    href: "/dashboard",
    title: "Dashboard",
    description:
      "KPIs, top customers chart, and yearly billing vs collections.",
  },
  {
    href: "/customers",
    title: "Customers",
    description:
      "Sortable table of every customer with payment metrics and aging buckets.",
  },
  {
    href: "/rankings",
    title: "Rankings",
    description:
      "Top 20 customers by speed, reliability, and volume-weighted score.",
  },
  {
    href: "/forecast",
    title: "Forecast",
    description:
      "Three-scenario collections forecast with weekly, monthly, and daily views.",
  },
  {
    href: "/upload",
    title: "Upload",
    description:
      "Upload Foundation AR detail and aging reports. New uploads replace prior data.",
  },
];

export default function HomePage() {
  return (
    <section
      aria-labelledby="ar-reports-heading"
      className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mb-12 flex items-baseline justify-between gap-6 md:mb-16">
        <span className="eyebrow">AR Reports</span>
        <h1
          id="ar-reports-heading"
          className="display max-w-[560px] text-right text-[24px] leading-[1.1] sm:text-[28px] md:text-[36px]"
        >
          Accounts receivable.{" "}
          <span className="display-italic">Aging, ranked, forecast.</span>
        </h1>
      </div>

      <ul className="feature-grid" role="list">
        {cards.map((card, i) => (
          <li key={card.title} role="listitem" className="contents">
            <Link
              href={card.href}
              className="feature-card group"
              aria-label={`${card.title} — ${card.description}`}
            >
              <span
                className="mono text-[12px] tracking-tight text-[var(--muted)]"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-8 text-[22px] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)] md:text-[24px]">
                {card.title}
              </h2>
              <p className="mt-3 text-[14.5px] font-light leading-[1.55] text-[var(--muted)] md:text-[15px]">
                {card.description}
              </p>
              <span
                className="arrow mt-auto pt-8 text-[18px] text-[var(--foreground)]"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
