import { sql } from "@/lib/db";

export type UploadType = "ar_detail" | "ar_aging";

export type UploadRow = {
  id: number;
  upload_type: UploadType;
  filename: string | null;
  uploaded_at: string;
  row_count: number | null;
  is_active: boolean;
};

/**
 * Marks any existing active upload of `type` as inactive, then inserts a new
 * uploads row and returns its id. Returns the row id as a JS number — Postgres
 * BIGSERIAL fits comfortably in 53 bits for our scale.
 */
export async function startUpload(
  type: UploadType,
  filename: string,
  rowCount: number
): Promise<number> {
  await sql(`UPDATE uploads SET is_active = FALSE WHERE upload_type = $1 AND is_active = TRUE`, [type]);
  const rows = (await sql(
    `INSERT INTO uploads (upload_type, filename, row_count, is_active)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id`,
    [type, filename, rowCount]
  )) as { id: number | string }[];
  return Number(rows[0].id);
}

/**
 * Bulk insert rows into ar_invoices in chunks. Uses unnest() so the entire
 * chunk is one round trip to Neon; per-row inserts would time out.
 */
export async function bulkInsertArInvoices(
  uploadId: number,
  rows: ArInvoiceInsertRow[],
  chunkSize = 500
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;

    const upload_id: number[] = [];
    const invoice_no: (string | null)[] = [];
    const invoice_source: (string | null)[] = [];
    const invoice_description: (string | null)[] = [];
    const invoice_date: (string | null)[] = [];
    const retainage: number[] = [];
    const due_date: (string | null)[] = [];
    const job_no: (string | null)[] = [];
    const customer_no: string[] = [];
    const customer_name: (string | null)[] = [];
    const total_invoice: number[] = [];
    const paid_to_date: number[] = [];
    const date_paid: (string | null)[] = [];
    const balance_due: number[] = [];
    const customer_no_clean: string[] = [];
    const days_to_pay: (number | null)[] = [];
    const is_paid: number[] = [];
    const is_open: number[] = [];
    const due_variance: (number | null)[] = [];
    const on_time: (number | null)[] = [];

    for (const r of chunk) {
      upload_id.push(uploadId);
      invoice_no.push(r.invoice_no);
      invoice_source.push(r.invoice_source);
      invoice_description.push(r.invoice_description);
      invoice_date.push(r.invoice_date);
      retainage.push(r.retainage);
      due_date.push(r.due_date);
      job_no.push(r.job_no);
      customer_no.push(r.customer_no);
      customer_name.push(r.customer_name);
      total_invoice.push(r.total_invoice);
      paid_to_date.push(r.paid_to_date);
      date_paid.push(r.date_paid);
      balance_due.push(r.balance_due);
      customer_no_clean.push(r.customer_no_clean);
      days_to_pay.push(r.days_to_pay);
      is_paid.push(r.is_paid);
      is_open.push(r.is_open);
      due_variance.push(r.due_variance);
      on_time.push(r.on_time);
    }

    await sql(
      `INSERT INTO ar_invoices (
         upload_id, invoice_no, invoice_source, invoice_description,
         invoice_date, retainage, due_date, job_no,
         customer_no, customer_name, total_invoice, paid_to_date,
         date_paid, balance_due, customer_no_clean, days_to_pay,
         is_paid, is_open, due_variance, on_time
       )
       SELECT * FROM unnest(
         $1::bigint[], $2::text[], $3::text[], $4::text[],
         $5::date[], $6::numeric[], $7::date[], $8::text[],
         $9::text[], $10::text[], $11::numeric[], $12::numeric[],
         $13::date[], $14::numeric[], $15::text[], $16::int[],
         $17::smallint[], $18::smallint[], $19::int[], $20::smallint[]
       ) AS t(
         upload_id, invoice_no, invoice_source, invoice_description,
         invoice_date, retainage, due_date, job_no,
         customer_no, customer_name, total_invoice, paid_to_date,
         date_paid, balance_due, customer_no_clean, days_to_pay,
         is_paid, is_open, due_variance, on_time
       )`,
      [
        upload_id, invoice_no, invoice_source, invoice_description,
        invoice_date, retainage, due_date, job_no,
        customer_no, customer_name, total_invoice, paid_to_date,
        date_paid, balance_due, customer_no_clean, days_to_pay,
        is_paid, is_open, due_variance, on_time,
      ]
    );
  }
}

