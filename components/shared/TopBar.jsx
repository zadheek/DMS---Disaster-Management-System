"use client";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useSocketContext } from "@/context/SocketContext";
import { cn } from "@/lib/utils";

export default function TopBar({ title, children }) {
  const { data: session } = useSession();
  const { connected } = useSocketContext();

  return (
    <header className="h-16 flex items-center justify-between gap-2 px-4 sm:px-6 bg-white shrink-0 border-b border-slate-200">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 truncate">{title}</h1>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              connected ? "bg-blue-600 animate-pulse" : "bg-slate-400"
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {children}
        {session?.user && (
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-sm text-slate-500 hidden sm:block">
              {session.user.email}
            </span>
            {session.user.role === "ADMIN" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
                Admin
              </span>
            )}
            <button
              aria-label="Sign out"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
