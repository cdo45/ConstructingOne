import type { Metadata } from "next";
import { serif, sans, mono } from "@constructingone/ui/fonts";
import { PageShell } from "@constructingone/ui";
import "@constructingone/ui/styles";
import "./globals.css";
import RoleNav from "@/components/RoleNav";

export const metadata: Metadata = {
  title: "Subcontractor Portal — ConstructingOne",
  description:
    "Streamlined sub billing intake, lien-waiver tracking, and pay-app approvals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <PageShell nav={<RoleNav />}>{children}</PageShell>
      </body>
    </html>
  );
}
