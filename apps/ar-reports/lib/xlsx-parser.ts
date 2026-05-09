import * as XLSX from "xlsx";

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, unknown>[];
};

export function readWorkbookFromBuffer(buffer: Buffer): ParsedSheet {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) {
    return { headers: [], rows: [] };
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  // Pull headers from the first row of the sheet (range A1:?1) so we can
  // validate header presence even on empty data files.
  const headers: string[] = [];
  const ref = ws["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
      const cell = ws[addr];
      const v = cell?.v;
      headers.push(typeof v === "string" ? v.trim() : v == null ? "" : String(v));
    }
  }

  // Trim whitespace from row keys to match trimmed headers.
  const cleaned = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(row)) {
      out[k.trim()] = row[k];
    }
    return out;
  });

  return { headers, rows: cleaned };
}

export function validateRequiredHeaders(
  headers: string[],
  required: string[]
): { ok: true } | { ok: false; missing: string[] } {
  const set = new Set(headers);
  const missing = required.filter((r) => !set.has(r));
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

export function toText(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export function toTrimmedText(v: unknown): string | null {
  const t = toText(v);
  return t == null ? null : t.trim();
}

export function toNumber(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function toInteger(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[,\s]/g, ""));
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

/**
 * Convert any value xlsx might return for a date cell to an ISO date string
 * (YYYY-MM-DD), or null. Handles JS Date objects (cellDates:true), Excel
 * serial numbers, and date-shaped strings.
 */
export function toIsoDate(v: unknown): string | null {
  if (v == null || v === "") return null;

  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return formatIsoDate(v);
  }

  // Excel serial number — Excel epoch is 1899-12-30 (accounting for the
  // 1900 leap-year bug). cellDates:true normally handles this, but be safe.
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return formatIsoDate(d);
  }

  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return formatIsoDate(d);
  }

  return null;
}

function formatIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function diffDays(later: string | null, earlier: string | null): number | null {
  if (!later || !earlier) return null;
  const a = Date.parse(later + "T00:00:00Z");
  const b = Date.parse(earlier + "T00:00:00Z");
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86400000);
}
