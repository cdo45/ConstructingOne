import type { Metadata } from "next";
import Link from "next/link";
import { serif, sans, mono } from "@constructingone/ui/fonts";
import { PageShell } from "@constructingone/ui";
import "@constructingone/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR Billing — ConstructingOne",
  description:
    "AIA-style billing, change order management, and invoice tracking for contractors.",
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
                <Link href="/">Entry</Link>
              </li>
              <li>
                <Link href="/customers">Customers</Link>
              </li>
              <li>
                <Link href="/jobs">Jobs</Link>
              </li>
              <li>
                <Link href="/invoices">Invoices</Link>
              </li>
              <li>
                <Link href="/reports">Reports</Link>
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
