import Link from "next/link";
import { PageShell } from "@constructingone/ui";

const features = [
  {
    index: "01",
    title: "AR Reports",
    description:
      "Customer aging, collections forecasting, and billed-vs-collected analysis. Built for contractors who need to know who owes what — and when it's coming.",
    href: "/ar-reports",
  },
  {
    index: "02",
    title: "Core Metrics",
    description:
      "Weekly KPI dashboard with drilldowns across revenue, margin, backlog, and cash. The pulse of the business in a single view.",
    href: "/core-metrics",
  },
  {
    index: "03",
    title: "Subcontractor Portal",
    description:
      "Streamlined sub billing intake, lien waiver tracking, and pay app approvals. Subs upload, you approve, accounting pays.",
    href: "/subcontractor-portal",
  },
  {
    index: "04",
    title: "WIP Reports",
    description:
      "Percentage-of-completion schedules with full audit trail, variance analysis, and executive summaries. The schedule your CFO wants and your auditor accepts.",
    href: "/wip-report",
  },
  {
    index: "05",
    title: "AR Billing",
    description:
      "AIA-style billing, change order management, and invoice tracking. From contract to collection without the spreadsheet sprawl.",
    href: "/ar-billing",
  },
];

export default function Home() {
  return (
    <PageShell
      nav={
        <>
          <li>
            <Link href="#features">Features</Link>
          </li>
          <li>
            <Link href="/pricing">Pricing</Link>
          </li>
          <li>
            <Link href="/sign-in">Sign in</Link>
          </li>
        </>
      }
      footerLinks={
        <>
          <li>
            <Link href="/privacy">Privacy</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </>
      }
    >
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="mx-auto max-w-[1200px] px-6 pb-28 pt-24 md:px-10 md:pb-40 md:pt-36 lg:pb-48 lg:pt-44"
      >
        <div className="max-w-[920px]">
          <h1
            id="hero-heading"
            className="display rise text-[44px] sm:text-[60px] md:text-[84px] lg:text-[104px]"
            style={{ animationDelay: "60ms" }}
          >
            Accounting and project
            <br />
            management.{" "}
            <span className="display-italic text-[var(--muted)]">
              Built for contractors.
            </span>
          </h1>

          <p
            className="rise mt-8 max-w-[560px] text-[17px] font-light leading-[1.55] text-[var(--muted)] md:mt-10 md:text-[19px]"
            style={{ animationDelay: "200ms" }}
          >
            One platform for the financial and operational work that runs a
            construction business — from WIP to AR, billing to backlog.
          </p>

          <div
            className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-14"
            style={{ animationDelay: "320ms" }}
          >
            <Link href="#features" className="cone-button cone-button--primary">
              See what&rsquo;s inside
            </Link>
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 text-[14px] font-medium text-[var(--foreground)]"
            >
              <span className="border-b border-transparent transition-colors duration-200 group-hover:border-[var(--foreground)]">
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

      {/* Features */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="border-t border-[var(--hairline)]"
      >
        <div className="mx-auto max-w-[1200px] px-6 py-20 md:px-10 md:py-28 lg:py-32">
          <div className="mb-12 flex items-baseline justify-between gap-6 md:mb-16">
            <span className="eyebrow">What&rsquo;s inside</span>
            <h2
              id="features-heading"
              className="display max-w-[520px] text-right text-[24px] leading-[1.1] sm:text-[28px] md:text-[36px]"
            >
              Five modules. One{" "}
              <span className="display-italic">system of record.</span>
            </h2>
          </div>

          <ul className="feature-grid" role="list">
            {features.map((f) => (
              <li key={f.index} role="listitem" className="contents">
                <Link
                  href={f.href}
                  className="feature-card group"
                  aria-label={`${f.title} — ${f.description}`}
                >
                  <span
                    className="mono text-[12px] tracking-tight text-[var(--muted)]"
                    aria-hidden="true"
                  >
                    {f.index}
                  </span>
                  <h3 className="mt-8 text-[22px] font-medium leading-tight tracking-[-0.01em] text-[var(--foreground)] md:text-[24px]">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] font-light leading-[1.55] text-[var(--muted)] md:text-[15px]">
                    {f.description}
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
        </div>
      </section>
    </PageShell>
  );
}
