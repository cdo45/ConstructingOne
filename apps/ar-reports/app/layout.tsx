import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vance AR Analysis Tool",
  description: "Accounts Receivable customer analysis for Vance Corp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
