"use client";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useSocketContext } from "@/context/SocketContext";
import { cn } from "@/lib/utils";

export default function TopBar({ title, children }) {
  const { data: session } = useSession();
  const { connected } = useSocketContext();

  return (
    <header className="h-16 flex items-center justify-between gap-2 px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 border-b border-[var(--border)]">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--title-color)] truncate">{title}</h1>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              connected ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--text-muted)]"
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {children}
        {session?.user && (
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-sm text-[var(--subtitle-color)] hidden sm:block">
              {session.user.email}
            </span>
            {session.user.role === "ADMIN" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-semibold">
                Admin
              </span>
            )}
            <button
              aria-label="Sign out"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="p-1.5 rounded-md text-[var(--subtitle-color)] hover:text-[var(--title-color)] hover:bg-[var(--bg-elevated)] transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
