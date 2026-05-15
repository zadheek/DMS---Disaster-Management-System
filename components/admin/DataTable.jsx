"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataTable({
  columns,
  data,
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage = "No items found.",
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 overflow-x-auto bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  scope="col"
                  className="text-slate-500 font-semibold text-[11px] uppercase tracking-wide"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-slate-200">
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="border-slate-200">
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-slate-500 py-8"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-slate-200 text-slate-900",
                    onRowClick
                      ? "cursor-pointer hover:bg-blue-50/60"
                      : "hover:bg-slate-50"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous page"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next page"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
