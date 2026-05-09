import * as React from "react";
import Link from "next/link";

type PageShellProps = {
  children: React.ReactNode;
  /** <li> elements rendered into the primary <nav> on the right side of the header. */
  nav?: React.ReactNode;
  /** <li> elements rendered into the right side of the footer. */
  footerLinks?: React.ReactNode;
  /** Override the wordmark href (defaults to `/`). */
  homeHref?: string;
};

export function PageShell({
  children,
  nav,
  footerLinks,
  homeHref = "/",
}: PageShellProps) {
  return (
    <>
      <header className="cone-header">
        <div className="cone-header__inner">
          <Link
            href={homeHref}
            className="wordmark"
            aria-label="ConstructingOne home"
          >
            ConstructingOne
          </Link>
          {nav ? (
            <nav aria-label="Primary">
              <ul className="cone-nav">{nav}</ul>
            </nav>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
      <footer className="cone-footer">
        <div className="cone-footer__inner">
          <div className="cone-footer__brand">
            <span className="wordmark cone-footer__wordmark">
              ConstructingOne
            </span>
            <span aria-hidden="true">·</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          {footerLinks ? (
            <ul className="cone-footer__links">{footerLinks}</ul>
          ) : null}
        </div>
      </footer>
    </>
  );
}
