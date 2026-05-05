import { NextResponse } from "next/server";
import {
  readWorkbookFromBuffer,
  validateRequiredHeaders,
  toIsoDate,
  toNumber,
  toText,
  toTrimmedText,
  diffDays,
} from "@/lib/xlsx-parser";
import {
  startUpload,
  bulkInsertArInvoices,
  type ArInvoiceInsertRow,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

const REQUIRED_HEADERS = [
  "invoice_no",
  "invoice_source",
  "invoice_description",
  "invoice_date",
  "retainage",
  "due_date",
  "job_no",
  "customer_no",
  "customer_name",
  "total_invoice",
  "paid_to_date",
  "date_paid",
  "balance_due",
];

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file uploaded under 'file' field" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { headers, rows } = readWorkbookFromBuffer(buffer);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "File has no data rows" },
        { status: 400 }
      );
    }

    const check = validateRequiredHeaders(headers, REQUIRED_HEADERS);
    if (!check.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required column header(s): ${check.missing.join(", ")}. Found headers: ${headers.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const inserts: ArInvoiceInsertRow[] = [];
    let skipped = 0;

    for (const row of rows) {
      const customerNoRaw = toText(row.customer_no);
      if (!customerNoRaw) {
        skipped++;
        continue;
      }
      const customer_no = customerNoRaw;
      const customer_no_clean = customer_no.trim();

      const invoice_date = toIsoDate(row.invoice_date);
      const due_date = toIsoDate(row.due_date);
      const date_paid = toIsoDate(row.date_paid);
      const balance_due = toNumber(row.balance_due);

      const is_paid = balance_due === 0 && date_paid != null ? 1 : 0;
      const is_open = balance_due !== 0 ? 1 : 0;
      const days_to_pay = is_paid === 1 ? diffDays(date_paid, invoice_date) : null;
      const due_variance = diffDays(date_paid, due_date);
      const on_time =
        date_paid != null && due_date != null ? (date_paid <= due_date ? 1 : 0) : null;

      inserts.push({
        invoice_no: toText(row.invoice_no),
        invoice_source: toText(row.invoice_source),
        invoice_description: toText(row.invoice_description),
        invoice_date,
        retainage: toNumber(row.retainage),
        due_date,
        job_no: toText(row.job_no),
        customer_no,
        customer_name: toTrimmedText(row.customer_name),
        total_invoice: toNumber(row.total_invoice),
        paid_to_date: toNumber(row.paid_to_date),
        date_paid,
        balance_due,
        customer_no_clean,
        days_to_pay,
        is_paid,
        is_open,
        due_variance,
        on_time,
      });
    }

    if (inserts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows found (all rows missing customer_no)" },
        { status: 400 }
      );
    }

    const filename = (file as File).name || "ar_detail.xlsx";
    const uploadId = await startUpload("ar_detail", filename, inserts.length);
    await bulkInsertArInvoices(uploadId, inserts);

    return NextResponse.json({
      success: true,
      uploadId,
      rowCount: inserts.length,
      skipped,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: `Upload failed: ${msg}` },
      { status: 500 }
    );
  }
}
