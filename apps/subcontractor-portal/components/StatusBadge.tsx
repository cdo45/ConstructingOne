"use client";

const MAP: Record<string, { cls: string; label: string }> = {
  active: { cls: "badge-success", label: "Active" },
  completed: { cls: "badge-muted", label: "Completed" },
  on_hold: { cls: "badge-warning", label: "On Hold" },
  draft: { cls: "badge-muted", label: "Draft" },
  submitted: { cls: "badge-info", label: "Submitted" },
  approved: { cls: "badge-success", label: "Approved" },
  rejected: { cls: "badge-danger", label: "Rejected" },
  pending: { cls: "badge-warning", label: "Pending" },
  pm_approved: { cls: "badge-info", label: "PM Approved" },
  customer_approved: { cls: "badge-success", label: "Customer Approved" },
  voided: { cls: "badge-muted", label: "Voided" }
};

export default function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] || { cls: "badge-muted", label: status };
  return (
    <span className={`badge ${m.cls}`}>
      <span className="dot"></span>
      {m.label}
    </span>
  );
}
