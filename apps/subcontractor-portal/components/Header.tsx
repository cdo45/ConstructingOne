"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, loadSession, SessionUser } from "@/lib/client";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(loadSession());
  }, []);

  function logout() {
    clearSession();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-secondary)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Link
          href={user.role === "subcontractor" ? "/sub-portal" : "/dashboard"}
          style={{
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.02em"
          }}
        >
          VANCE CORP
        </Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 13 }}>
          {user.role !== "subcontractor" && (
            <>
              <Link href="/dashboard" style={{ color: "var(--text-secondary)" }}>
                Dashboard
              </Link>
              <Link href="/projects" style={{ color: "var(--text-secondary)" }}>
                Projects
              </Link>
            </>
          )}
          {user.role === "subcontractor" && (
            <Link href="/sub-portal" style={{ color: "var(--text-secondary)" }}>
              My Projects
            </Link>
          )}
        </nav>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "var(--text-primary)" }}>{user.companyName || user.name}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
            {user.email} — {user.role.toUpperCase()}
          </div>
        </div>
        <button className="btn" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
