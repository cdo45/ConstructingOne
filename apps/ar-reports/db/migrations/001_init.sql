-- AR invoice detail (mirrors PASTE_HERE sheet)
CREATE TABLE IF NOT EXISTS ar_invoices (
  id BIGSERIAL PRIMARY KEY,
  upload_id BIGINT NOT NULL,
  invoice_no TEXT,
  invoice_source TEXT,
  invoice_description TEXT,
  invoice_date DATE,
  retainage NUMERIC(14,2) DEFAULT 0,
  due_date DATE,
  job_no TEXT,
  customer_no TEXT NOT NULL,
  customer_name TEXT,
  total_invoice NUMERIC(14,2) DEFAULT 0,
  paid_to_date NUMERIC(14,2) DEFAULT 0,
  date_paid DATE,
  balance_due NUMERIC(14,2) DEFAULT 0,
  -- derived columns (populated on insert)
  customer_no_clean TEXT,         -- TRIM(customer_no)
  days_to_pay INTEGER,            -- date_paid - invoice_date if paid, else NULL
  is_paid SMALLINT,               -- 1 if balance_due=0 AND date_paid IS NOT NULL
  is_open SMALLINT,               -- 1 if balance_due != 0
  due_variance INTEGER,           -- date_paid - due_date, NULL if either is null
  on_time SMALLINT,               -- 1 if date_paid <= due_date
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_inv_customer ON ar_invoices(customer_no_clean);
CREATE INDEX IF NOT EXISTS idx_ar_inv_upload ON ar_invoices(upload_id);
CREATE INDEX IF NOT EXISTS idx_ar_inv_open ON ar_invoices(is_open) WHERE is_open = 1;

-- Aging file detail (mirrors AGING_PASTE sheet)
CREATE TABLE IF NOT EXISTS ar_aging (
  id BIGSERIAL PRIMARY KEY,
  upload_id BIGINT NOT NULL,
  invoice_no TEXT,
  invoice_date DATE,
  amount_1 NUMERIC(14,2) DEFAULT 0,    -- current bucket
  amount_2 NUMERIC(14,2) DEFAULT 0,    -- 31-60
  amount_3 NUMERIC(14,2) DEFAULT 0,    -- 61-90
  amount_4 NUMERIC(14,2) DEFAULT 0,    -- 90+
  retainage NUMERIC(14,2) DEFAULT 0,           -- held retention
  orig_rel_ret_amt NUMERIC(14,2) DEFAULT 0,    -- released retention
  total_amount NUMERIC(14,2) DEFAULT 0,
  age INTEGER,
  due_date DATE,
  job_no TEXT,
  customer_no TEXT NOT NULL,
  customer_name TEXT,
  customer_no_clean TEXT,
  row_type TEXT,                        -- 'detail' or 'Total for sort 1'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aging_customer ON ar_aging(customer_no_clean);
CREATE INDEX IF NOT EXISTS idx_aging_upload ON ar_aging(upload_id);
CREATE INDEX IF NOT EXISTS idx_aging_detail ON ar_aging(row_type) WHERE row_type = 'detail';

-- Tracks each upload session
CREATE TABLE IF NOT EXISTS uploads (
  id BIGSERIAL PRIMARY KEY,
  upload_type TEXT NOT NULL,    -- 'ar_detail' or 'ar_aging'
  filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE  -- only one active upload per type at a time
);

-- App settings (forecast as-of date, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES ('forecast_as_of', NULL) ON CONFLICT DO NOTHING;
