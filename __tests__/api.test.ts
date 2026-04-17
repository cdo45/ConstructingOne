// Integration tests — require dev server running at http://localhost:3000
// Run: npm run dev (in another terminal) then npm test

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const j = await r.json();
  return j.data;
}

async function authedFetch(token: string, path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(init.headers as any)
  };
  return fetch(`${BASE}${path}`, { ...init, headers });
}

let pmToken = "";
let subToken = "";
let otherSubToken = "";

beforeAll(async () => {
  const pm = await login("pm1@vance.com", "test1234");
  pmToken = pm.token;
  const sub = await login("sub1@acme.com", "test1234");
  subToken = sub.token;
  const other = await login("sub2@paving.com", "test1234");
  otherSubToken = other.token;
});

describe("auth", () => {
  test("login returns a valid JWT", async () => {
    expect(pmToken).toMatch(/^eyJ/);
    expect(pmToken.split(".").length).toBe(3);
  });

  test("login with bad password returns 401", async () => {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "pm1@vance.com", password: "wrong" })
    });
    expect(r.status).toBe(401);
  });
});

describe("role-based access", () => {
  test("sub cannot access /api/projects (admin/pm only)", async () => {
    const r = await authedFetch(subToken, "/api/projects");
    expect(r.status).toBe(403);
  });

  test("pm can access /api/projects", async () => {
    const r = await authedFetch(pmToken, "/api/projects");
    expect(r.status).toBe(200);
  });

  test("sub only sees their own contracts", async () => {
    const r = await authedFetch(subToken, "/api/sub/contracts");
    const j = await r.json();
    expect(r.status).toBe(200);
    // Sub1 (Acme) has only one contract on Proj1
    const projNums = j.data.map((c: any) => c.projectNumber);
    for (const p of projNums) {
      expect(["VC-2026-001"]).toContain(p);
    }
  });
});

describe("billing review", () => {
  test("pm can view the submitted period", async () => {
    const r = await authedFetch(pmToken, "/api/projects");
    const projects = (await r.json()).data;
    const proj = projects.find((p: any) => p.pendingBillings > 0);
    expect(proj).toBeTruthy();

    const detail = await authedFetch(pmToken, `/api/projects/${proj.id}`);
    const dj = await detail.json();
    const submittedPeriod = dj.data.billingPeriods.find(
      (bp: any) => bp.status === "submitted"
    );
    expect(submittedPeriod).toBeTruthy();
    const period = await authedFetch(pmToken, `/api/billing/period/${submittedPeriod.id}`);
    expect(period.status).toBe(200);
  });
});

describe("change order status flow", () => {
  test("CO transitions pending -> pm_approved -> customer_approved", async () => {
    // Find a project to create CO on
    const r = await authedFetch(pmToken, "/api/projects");
    const projects = (await r.json()).data;
    const active = projects.find((p: any) => p.status === "active");
    expect(active).toBeTruthy();

    // PM-initiated CO
    const create = await authedFetch(pmToken, `/api/projects/${active.id}/change-orders`, {
      method: "POST",
      body: JSON.stringify({
        description: "Test CO " + Date.now(),
        amount: 1234.56,
        initiatedBy: "customer"
      })
    });
    const cj = await create.json();
    expect(create.status).toBe(201);
    const coId = cj.data.id;

    const approve = await authedFetch(pmToken, `/api/change-orders/${coId}/pm-approve`, {
      method: "POST",
      body: JSON.stringify({ comments: "ok" })
    });
    expect(approve.status).toBe(200);
    expect((await approve.json()).data.status).toBe("pm_approved");

    const custApprove = await authedFetch(
      pmToken,
      `/api/change-orders/${coId}/customer-approve`,
      { method: "POST" }
    );
    expect(custApprove.status).toBe(200);
    expect((await custApprove.json()).data.status).toBe("customer_approved");
  });
});
