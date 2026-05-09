// Billing calculation helpers.
// All math is done with Number() converted from Prisma Decimals.
// Production Postgres will use same logic; just ensure Number() precision
// is fine for USD amounts < 1e12.

export interface LineItemLike {
  contractType: string;
  scheduledValue: number | string;
  unitPrice?: number | string | null;
  scheduledQty?: number | string | null;
}

export interface BillingInput {
  percentComplete?: number | null;
  qtyThisPeriod?: number | null;
  qtyCumulative?: number | null;
  previousCumulative?: number;
}

export interface BillingComputed {
  valueThisPeriod: number;
  valueCumulative: number;
  balanceToFinish: number;
  percentComplete: number;
}

export function computeBillingValues(
  lineItem: LineItemLike,
  input: BillingInput
): BillingComputed {
  const scheduledValue = Number(lineItem.scheduledValue);
  const previousCumulative = Number(input.previousCumulative || 0);

  if (lineItem.contractType === "lump_sum") {
    const pct = Number(input.percentComplete ?? 0);
    const valueCumulative = round2((scheduledValue * pct) / 100);
    const valueThisPeriod = round2(valueCumulative - previousCumulative);
    const balanceToFinish = round2(scheduledValue - valueCumulative);
    return {
      valueThisPeriod,
      valueCumulative,
      balanceToFinish,
      percentComplete: pct
    };
  }

  // unit_price
  const unitPrice = Number(lineItem.unitPrice || 0);
  const qtyThis = Number(input.qtyThisPeriod || 0);
  const qtyCum = Number(input.qtyCumulative ?? 0);
  const scheduledQty = Number(lineItem.scheduledQty || 0);
  const valueThisPeriod = round2(unitPrice * qtyThis);
  const valueCumulative = round2(unitPrice * qtyCum);
  const balanceToFinish = round2(scheduledValue - valueCumulative);
  const percentComplete = scheduledQty > 0 ? round2((qtyCum / scheduledQty) * 100) : 0;
  return {
    valueThisPeriod,
    valueCumulative,
    balanceToFinish,
    percentComplete
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function fmtUSD(n: number | string | null | undefined): string {
  const v = Number(n || 0);
  return (
    "$" +
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

export function fmtPct(n: number | string | null | undefined): string {
  const v = Number(n || 0);
  return v.toFixed(2) + "%";
}

export function fmtQty(n: number | string | null | undefined): string {
  const v = Number(n || 0);
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}
