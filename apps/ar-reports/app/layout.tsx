import type { Metadata } from "next";
import Link from "next/link";
import { serif, sans, mono } from "@constructingone/ui/fonts";
import { PageShell } from "@constructingone/ui";
import "@constructingone/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR Reports — ConstructingOne",
  description:
    "Customer aging, collections forecasting, and billed-vs-collected analysis for contractors.",
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
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/customers">Customers</Link>
              </li>
              <li>
                <Link href="/rankings">Rankings</Link>
              </li>
              <li>
                <Link href="/forecast">Forecast</Link>
              </li>
              <li>
                <Link href="/upload">Upload</Link>
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
