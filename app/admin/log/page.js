"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Search } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminIdFilter, setAdminIdFilter] = useState("");
  const [filterInput, setFilterInput] = useState("");

  const fetchLogs = useCallback(
    async (p = page, adminId = adminIdFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: p, limit: 20 });
        if (adminId.trim()) params.set("adminId", adminId.trim());
        const { data } = await axios.get(`/api/admin/logs?${params}`);
        if (data.success) {
          setItems(data.data.items);
          setTotalPages(data.data.totalPages);
        }
      } catch {
        toast.error("Failed to load logs");
      } finally {
        setLoading(false);
      }
    },
    [page, adminIdFilter]
  );

  useEffect(() => {
    fetchLogs(page, adminIdFilter);
  }, [page, adminIdFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAdminIdFilter(filterInput);
    setPage(1);
  };

  const handleClearFilter = () => {
    setFilterInput("");
    setAdminIdFilter("");
    setPage(1);
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Audit Log" />
        <main className="flex-1 overflow-y-auto p-5 space-y-4">
          <form onSubmit={handleFilterSubmit} className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
                Filter by Admin ID
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <Input
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  placeholder="Admin ID..."
                  className="pl-8 h-9 w-64 bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm rounded-md font-medium transition-colors"
            >
              Filter
            </button>
            {adminIdFilter && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="h-9 px-4 border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </form>

          <AuditLogTable
            data={items}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </main>
      </div>
    </div>
  );
}

