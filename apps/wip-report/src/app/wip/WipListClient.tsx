"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WipReport {
  id: number;
  period_date: string | Date;
  status: string;
  finalized_at: string | Date | null;
  created_at: string | Date;
}

// Always format as YYYY-MM-DD in UTC — avoids server/client hydration mismatch
// from toLocaleDateString() which uses the system timezone (UTC on Vercel,
// browser timezone on the client, producing different strings).
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

interface ActiveJob {
  id: number;
  job_number: string;
  job_name: string;
}

export default function WipListClient({
  reports: initialReports,
  activeJobs,
  readyToCloseJobIds,
}: {
  reports: WipReport[];
  activeJobs: ActiveJob[];
  readyToCloseJobIds: number[];
}) {
  const router = useRouter();
  const readyToCloseSet = new Set(readyToCloseJobIds);
  const [reports, setReports] = useState<WipReport[]>(initialReports);
  const [modalOpen, setModalOpen] = useState(false);
  const [periodDate, setPeriodDate] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<number | null>(null);

  async function handleDeleteReport(id: number, periodDate: string | Date) {
    const label = formatDate(periodDate);
    if (!confirm(`Delete draft WIP Report for ${label}? This cannot be undone.`)) return;
    setDeletingReport(id);
    try {
      const res = await fetch(`/api/wip-reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete report.");
      }
    } catch {
      alert("Failed to delete report.");
    } finally {
      setDeletingReport(null);
    }
  }

  function toggleJob(id: number) {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function openModal() {
    setModalOpen(true);
    setError(null);
    setPeriodDate("");
    // Exclude "Ready to Close" jobs by default — they can still be re-checked manually
    setSelectedJobIds(new Set(activeJobs.filter((j) => !readyToCloseSet.has(j.id)).map((j) => j.id)));
  }

  async function handleCreate() {
    if (!periodDate) { setError("Please select a period end date."); return; }
    if (selectedJobIds.size === 0) { setError("Please select at least one job."); return; }

    setCreating(true);
    setError(null);

    const res = await fetch("/api/wip-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period_date: periodDate, job_ids: Array.from(selectedJobIds) }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create report.");
      setCreating(false);
      return;
    }

    const report = await res.json();
    router.push(`/wip/${report.id}`);
  }

  const statusBadge = (status: string) =>
    status === "final"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="px-4 py-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">WIP Reports</h1>
          <button
            onClick={openModal}
            className="bg-[var(--foreground)] hover:bg-[var(--foreground)] text-white font-bold px-5 py-2 rounded transition-colors"
          >
            + New WIP Report
          </button>
        </div>

        {reports.length === 0 ? (
          <p className="text-[var(--muted)] py-20 text-center">No reports yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--hairline)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--foreground)] text-white text-left">
                  <th className="px-4 py-3 font-semibold">Period Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Finalized</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-[var(--surface)]"} hover:bg-[var(--surface)] transition-colors`}
                  >
                    <td className="px-4 py-2 font-mono text-[var(--foreground)]">
                      {formatDate(r.period_date)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[var(--muted)]">
                      {formatDate(r.finalized_at)}
                    </td>
                    <td className="px-4 py-2 text-[var(--muted)]">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <Link
                          href={`/wip/${r.id}`}
                          className="text-xs border border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)]/10 px-3 py-1 rounded transition-colors"
                        >
                          {r.status === "draft" ? "Edit" : "View"}
                        </Link>
                        {r.status !== "draft" && (
                          <Link
                            href={`/wip/${r.id}?edit=1`}
                            className="text-xs border border-[#D97706] text-[#D97706] hover:bg-[#D97706]/10 px-3 py-1 rounded transition-colors"
                          >
                            Edit
                          </Link>
                        )}
                        {r.status === "draft" && (
                          <button
                            onClick={() => handleDeleteReport(r.id, r.period_date)}
                            disabled={deletingReport === r.id}
                            className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            {deletingReport === r.id ? "..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-[var(--hairline)] rounded-lg w-full max-w-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-5">New WIP Report</h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-[var(--foreground)] mb-1">Period End Date *</label>
              <input
                type="date"
                value={periodDate}
                onChange={(e) => setPeriodDate(e.target.value)}
                className="w-full bg-white border border-[var(--hairline)] text-[var(--foreground)] rounded px-3 py-2 focus:outline-none focus:border-[var(--foreground)]"
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[var(--foreground)]">Include Jobs *</label>
                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => setSelectedJobIds(new Set(activeJobs.map((j) => j.id)))}
                    className="text-[var(--foreground)] hover:underline"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedJobIds(new Set(activeJobs.filter((j) => !readyToCloseSet.has(j.id)).map((j) => j.id)))}
                    className="text-[var(--muted)] hover:underline"
                  >
                    Exclude Closed
                  </button>
                  <button
                    onClick={() => setSelectedJobIds(new Set())}
                    className="text-[var(--muted)] hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {readyToCloseJobIds.length > 0 && (
                <p className="text-xs text-[var(--muted)] bg-gray-50 border border-[var(--hairline)] rounded px-3 py-1.5 mb-2">
                  {readyToCloseJobIds.length} job{readyToCloseJobIds.length !== 1 ? "s" : ""} from the prior period{" "}
                  {readyToCloseJobIds.length !== 1 ? "are" : "is"} 100% complete with no activity — excluded by default.
                </p>
              )}
              <div className="max-h-56 overflow-y-auto border border-[var(--hairline)] rounded">
                {activeJobs.length === 0 ? (
                  <p className="text-[var(--muted)] text-sm px-3 py-4 text-center">
                    No active jobs found.
                  </p>
                ) : (
                  activeJobs.map((job) => {
                    const isRtc = readyToCloseSet.has(job.id);
                    return (
                      <label
                        key={job.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--surface)] cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedJobIds.has(job.id)}
                          onChange={() => toggleJob(job.id)}
                          className="accent-[var(--foreground)]"
                        />
                        <span className="font-mono text-[var(--muted)] w-12 shrink-0">
                          {job.job_number}
                        </span>
                        <span className={`flex-1 ${isRtc ? "text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                          {job.job_name}
                        </span>
                        {isRtc && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded">
                            Ready to Close
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="bg-[var(--foreground)] hover:bg-[var(--foreground)] disabled:opacity-50 text-white font-bold px-5 py-2 rounded transition-colors"
              >
                {creating ? "Creating..." : "Create Report"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="border border-[var(--hairline)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] px-5 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
