"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  LayoutGrid,
  AlertTriangle,
  Users,
  Radio,
  ChevronRight,
  Navigation,
} from "lucide-react";

// ── Top-nav links ── Change labels or hrefs here to update the navbar
const NAV_LINKS = [
  { label: "Alerts",    href: "/alerts" },
  { label: "Missing",   href: "/missing" },
  { label: "Roads",     href: "/roads" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "Map",       href: "/map" },
  { label: "Chat",      href: "/chat" },
];

// ── Quick Access items ── Add/remove rows here
const QUICK_LINKS = [
  { label: "Camp check-in",        href: "/checkin",   dot: "bg-blue-500" },
  { label: "Register as volunteer",href: "/volunteer", dot: "bg-green-500" },
  { label: "Report road damage",   href: "/roads",     dot: "bg-slate-300" },
  { label: "Report missing person",href: "/missing",   dot: "bg-yellow-400" },
  { label: "Contact admin",        href: "/chat",      dot: "bg-purple-500" },
];

// Helper: human-readable time-ago string
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return diff < 120 ? "1 min ago" : Math.floor(diff / 60) + " mins ago";
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return h === 1 ? "1 hour ago" : h + " hours ago";
  }
  const d = Math.floor(diff / 86400);
  return d === 1 ? "1 day ago" : d + " days ago";
}

export default function HomePage() {
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    axios
      .get("/api/broadcast")
      .then((res) => {
        const items = res.data?.data?.items ?? res.data?.data ?? [];
        setBroadcasts(items.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* ════════════ TOP NAV ════════════
          Brand: change "DMS" and "Disaster Management System" below
          Nav links: edit NAV_LINKS array at the top of this file          */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* ↓ Short brand name */}
            <span className="font-bold text-slate-900 text-lg">DMS</span>
            <span className="hidden sm:inline text-slate-400 font-normal text-sm">
              | Disaster Management System
            </span>
          </Link>

          <nav className="flex-1 flex justify-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-sm text-slate-600 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <Link
            href="/map"
            className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Open Map
          </Link>
        </div>
      </header>

      {/* ════════════ HERO ════════════ */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">

          {/* ── LEFT: Hero copy ── */}
          <div className="flex flex-col gap-6">

            {/* Badge — change the text inside the span below */}
            <span className="inline-flex items-center gap-2 self-start border border-slate-300 bg-white rounded-full px-4 py-1.5 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Real-time disaster coordination
            </span>

            {/* Main heading — edit these two lines for your viva */}
            <h1 className="text-[3.25rem] font-extrabold leading-tight tracking-tight text-black-900">
              Coordinate response.<br />
              {/* ↓ "Save lives." — change "text-blue-600" to change the colour */}
              <span className="text-blue-600">Save lives.</span>
            </h1>

            {/* Subtitle — change this paragraph */}
            <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
              A centralized hub for emergency responders, volunteers, and citizens
              to share critical information, locate missing persons, and coordinate
              relief efforts during disasters.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/map"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
              >
                <LayoutGrid className="h-4 w-4" />
                View live map
              </Link>
              <Link
                href="/alerts"
                className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium px-5 py-3 rounded-xl text-sm transition-colors"
              >
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Active alerts
              </Link>
              <Link
                href="/missing"
                className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium px-5 py-3 rounded-xl text-sm transition-colors"
              >
                <Users className="h-4 w-4 text-amber-500" />
                Missing persons
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Cards ── */}
          <div className="flex flex-col gap-4">

            {/* Emergency Broadcasts card — red top border */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-red-500 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-500" />
                {/* ↓ Card title */}
                <span className="text-xs font-bold uppercase tracking-widest text-slate-800">
                  Emergency Broadcasts
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {broadcasts.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">No active broadcasts.</p>
                ) : (
                  broadcasts.map((b) => (
                    <div key={b.id} className="px-5 py-4">
                      <p className="text-xs font-semibold text-red-500 mb-1">
                        {timeAgo(b.createdAt)}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{b.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Access card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                {/* ↓ Card title */}
                <span className="text-xs font-bold uppercase tracking-widest text-slate-800">
                  Quick Access
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {QUICK_LINKS.map(({ label, href, dot }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
                      <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                        {label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
