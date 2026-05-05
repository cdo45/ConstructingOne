// Number formatting helpers shared by tables and KPI cards.

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function fmtCurrency0(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return usd0.format(v);
}

export function fmtCurrency2(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return usd2.format(v);
}

export function fmtInt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return intFmt.format(v);
}

export function fmtDays(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return intFmt.format(Math.round(v));
}

export function fmtDecimal1(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return oneDecimal.format(v);
}

export function fmtPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

// --- Heatmap color helpers --------------------------------------------------

type RGB = [number, number, number];

const GOOD: RGB = [99, 190, 123];   // #63BE7B
const MID: RGB = [255, 235, 132];   // #FFEB84
const BAD: RGB = [248, 105, 107];   // #F8696B

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function rgbCss([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Three-stop gradient for "lower is better" metrics. Returns a CSS color.
 * Values <= low map to green; values >= high map to red; mid maps to yellow.
 */
export function heatLowerIsBetter(
  v: number | null | undefined,
  low: number,
  mid: number,
  high: number
): string | undefined {
  if (v == null || !Number.isFinite(v)) return undefined;
  if (v <= low) return rgbCss(GOOD);
  if (v >= high) return rgbCss(BAD);
  if (v <= mid) {
    const t = (v - low) / (mid - low);
    return rgbCss(lerpRgb(GOOD, MID, t));
  }
  const t = (v - mid) / (high - mid);
  return rgbCss(lerpRgb(MID, BAD, t));
}

/**
 * Two-stop gradient where 0 → red and 1 → green (for percentages).
 */
export function heatPercent(v: number | null | undefined): string | undefined {
  if (v == null || !Number.isFinite(v)) return undefined;
  const t = Math.max(0, Math.min(1, v));
  return rgbCss(lerpRgb(BAD, GOOD, t));
}

/**
 * Reconciliation diff: yellow if |v| > $1, red if |v| > $10K. Else no fill.
 */
export function heatReconcileDiff(
  v: number | null | undefined
): string | undefined {
  if (v == null || !Number.isFinite(v)) return undefined;
  const abs = Math.abs(v);
  if (abs > 10_000) return rgbCss(BAD);
  if (abs > 1) return rgbCss(MID);
  return undefined;
}