export type ArInvoiceInsertRow = {
  invoice_no: string | null;
  invoice_source: string | null;
  invoice_description: string | null;
  invoice_date: string | null;
  retainage: number;
  due_date: string | null;
  job_no: string | null;
  customer_no: string;
  customer_name: string | null;
  total_invoice: number;
  paid_to_date: number;
  date_paid: string | null;
  balance_due: number;
  customer_no_clean: string;
  days_to_pay: number | null;
  is_paid: number;
  is_open: number;
  due_variance: number | null;
  on_time: number | null;
};

export async function bulkInsertArAging(
  uploadId: number,
  rows: ArAgingInsertRow[],
  chunkSize = 500
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;

    const upload_id: number[] = [];
    const invoice_no: (string | null)[] = [];
    const invoice_date: (string | null)[] = [];
    const amount_1: number[] = [];
    const amount_2: number[] = [];
    const amount_3: number[] = [];
    const amount_4: number[] = [];
    const retainage: number[] = [];
    const orig_rel_ret_amt: number[] = [];
    const total_amount: number[] = [];
    const age: (number | null)[] = [];
    const due_date: (string | null)[] = [];
    const job_no: (string | null)[] = [];
    const customer_no: string[] = [];
    const customer_name: (string | null)[] = [];
    const customer_no_clean: string[] = [];
    const row_type: string[] = [];

    for (const r of chunk) {
      upload_id.push(uploadId);
      invoice_no.push(r.invoice_no);
      invoice_date.push(r.invoice_date);
      amount_1.push(r.amount_1);
      amount_2.push(r.amount_2);
      amount_3.push(r.amount_3);
      amount_4.push(r.amount_4);
      retainage.push(r.retainage);
      orig_rel_ret_amt.push(r.orig_rel_ret_amt);
      total_amount.push(r.total_amount);
      age.push(r.age);
      due_date.push(r.due_date);
      job_no.push(r.job_no);
      customer_no.push(r.customer_no);
      customer_name.push(r.customer_name);
      customer_no_clean.push(r.customer_no_clean);
      row_type.push(r.row_type);
    }

    await sql(
      `INSERT INTO ar_aging (
         upload_id, invoice_no, invoice_date, amount_1, amount_2,
         amount_3, amount_4, retainage, orig_rel_ret_amt, total_amount,
         age, due_date, job_no, customer_no, customer_name,
         customer_no_clean, row_type
       )
       SELECT * FROM unnest(
         $1::bigint[], $2::text[], $3::date[], $4::numeric[], $5::numeric[],
         $6::numeric[], $7::numeric[], $8::numeric[], $9::numeric[], $10::numeric[],
         $11::int[], $12::date[], $13::text[], $14::text[], $15::text[],
         $16::text[], $17::text[]
       ) AS t(
         upload_id, invoice_no, invoice_date, amount_1, amount_2,
         amount_3, amount_4, retainage, orig_rel_ret_amt, total_amount,
         age, due_date, job_no, customer_no, customer_name,
         customer_no_clean, row_type
       )`,
      [
        upload_id, invoice_no, invoice_date, amount_1, amount_2,
        amount_3, amount_4, retainage, orig_rel_ret_amt, total_amount,
        age, due_date, job_no, customer_no, customer_name,
        customer_no_clean, row_type,
      ]
    );
  }
}

export type ArAgingInsertRow = {
  invoice_no: string | null;
  invoice_date: string | null;
  amount_1: number;
  amount_2: number;
  amount_3: number;
  amount_4: number;
  retainage: number;
  orig_rel_ret_amt: number;
  total_amount: number;
  age: number | null;
  due_date: string | null;
  job_no: string;
  customer_no: string;
  customer_name: string | null;
  customer_no_clean: string;
  row_type: string;
};

export async function getLatestActiveUpload(type: UploadType): Promise<UploadRow | null> {
  const rows = (await sql(
    `SELECT id, upload_type, filename, uploaded_at, row_count, is_active
     FROM uploads
     WHERE upload_type = $1 AND is_active = TRUE
     ORDER BY uploaded_at DESC
     LIMIT 1`,
    [type]
  )) as Array<{
    id: number | string;
    upload_type: UploadType;
    filename: string | null;
    uploaded_at: string | Date;
    row_count: number | null;
    is_active: boolean;
  }>;
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    upload_type: row.upload_type,
    filename: row.filename,
    uploaded_at:
      row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at,
    row_count: row.row_count,
    is_active: row.is_active,
  };
}
