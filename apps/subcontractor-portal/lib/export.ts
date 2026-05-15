import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { fmtUSD, fmtPct, fmtQty } from "./calc";

export interface G703Row {
  itemNumber: string;
  description: string;
  contractType: string;
  unit?: string | null;
  unitPrice?: number | null;
  scheduledQty?: number | null;
  scheduledValue: number;
  previousCumulative: number;
  qtyThisPeriod?: number;
  qtyCumulative?: number;
  percentComplete?: number;
  valueThisPeriod: number;
  valueCumulative: number;
  balanceToFinish: number;
}

export interface G703Header {
  projectNumber: string;
  projectName: string;
  client: string;
  subcontractor: string;
  period: string;
  contractValue?: number;
}

function totals(rows: G703Row[]) {
  return rows.reduce(
    (acc, r) => ({
      scheduledValue: acc.scheduledValue + Number(r.scheduledValue),
      previousCumulative: acc.previousCumulative + Number(r.previousCumulative),
      valueThisPeriod: acc.valueThisPeriod + Number(r.valueThisPeriod),
      valueCumulative: acc.valueCumulative + Number(r.valueCumulative),
      balanceToFinish: acc.balanceToFinish + Number(r.balanceToFinish)
    }),
    {
      scheduledValue: 0,
      previousCumulative: 0,
      valueThisPeriod: 0,
      valueCumulative: 0,
      balanceToFinish: 0
    }
  );
}

