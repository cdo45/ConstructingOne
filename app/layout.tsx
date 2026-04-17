import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vance Corp Sub Billing Portal",
  description: "Subcontractor billing and change order management"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
