import type { Metadata } from "next";
import { serif, sans, mono } from "@constructingone/ui/fonts";
import "@constructingone/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConstructingOne — Accounting and project management for contractors",
  description:
    "Accounting and project management software built for modern contractors. AR, WIP, billing, and core metrics in one place.",
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
      <body>{children}</body>
    </html>
  );
}
