"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { fmtUSD, fmtPct, fmtQty } from "@/lib/calc";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  periodId: string;
  readOnly?: boolean;
  onClose: () => void;
  onChange?: () => void;
}

export default function BillingReviewModal({ periodId, readOnly, onClose, onChange }: Props) {
  const [data, setData] = useState<any>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await api(`/api/billing/period/${periodId}`);
    if (r.data) setData(r.data);
  }
  useEffect(() => {
    load();
  }, [periodId]);

  async function approve() {
    setBusy(true);
    setError(null);
    const r = await api(`/api/billing/period/${periodId}/approve`, {
      method: "POST",
      body: JSON.stringify({ comments })
    });
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onChange?.();
    onClose();
  }

  async function reject() {
    if (!comments.trim()) {
      setError("Comments required to reject");
      return;
    }
    setBusy(true);
    setError(null);
    const r = await api(`/api/billing/period/${periodId}/reject`, {
      method: "POST",
      body: JSON.stringify({ comments })
    });
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onChange?.();
    onClose();
  }

  if (!data) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0 }}>
              {data.sub.companyName || data.sub.name} — {monthName(data.periodMonth)}{" "}
              {data.periodYear}
            </h3>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
              {data.project.projectNumber} — {data.project.name}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <StatusBadge status={data.status} />
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {data.notes && (
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: 12,
              marginBottom: 14,
              fontSize: 13,
              borderLeft: "2px solid var(--border-light)"
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 4 }}>
              NOTES FROM SUB
            </div>
            {data.notes}
          </div>
        )}

        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Type</th>
                <th className="num">Scheduled</th>
                <th className="num">Prev %</th>
                <th className="num">This Period %</th>
                <th className="num">Qty This</th>
                <th className="num">Qty Cum</th>
                <th className="num">This Period $</th>
                <th className="num">Cumulative $</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((li: any) => (
                <tr key={li.id}>
                  <td className="mono">{li.itemNumber}</td>
                  <td>{li.description}</td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {li.contractType === "lump_sum" ? "LS" : `${li.unit} @ ${fmtUSD(li.unitPrice || 0)}`}
                  </td>
                  <td className="num">{fmtUSD(li.scheduledValue)}</td>
                  <td className="num">
                    {li.contractType === "lump_sum"
                      ? fmtPct(li.previousPercentComplete)
                      : fmtQty(li.previousQtyCumulative)}
                  </td>
                  <td className="num">
                    {li.contractType === "lump_sum" ? fmtPct(li.percentComplete) : "-"}
                  </td>
                  <td className="num">
                    {li.contractType === "unit_price" ? fmtQty(li.qtyThisPeriod) : "-"}
                  </td>
                  <td className="num">
                    {li.contractType === "unit_price" ? fmtQty(li.qtyCumulative) : "-"}
                  </td>
                  <td className="num">{fmtUSD(li.valueThisPeriod)}</td>
                  <td className="num">{fmtUSD(li.valueCumulative)}</td>
                  <td className="num">{fmtUSD(li.balanceToFinish)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600 }}>
                <td colSpan={8}>TOTAL</td>
                <td className="num">{fmtUSD(data.periodTotal)}</td>
                <td className="num">{fmtUSD(data.cumulativeTotal)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <a
            className="btn"
            href={`/api/export/billing/${periodId}?format=pdf`}
            target="_blank"
          >
            Export PDF
          </a>
          <a
            className="btn"
            href={`/api/export/billing/${periodId}?format=xlsx`}
            target="_blank"
          >
            Export XLSX
          </a>
          <a
            className="btn"
            href={`/api/export/billing/${periodId}?format=csv`}
            target="_blank"
          >
            Export CSV
          </a>
        </div>

        {!readOnly && data.status === "submitted" && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
              marginTop: 16
            }}
          >
            <label>Comments (required for rejection)</label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Optional notes for approval, required if rejecting."
              style={{ marginBottom: 12 }}
            />
            {error && (
              <div style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-success" onClick={approve} disabled={busy}>
                Approve
              </button>
              <button className="btn btn-danger" onClick={reject} disabled={busy}>
                Reject
              </button>
            </div>
          </div>
        )}

        {data.approvals.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <h4 style={{ marginTop: 0 }}>Decision History</h4>
            {data.approvals.map((a: any) => (
              <div key={a.id} style={{ fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {new Date(a.createdAt).toLocaleString()} —
                </span>{" "}
                {a.approver.name} {a.decision}
                {a.comments ? `: ${a.comments}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function monthName(m: number) {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ][m - 1];
}
