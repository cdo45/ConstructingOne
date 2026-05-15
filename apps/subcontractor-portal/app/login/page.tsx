"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        setErr(json.error || "Login failed");
        return;
      }
      saveSession({
        userId: json.data.userId,
        email: json.data.email,
        name: json.data.name,
        role: json.data.role,
        companyName: json.data.companyName,
        token: json.data.token
      });
      if (json.data.role === "subcontractor") router.push("/sub-portal");
      else router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <form onSubmit={submit} className="card" style={{ width: 380, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em"
            }}
          >
            CONSTRUCTINGONE
          </div>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginTop: 4
            }}
          >
            Subcontractor Billing Portal
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {err && (
          <div
            style={{
              color: "var(--danger)",
              fontSize: 13,
              marginBottom: 14
            }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", padding: "10px 14px" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.6
          }}
        >
          <div style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Test Credentials
          </div>
          <div>admin@example.com / test1234</div>
          <div>pm1@example.com / test1234</div>
          <div>sub1@acme.com / test1234</div>
        </div>
      </form>
    </main>
  );
}
