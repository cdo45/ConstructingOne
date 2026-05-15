import type { Metadata } from "next";
import Link from "next/link";
import { serif, sans, mono } from "@constructingone/ui/fonts";
import { PageShell } from "@constructingone/ui";
import "@constructingone/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "Core Metrics — ConstructingOne",
  description:
    "Weekly KPI dashboard with drilldowns across revenue, margin, backlog, and cash.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                <Link href="/setup">Setup</Link>
              </li>
              <li>
                <Link href="/weeks">Weeks</Link>
              </li>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/import">Import</Link>
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
