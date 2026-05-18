import Link from "next/link";
import { AlertTriangle, Home, Map } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex max-w-xl flex-col items-start gap-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The page you are looking for is not available in the disaster management system.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/map"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Map className="h-4 w-4" />
            Live Map
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
