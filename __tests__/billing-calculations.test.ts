import { computeBillingValues, fmtUSD, fmtPct } from "../lib/calc";

describe("computeBillingValues", () => {
  test("lump sum at 50% of $100k yields $50k cumulative", () => {
    const r = computeBillingValues(
      { contractType: "lump_sum", scheduledValue: 100000 },
      { percentComplete: 50 }
    );
    expect(r.valueCumulative).toBe(50000);
    expect(r.valueThisPeriod).toBe(50000); // no prior
    expect(r.balanceToFinish).toBe(50000);
  });

  test("lump sum with prior 20% -> this period = 30% when now 50%", () => {
    const r = computeBillingValues(
      { contractType: "lump_sum", scheduledValue: 100000 },
      { percentComplete: 50, previousCumulative: 20000 }
    );
    expect(r.valueCumulative).toBe(50000);
    expect(r.valueThisPeriod).toBe(30000);
    expect(r.balanceToFinish).toBe(50000);
  });

  test("unit price: 850 TON x $95 = $80,750", () => {
    const r = computeBillingValues(
      {
        contractType: "unit_price",
        scheduledValue: 380000,
        unitPrice: 95,
        scheduledQty: 4000
      },
      { qtyThisPeriod: 850, qtyCumulative: 850 }
    );
    expect(r.valueThisPeriod).toBe(80750);
    expect(r.valueCumulative).toBe(80750);
    expect(r.balanceToFinish).toBe(299250);
    expect(r.percentComplete).toBe(21.25); // 850/4000 * 100
  });

  test("unit price cumulative across multiple periods", () => {
    const period1 = computeBillingValues(
      {
        contractType: "unit_price",
        scheduledValue: 100000,
        unitPrice: 10,
        scheduledQty: 10000
      },
      { qtyThisPeriod: 1000, qtyCumulative: 1000 }
    );
    const period2 = computeBillingValues(
      {
        contractType: "unit_price",
        scheduledValue: 100000,
        unitPrice: 10,
        scheduledQty: 10000
      },
      { qtyThisPeriod: 2500, qtyCumulative: 3500 }
    );
    expect(period1.valueCumulative).toBe(10000);
    expect(period2.valueThisPeriod).toBe(25000);
    expect(period2.valueCumulative).toBe(35000);
    expect(period2.balanceToFinish).toBe(65000);
  });

  test("balance to finish is scheduled minus cumulative", () => {
    const r = computeBillingValues(
      { contractType: "lump_sum", scheduledValue: 75000 },
      { percentComplete: 40 }
    );
    expect(r.balanceToFinish).toBe(45000);
  });

  test("CO amount impact: adjusted contract = base + approved COs", () => {
    const baseContract = 2850000;
    const coApproved = [67400]; // one customer-approved CO
    const adjusted = baseContract + coApproved.reduce((a, b) => a + b, 0);
    expect(adjusted).toBe(2917400);
  });

  test("fmtUSD formats with two decimals and commas", () => {
    expect(fmtUSD(1234567.8)).toBe("$1,234,567.80");
    expect(fmtUSD(0)).toBe("$0.00");
  });

  test("fmtPct has 2 decimal places", () => {
    expect(fmtPct(21.253)).toBe("21.25%");
    expect(fmtPct(100)).toBe("100.00%");
  });
});