export function generatePDF(
  header: G703Header,
  rows: G703Row[],
  changeOrders: { coNumber: string; description: string; amount: number; status: string }[] = []
): Buffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const genDate = new Date().toLocaleString();

  // Header
  doc.setFontSize(14);
  doc.text("ConstructingOne — Continuation Sheet (G703 style)", 40, 40);
  doc.setFontSize(10);
  doc.text(`Project #: ${header.projectNumber}`, 40, 60);
  doc.text(`Project: ${header.projectName}`, 40, 74);
  doc.text(`Client: ${header.client}`, 40, 88);
  doc.text(`Subcontractor: ${header.subcontractor}`, 400, 60);
  doc.text(`Period: ${header.period}`, 400, 74);
  if (header.contractValue != null)
    doc.text(`Contract Value: ${fmtUSD(header.contractValue)}`, 400, 88);

  const body = rows.map((r) => [
    r.itemNumber,
    r.description,
    r.contractType === "lump_sum" ? "LS" : r.unit || "",
    r.contractType === "unit_price" && r.unitPrice ? fmtUSD(r.unitPrice) : "-",
    fmtUSD(r.scheduledValue),
    fmtUSD(r.previousCumulative),
    fmtUSD(r.valueThisPeriod),
    fmtUSD(r.valueCumulative),
    fmtPct(
      r.scheduledValue > 0
        ? (Number(r.valueCumulative) / Number(r.scheduledValue)) * 100
        : 0
    ),
    fmtUSD(r.balanceToFinish)
  ]);

  const t = totals(rows);
  body.push([
    "",
    "TOTAL",
    "",
    "",
    fmtUSD(t.scheduledValue),
    fmtUSD(t.previousCumulative),
    fmtUSD(t.valueThisPeriod),
    fmtUSD(t.valueCumulative),
    fmtPct(
      t.scheduledValue > 0 ? (t.valueCumulative / t.scheduledValue) * 100 : 0
    ),
    fmtUSD(t.balanceToFinish)
  ]);

  autoTable(doc, {
    startY: 110,
    head: [
      [
        "Item",
        "Description",
        "Unit",
        "Unit $",
        "Scheduled Value",
        "Previous Cum.",
        "This Period",
        "Cumulative",
        "% Complete",
        "Balance To Finish"
      ]
    ],
    body,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    footStyles: {},
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" }
    }
  });

  if (changeOrders.length) {
    const afterY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(11);
    doc.text("CHANGE ORDERS", 40, afterY);
    autoTable(doc, {
      startY: afterY + 6,
      head: [["CO #", "Description", "Amount", "Status"]],
      body: changeOrders.map((c) => [
        c.coNumber,
        c.description,
        fmtUSD(c.amount),
        c.status
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: 255 }
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `ConstructingOne Sub Billing Portal — Generated ${genDate} — Page ${i} of ${pageCount}`,
      40,
      doc.internal.pageSize.height - 20
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export function generateXLSX(
  header: G703Header,
  rows: G703Row[],
  changeOrders: { coNumber: string; description: string; amount: number; status: string }[] = []
): Buffer {
  const wb = XLSX.utils.book_new();

  const headerRows = [
    ["ConstructingOne — Continuation Sheet (G703 Style)"],
    ["Project #", header.projectNumber],
    ["Project", header.projectName],
    ["Client", header.client],
    ["Subcontractor", header.subcontractor],
    ["Period", header.period],
    []
  ];

  const tableHeader = [
    "Item",
    "Description",
    "Contract Type",
    "Unit",
    "Unit Price",
    "Scheduled Qty",
    "Scheduled Value",
    "Previous Cumulative",
    "Qty This Period",
    "Qty Cumulative",
    "% Complete",
    "Value This Period",
    "Value Cumulative",
    "Balance to Finish"
  ];

  const tableRows = rows.map((r) => [
    r.itemNumber,
    r.description,
    r.contractType,
    r.unit || "",
    r.unitPrice ?? "",
    r.scheduledQty ?? "",
    Number(r.scheduledValue),
    Number(r.previousCumulative),
    r.qtyThisPeriod ?? "",
    r.qtyCumulative ?? "",
    r.percentComplete != null
      ? Number(r.percentComplete)
      : r.scheduledValue > 0
      ? (Number(r.valueCumulative) / Number(r.scheduledValue)) * 100
      : 0,
    Number(r.valueThisPeriod),
    Number(r.valueCumulative),
    Number(r.balanceToFinish)
  ]);

  const t = totals(rows);
  const totalsRow = [
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    t.scheduledValue,
    t.previousCumulative,
    "",
    "",
    t.scheduledValue > 0 ? (t.valueCumulative / t.scheduledValue) * 100 : 0,
    t.valueThisPeriod,
    t.valueCumulative,
    t.balanceToFinish
  ];

  const data = [...headerRows, tableHeader, ...tableRows, totalsRow];
  if (changeOrders.length) {
    data.push([]);
    data.push(["Change Orders"]);
    data.push(["CO #", "Description", "Amount", "Status"]);
    for (const c of changeOrders) {
      data.push([c.coNumber, c.description, c.amount, c.status]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 40 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Billing");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

export function generateCSV(
  header: G703Header,
  rows: G703Row[]
): string {
  const lines: string[] = [];
  lines.push(
    `Project #,Project,Client,Subcontractor,Period`
  );
  lines.push(
    [
      header.projectNumber,
      header.projectName,
      header.client,
      header.subcontractor,
      header.period
    ]
      .map(csvEscape)
      .join(",")
  );
  lines.push("");
  lines.push(
    [
      "Item",
      "Description",
      "Contract Type",
      "Unit",
      "Unit Price",
      "Scheduled Qty",
      "Scheduled Value",
      "Previous Cumulative",
      "Qty This Period",
      "Qty Cumulative",
      "% Complete",
      "Value This Period",
      "Value Cumulative",
      "Balance to Finish"
    ]
      .map(csvEscape)
      .join(",")
  );
  for (const r of rows) {
    lines.push(
      [
        r.itemNumber,
        r.description,
        r.contractType,
        r.unit || "",
        r.unitPrice ?? "",
        r.scheduledQty ?? "",
        r.scheduledValue,
        r.previousCumulative,
        r.qtyThisPeriod ?? "",
        r.qtyCumulative ?? "",
        r.percentComplete != null
          ? r.percentComplete.toFixed(2)
          : r.scheduledValue > 0
          ? ((Number(r.valueCumulative) / Number(r.scheduledValue)) * 100).toFixed(2)
          : "0.00",
        r.valueThisPeriod,
        r.valueCumulative,
        r.balanceToFinish
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\n");
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
