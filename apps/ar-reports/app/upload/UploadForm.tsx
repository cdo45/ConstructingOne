"use client";

import { useEffect, useState } from "react";

type LatestInfo = {
  id: number;
  filename: string | null;
  uploaded_at: string;
  row_count: number | null;
};

type LatestResponse = {
  ar_detail: LatestInfo | null;
  ar_aging: LatestInfo | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success"; rowCount: number; skipped: number }
  | { kind: "error"; message: string };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function LatestPanel({ label, info }: { label: string; info: LatestInfo | null }) {
  if (!info) {
    return (
      <p className="mt-2 text-xs text-gray-500">No {label} uploaded yet.</p>
    );
  }
  return (
    <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
      <div>
        <span className="font-semibold">{label}:</span> {info.filename ?? "(no filename)"}
      </div>
      <div>
        Uploaded {formatDate(info.uploaded_at)} · {info.row_count ?? 0} rows
      </div>
    </div>
  );
}

function UploadSection({
  title,
  endpoint,
  latest,
  onSuccess,
}: {
  title: string;
  endpoint: string;
  latest: LatestInfo | null;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus({ kind: "error", message: "Please select a file." });
      return;
    }
    setStatus({ kind: "uploading" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = (await res.json()) as
        | { success: true; rowCount: number; skipped?: number }
        | { success: false; error: string };
      if (!res.ok || !("success" in data) || !data.success) {
        const msg = "error" in data ? data.error : `HTTP ${res.status}`;
        setStatus({ kind: "error", message: msg });
        return;
      }
      setStatus({
        kind: "success",
        rowCount: data.rowCount,
        skipped: data.skipped ?? 0,
      });
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", message: msg });
    }
  };

  return (
    <section className="border border-[var(--hairline)] bg-[var(--background)]">
      <header className="bg-[var(--foreground)] text-[var(--background)] px-4 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      <form onSubmit={handleSubmit} className="p-4">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[var(--foreground)] file:mr-4 file:rounded-none file:border file:border-[var(--hairline)] file:bg-[var(--surface)] file:px-3 file:py-1 file:text-sm file:font-semibold hover:file:bg-[var(--background)]"
        />
        <button
          type="submit"
          disabled={!file || status.kind === "uploading"}
          className="cone-button cone-button--primary mt-4"
        >
          {status.kind === "uploading" ? "Uploading..." : "Upload"}
        </button>

        {status.kind === "success" && (
          <p className="mt-3 rounded bg-green-50 p-2 text-xs text-green-800">
            Uploaded {status.rowCount} rows
            {status.skipped > 0 ? ` (${status.skipped} skipped)` : ""}.
          </p>
        )}
        {status.kind === "error" && (
          <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-800 whitespace-pre-wrap">
            {status.message}
          </p>
        )}

        <LatestPanel label="Latest" info={latest} />
      </form>
    </section>
  );
}

export default function UploadForm() {
  const [latest, setLatest] = useState<LatestResponse>({
    ar_detail: null,
    ar_aging: null,
  });
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/uploads/latest", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as LatestResponse;
      setLatest(data);
    } catch {
      // ignore — display stays stale until next refresh
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UploadSection
        title="Upload AR Detail Report"
        endpoint="/api/uploads/ar-detail"
        latest={loaded ? latest.ar_detail : null}
        onSuccess={refresh}
      />
      <UploadSection
        title="Upload AR Aging Report"
        endpoint="/api/uploads/ar-aging"
        latest={loaded ? latest.ar_aging : null}
        onSuccess={refresh}
      />
    </div>
  );
}
