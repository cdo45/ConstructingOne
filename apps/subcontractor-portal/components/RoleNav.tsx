"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, loadSession, SessionUser } from "@/lib/client";

/**
 * Role-aware nav rendered into PageShell's `nav` slot.
 * Returns null until a session loads, so the unauthed login route
 * shows the wordmark only.
 */
export default function RoleNav() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(loadSession());
  }, []);

  if (!user) return null;

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <>
      {user.role !== "subcontractor" && (
        <>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/projects">Projects</Link>
          </li>
        </>
      )}
      {user.role === "subcontractor" && (
        <li>
          <Link href="/sub-portal">My Projects</Link>
        </li>
      )}
      <li
        style={{
          paddingLeft: 20,
          borderLeft: "1px solid var(--hairline)",
          display: "flex",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div style={{ color: "var(--foreground)" }}>
            {user.companyName || user.name}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 10 }}>
            {user.role.toUpperCase()}
          </div>
        </div>
        <button onClick={logout} className="btn" style={{ padding: "6px 12px" }}>
          Sign out
        </button>
      </li>
    </>
  );
}
