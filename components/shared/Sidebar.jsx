"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Map, Users, AlertTriangle, Route, Heart, UserPlus, Tent,
  ChevronLeft, ChevronRight, LayoutDashboard, Flag, Radio, ClipboardList,
  Home, MessageSquare, ShieldAlert,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

const publicNavItems = [
  { href: "/map", label: "Live Map", icon: Map },
  { href: "/missing", label: "Missing Persons", icon: Users },
  { href: "/alerts", label: "Threat Alerts", icon: AlertTriangle },
  { href: "/roads", label: "Road Alerts", icon: Route },
  { href: "/donations", label: "Donations", icon: Heart },
  { href: "/volunteer", label: "Volunteer", icon: UserPlus },
  { href: "/checkin", label: "Camp Check-In", icon: Tent },
  { href: "/chat", label: "Contact Admin", icon: MessageSquare },
];

const adminNavGroups = [
  {
    id: "overview",
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    items: [],
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: AlertTriangle,
    items: [
      { href: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
      { href: "/admin/roads", label: "Roads", icon: Route },
      { href: "/admin/missing", label: "Missing", icon: Users },
      { href: "/admin/flags", label: "Flagged Items", icon: Flag },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Map,
    items: [
      { href: "/admin/camps", label: "Relief Camps", icon: Map },
      { href: "/admin/volunteers", label: "Volunteers", icon: UserPlus },
      { href: "/admin/donations", label: "Donations", icon: Heart },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    icon: MessageSquare,
    items: [
      { href: "/admin/chat", label: "Inbox", icon: MessageSquare },
      { href: "/admin/broadcast", label: "Broadcast", icon: Radio },
      { href: "/admin/log", label: "Audit Log", icon: ClipboardList },
    ],
  },
];

function isAdminItemActive(pathname, href) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

export default function Sidebar({ adminMode = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUnreadMessages, setAdminUnreadMessages] = useState(0);
  const [openGroups, setOpenGroups] = useState({
    incidents: true,
    operations: false,
    communications: true,
  });
  const pathname = usePathname();

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    if (!adminMode) return;
    const activeGroup = adminNavGroups.find(
      (group) => !group.href && group.items.some((item) => isAdminItemActive(pathname, item.href))
    );
    if (activeGroup) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [adminMode, pathname]);

  // Admin unread badge is calculated by the chat API and shown in the sidebar
  // so coordinators can notice new public messages without opening the inbox.
  const fetchAdminUnread = useCallback(async () => {
    if (!adminMode) return;
    try {
      const response = await fetch("/api/admin/chat/conversations?limit=50", {
        credentials: "include",
      });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.success) {
        setAdminUnreadMessages(payload.data?.totalUnread ?? 0);
      }
    } catch {
      // Navigation remains usable if the badge cannot load.
    }
  }, [adminMode]);

  useEffect(() => {
    fetchAdminUnread();
  }, [fetchAdminUnread]);

  useEffect(() => {
    if (!adminMode) return;
    window.addEventListener("dms:chat-read", fetchAdminUnread);
    return () => window.removeEventListener("dms:chat-read", fetchAdminUnread);
  }, [adminMode, fetchAdminUnread]);

  useSocket("chat:newConversation", fetchAdminUnread);
  useSocket("chat:newMessage", fetchAdminUnread);
  useSocket("chat:messageUnsent", fetchAdminUnread);

  const mobilePublicItems = publicNavItems;

  return (
    <>
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r transition-all duration-300 shrink-0",
        "bg-white border-slate-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <Link href="/">
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-slate-100",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex flex-shrink-0 items-center justify-center shadow-sm shadow-blue-200">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">              {/* ↓ Change "DMS" and "Disaster Management" to rename the brand */}              <span className="font-bold text-sm text-slate-900 leading-tight tracking-tight">DMS</span>
              <span className="text-[10px] text-slate-500 truncate leading-tight uppercase tracking-wider font-medium">Disaster Management</span>
            </div>
          )}
        </div>
      </Link>

      {/* Nav items */}
      <nav aria-label={adminMode ? "Admin navigation" : "Main navigation"} className="flex-1 py-4 overflow-y-auto">
        {!adminMode && (
          <ul className="space-y-1 px-2">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Blue left-edge active indicator bar */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                    )}
                    <Icon className={cn(
                      "w-5 h-5 shrink-0 transition-colors duration-150",
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                    )} />
                    {!collapsed && (
                      <span className={cn("truncate", isActive ? "text-blue-700" : "text-slate-600 group-hover:text-blue-700")}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {adminMode && (
          <ul className="space-y-1 px-2">
            {adminNavGroups.map((group) => {
              const Icon = group.icon;
              const groupActive = group.href
                ? isAdminItemActive(pathname, group.href)
                : group.items.some((item) => isAdminItemActive(pathname, item.href));
              const isOpen = Boolean(openGroups[group.id]);

              if (group.href) {
                return (
                  <li key={group.id}>
                    <Link
                      href={group.href}
                      aria-label={group.label}
                      className={cn(
                        "group relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                        collapsed ? "justify-center" : "",
                        groupActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                      )}
                      title={collapsed ? group.label : undefined}
                    >
                      {groupActive && !collapsed && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                      )}
                      <Icon
                        className={cn("w-5 h-5 shrink-0", groupActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")}
                      />
                      {!collapsed && (
                        <span className={cn(groupActive ? "text-blue-700" : "text-slate-600 group-hover:text-blue-700")}>
                          {group.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => !collapsed && toggleGroup(group.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                      collapsed ? "justify-center" : "",
                      groupActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                    )}
                    title={collapsed ? group.label : undefined}
                  >
                    {groupActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                    )}
                    <Icon
                      className={cn("w-5 h-5 shrink-0", groupActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")}
                    />
                    {!collapsed && (
                      <>
                        <span
                          className={cn("min-w-0 flex-1 truncate text-left", groupActive ? "text-blue-700" : "text-slate-600 group-hover:text-blue-700")}
                        >
                          {group.label}
                        </span>
                        {group.id === "communications" && adminUnreadMessages > 0 && (
                          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                            {adminUnreadMessages > 99 ? "99+" : adminUnreadMessages}
                          </span>
                        )}
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "")} />
                      </>
                    )}
                  </button>

                  {!collapsed && isOpen && (
                    <ul className="mt-1 ml-4 border-l border-slate-200 pl-2 space-y-0.5">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const itemActive = isAdminItemActive(pathname, item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150",
                                itemActive
                                  ? "bg-blue-100 text-blue-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                              )}
                            >
                              <ItemIcon
                                className={cn("w-3.5 h-3.5 shrink-0", itemActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")}
                              />
                              <span
                                className={cn("truncate", itemActive ? "text-blue-700" : "text-slate-600 group-hover:text-blue-700")}
                              >
                                {item.label}
                              </span>
                              {item.href === "/admin/chat" && adminUnreadMessages > 0 && (
                                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                                  {adminUnreadMessages > 99 ? "99+" : adminUnreadMessages}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-1",
            "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            "transition-colors",
            collapsed ? "justify-center" : ""
          )}
          title="Home"
        >
          <Home className="w-4 h-4" />
          {!collapsed && <span>Home</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
            "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            "transition-colors",
            collapsed ? "justify-center" : ""
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>

    {/* Mobile nav trigger */}
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className="md:hidden fixed bottom-4 right-4 z-[70] h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center"
      aria-label="Open navigation"
    >
      <Menu className="w-5 h-5" />
    </button>

    {/* Mobile nav drawer */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 z-[80]">
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
        <aside className="absolute left-0 top-0 h-full w-[84vw] max-w-[320px] bg-white border-r border-slate-200 shadow-xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">DMS</p>
                <p className="text-[10px] text-slate-500 leading-none mt-1">Navigation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="h-9 w-9 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!adminMode && (
            <nav className="space-y-1">
              {mobilePublicItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium",
                      isActive
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-4 h-4" style={isActive ? { color: "#2563eb" } : undefined} />
                    <span className={isActive ? "text-blue-700" : "text-slate-600"} style={isActive ? { color: "#1d4ed8" } : undefined}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {adminMode && (
            <div className="space-y-4">
              {adminNavGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">{group.label}</p>
                  {group.href ? (
                    <Link
                      href={group.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold",
                        isAdminItemActive(pathname, group.href)
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <group.icon className="w-4 h-4" style={isAdminItemActive(pathname, group.href) ? { color: "#2563eb" } : undefined} />
                      <span
                        className={isAdminItemActive(pathname, group.href) ? "text-blue-700" : "text-slate-600"}
                        style={isAdminItemActive(pathname, group.href) ? { color: "#1d4ed8" } : undefined}
                      >
                        {group.label}
                      </span>
                    </Link>
                  ) : (
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm",
                            isAdminItemActive(pathname, item.href)
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <item.icon className="w-4 h-4" style={isAdminItemActive(pathname, item.href) ? { color: "#2563eb" } : undefined} />
                          <span
                            className={isAdminItemActive(pathname, item.href) ? "text-blue-700" : "text-slate-600"}
                            style={isAdminItemActive(pathname, item.href) ? { color: "#1d4ed8" } : undefined}
                          >
                            {item.label}
                          </span>
                          {item.href === "/admin/chat" && adminUnreadMessages > 0 && (
                            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                              {adminUnreadMessages > 99 ? "99+" : adminUnreadMessages}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </aside>
      </div>
    )}
    </>
  );
}
