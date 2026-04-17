"use client";

import { useState } from "react";
import { api } from "@/lib/client";

interface Props {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
  allowInitiatedBy?: boolean;
}

export default function ChangeOrderForm({ projectId, onClose, onSaved, allowInitiatedBy }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [hasTimeImpact, setHasTimeImpact] = useState(false);
  const [timeImpact, setTimeImpact] = useState("");
  const [timeImpactNote, setTimeImpactNote] = useState("");
  const [initiatedBy, setInitiatedBy] = useState("customer");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api(`/api/projects/${projectId}/change-orders`, {
      method: "POST",
      body: JSON.stringify({
        description,
        amount: Number(amount),
        timeImpact: hasTimeImpact ? Number(timeImpact) : null,
        timeImpactNote: hasTimeImpact ? timeImpactNote : null,
        notes,
        initiatedBy: allowInitiatedBy ? initiatedBy : undefined
      })
    });
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <h3 style={{ marginTop: 0 }}>Request Change Order</h3>
        <form onSubmit={submit}>
          {allowInitiatedBy && (
            <div style={{ marginBottom: 12 }}>
              <label>Initiated By</label>
              <select value={initiatedBy} onChange={(e) => setInitiatedBy(e.target.value)}>
                <option value="customer">Customer</option>
                <option value="pm">PM / Internal</option>
              </select>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              required
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Amount ($) — positive for addition, negative for credit</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center", textTransform: "none", letterSpacing: 0 }}>
              <input
                type="checkbox"
                checked={hasTimeImpact}
                onChange={(e) => setHasTimeImpact(e.target.checked)}
                style={{ width: "auto" }}
              />
              <span style={{ fontSize: 13 }}>Has time impact</span>
            </label>
          </div>
          {hasTimeImpact && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Days (positive = delay, negative = faster)</label>
                <input
                  type="number"
                  value={timeImpact}
                  onChange={(e) => setTimeImpact(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Time Impact Note</label>
                <input
                  type="text"
                  value={timeImpactNote}
                  onChange={(e) => setTimeImpactNote(e.target.value)}
                />
              </div>
            </>
          )}
          <div style={{ marginBottom: 12 }}>
            <label>Justification / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Submitting…" : "Submit CO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
