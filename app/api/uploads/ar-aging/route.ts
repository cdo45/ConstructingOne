import { NextResponse } from "next/server";
import {
  readWorkbookFromBuffer,
  validateRequiredHeaders,
  toIsoDate,
  toInteger,
  toNumber,
  toText,
  toTrimmedText,
} from "@/lib/xlsx-parser";
import {
  startUpload,
  bulkInsertArAging,
  type ArAgingInsertRow,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REQUIRED_HEADERS = [
  "invoice_no",
  "invoice_date",
  "amount_1",
  "amount_2",
  "amount_3",
  "amount_4",
  "retainage",
  "orig_rel_ret_amt",
  "TOTAL",
  "age",
  "due_date",
  "job_no",
  "customer_no",
  "customer_name",
  "row_type2",
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

    const inserts: ArAgingInsertRow[] = [];
    let skipped = 0;

    for (const row of rows) {
      const customerNoRaw = toText(row.customer_no);
      const invoiceNoRaw = toText(row.invoice_no);
      const row_type = toText(row.row_type2);

      // Defensive skip for truly empty trailing rows only — no heuristic
      // inference of row_type values.
      if (!row_type && !customerNoRaw && !invoiceNoRaw) {
        skipped++;
        continue;
      }

      const customer_no = customerNoRaw ?? "";
      const customer_no_clean = customer_no.trim();

      // Detail rows must have a customer_no; subtotal rows may not.
      if (row_type === "detail" && !customer_no_clean) {
        skipped++;
        continue;
      }

      inserts.push({
        invoice_no: invoiceNoRaw,
        invoice_date: toIsoDate(row.invoice_date),
        amount_1: toNumber(row.amount_1),
        amount_2: toNumber(row.amount_2),
        amount_3: toNumber(row.amount_3),
        amount_4: toNumber(row.amount_4),
        retainage: toNumber(row.retainage),
        orig_rel_ret_amt: toNumber(row.orig_rel_ret_amt),
        total_amount: toNumber(row.TOTAL),
        age: toInteger(row.age),
        due_date: toIsoDate(row.due_date),
        job_no: toText(row.job_no) ?? "",
        customer_no,
        customer_name: toTrimmedText(row.customer_name),
        customer_no_clean,
        row_type,
      });
    }

    if (inserts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows found in aging file" },
        { status: 400 }
      );
    }

    const filename = (file as File).name || "ar_aging.xlsx";
    const uploadId = await startUpload("ar_aging", filename, inserts.length);
    await bulkInsertArAging(uploadId, inserts);

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
