"use client";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "pm" | "subcontractor";
  companyName: string | null;
  token: string;
}

const STORAGE_KEY = "co-session";

export function saveSession(u: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  document.cookie = `token=${encodeURIComponent(u.token)}; path=/; max-age=604800; SameSite=Lax`;
}

export function loadSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "token=; path=/; max-age=0";
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const session = loadSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as any) || {})
  };
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const res = await fetch(path, { ...options, headers });
  try {
    const json = await res.json();
    return { data: json.data, error: json.error, status: res.status };
  } catch {
    return { data: null, error: "Parse error", status: res.status };
  }
}

export function requireRoleOnMount(
  roles: Array<"admin" | "pm" | "subcontractor">,
  onRedirect: (path: string) => void
) {
  const s = loadSession();
  if (!s) {
    onRedirect("/login");
    return null;
  }
  if (!roles.includes(s.role)) {
    if (s.role === "subcontractor") onRedirect("/sub-portal");
    else onRedirect("/dashboard");
    return null;
  }
  return s;
}
