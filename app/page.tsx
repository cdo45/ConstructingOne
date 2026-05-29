import Link from "next/link";

const features = [
  {
    index: "01",
    name: "AR Reports",
    description:
      "Customer aging, collections forecasting, and billed-vs-collected analysis. Built for contractors who need to know who owes what — and when it's coming.",
    href: "/ar-reports",
  },
  {
    index: "02",
    name: "Core Metrics",
    description:
      "Weekly KPI dashboard with drilldowns across revenue, margin, backlog, and cash. The pulse of the business in a single view.",
    href: "/core-metrics",
  },
  {
    index: "03",
    name: "Subcontractor Portal",
    description:
      "Streamlined sub billing intake, lien waiver tracking, and pay app approvals. Subs upload, you approve, accounting pays.",
    href: "/subcontractor-portal",
  },
  {
    index: "04",
    name: "Fixed Assets",
    description:
      "Equipment register with depreciation schedules, location tracking, and disposal workflows. Built for fleets that move.",
    href: "/fixed-assets",
  },
  {
    index: "05",
    name: "WIP Reports",
    description:
      "Percentage-of-completion schedules with full audit trail, variance analysis, and executive summaries. The schedule your CFO wants and your auditor accepts.",
    href: "/wip-report",
  },
  {
    index: "06",
    name: "AR Billing",
    description:
      "AIA-style billing, change order management, and invoice tracking. From contract to collection without the spreadsheet sprawl.",
    href: "/ar-billing",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-hairline">
        <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
          <div className="flex h-16 items-center justify-between md:h-20">
            <Link
              href="/"
              className="wordmark text-xl md:text-2xl"
              aria-label="ConstructingOne home"
            >
              ConstructingOne
            </Link>
            <nav aria-label="Primary">
              <ul className="flex items-center gap-7 text-sm text-muted md:gap-9">
                <li>
                  <Link
                    href="#features"
                    className="transition-colors hover:text-foreground"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="transition-colors hover:text-foreground"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#signin"
                    className="transition-colors hover:text-foreground"
                  >
                    Sign in
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
          <div className="flex min-h-[64vh] flex-col justify-center py-24 md:py-32">
            <h1 className="display rise rise-1 max-w-[16ch] text-[2.75rem] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Accounting and project management.{" "}
              <em>Built for contractors.</em>
            </h1>
            <p className="rise rise-2 mt-8 max-w-[44ch] text-lg text-muted md:text-xl">
              The financial and operational backbone for modern construction
              firms — from first invoice to final retention.
            </p>
            <div className="rise rise-3 mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link
                href="#features"
                className="inline-flex items-center justify-center bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Explore the platform
              </Link>
              <Link
                href="#signin"
                className="group inline-flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <span className="border-b border-transparent transition-colors group-hover:border-foreground">
                  Sign in
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="border-t border-hairline"
        >
          <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
            <div className="py-16 md:py-24">
              <p className="eyebrow" id="features-heading">
                What&rsquo;s inside
              </p>

              <div className="feature-grid mt-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:mt-12">
                {features.map((feature) => (
                  <Link
                    key={feature.index}
                    href={feature.href}
                    className="feature-card group"
                  >
                    <span className="mono-index text-sm text-muted">
                      {feature.index}
                    </span>
                    <h2 className="display mt-8 text-2xl md:text-[1.75rem]">
                      {feature.name}
                    </h2>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                      {feature.description}
                    </p>
                    <span
                      aria-hidden="true"
                      className="card-arrow mt-8 text-lg text-foreground"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline">
        <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
          <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
            <span className="wordmark text-lg">ConstructingOne</span>
            <div className="flex items-center gap-7 text-sm text-muted">
              <Link
                href="#privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="#terms"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
            </div>
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} ConstructingOne
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
