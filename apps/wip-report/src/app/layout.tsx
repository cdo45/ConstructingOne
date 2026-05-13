import type { Metadata } from "next";
import Link from "next/link";
import { serif, sans, mono } from "@constructingone/ui/fonts";
import { PageShell } from "@constructingone/ui";
import "@constructingone/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "WIP Reports — ConstructingOne",
  description:
    "Percentage-of-completion schedules with full audit trail, variance analysis, and executive summaries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <PageShell
          nav={
            <>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/jobs">Jobs</Link>
              </li>
              <li>
                <Link href="/wip">WIP Report</Link>
              </li>
              <li>
                <Link href="/history">History</Link>
              </li>
            </>
          }
        >
          {children}
        </PageShell>
      </body>
    </html>
  );
}
