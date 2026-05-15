import { formatDistanceToNow } from "@/lib/time";
import DataTable from "./DataTable";

const columns = [
  {
    key: "adminId",
    label: "Admin",
    render: (v) => (
      <span className="font-mono text-xs text-[var(--text-muted)]">{v.slice(0, 8)}...</span>
    ),
  },
  {
    key: "action",
    label: "Action",
    render: (v) => <span className="font-medium text-[var(--text-primary)]">{v}</span>,
  },
  { key: "targetType", label: "Target" },
  {
    key: "targetId",
    label: "Target ID",
    render: (v) =>
      v ? (
        <span className="font-mono text-xs text-[var(--text-muted)]">{v.slice(0, 8)}...</span>
      ) : (
        "—"
      ),
  },
  {
    key: "note",
    label: "Note",
    render: (v) => <span className="text-[var(--text-muted)]">{v || "—"}</span>,
  },
  {
    key: "createdAt",
    label: "Time",
    render: (v) => formatDistanceToNow(new Date(v), { addSuffix: true }),
  },
];

export default function AuditLogTable({ data, loading, page, totalPages, onPageChange }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      emptyMessage="No admin actions logged yet."
    />
  );
}
