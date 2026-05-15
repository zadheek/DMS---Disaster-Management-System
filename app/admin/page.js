"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { AlertTriangle, Users, Map, UserCheck, Radio, X } from "lucide-react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import StatsCard from "@/components/admin/StatsCard";
import LiveFeed from "@/components/admin/LiveFeed";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#5f7190", font: { size: 11 } } },
    title: { display: false },
  },
  scales: {
    x: { grid: { color: "#d9e5f6" }, ticks: { color: "#5f7190" } },
    y: { grid: { color: "#d9e5f6" }, ticks: { color: "#5f7190" } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { color: "#5f7190", font: { size: 11 } } },
    title: { display: false },
  },
};

const alertLabels = ["LANDSLIDE", "FLOOD", "FIRE", "BUILDING_COLLAPSE"];
const alertColors = ["#1d4ed8", "#2563eb", "#3b82f6", "#1e40af"];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [widgets, setWidgets] = useState({
    alertsByType: false,
    volunteerStatus: false,
    liveFeed: false,
  });

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/stats");
      if (data.success) setStats(data.data);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/broadcast");
      if (data.success) setBroadcasts(data.data);
    } catch {
      toast.error("Failed to load broadcasts");
    } finally {
      setLoadingBroadcasts(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchBroadcasts();
    const socket = getSocket();
    socket.emit("join:admin");
  }, [fetchStats, fetchBroadcasts]);

  const handleDeactivateBroadcast = async (id) => {
    try {
      await axios.put(`/api/broadcast/${id}`, { isActive: false });
      toast.success("Broadcast deactivated");
    } catch {
      toast.error("Failed to deactivate broadcast");
    }
  };

  // Refetch broadcasts when a new one is published or an existing one is updated/deleted
  useSocket("broadcast:message", useCallback(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]));

  useSocket("broadcasts:updated", useCallback(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]));

  useSocket("admin:newSubmission", useCallback(() => {
    fetchStats();
  }, [fetchStats]));

  const barData = stats
    ? {
        labels: alertLabels,
        datasets: [
          {
            label: "Alerts (7 days)",
            data: alertLabels.map(
              (type) =>
                stats.recentAlertsByType?.find((a) => a.type === type)?._count?.type || 0
            ),
            backgroundColor: alertColors.map((c) => c + "40"),
            borderColor: alertColors,
            borderWidth: 1,
          },
        ],
      }
    : null;

  const doughnutData = stats
    ? {
        labels: ["Available", "Deployed"],
        datasets: [
          {
            data: [
              stats.volunteers.total - stats.volunteers.deployed,
              stats.volunteers.deployed,
            ],
            backgroundColor: ["#2d7db340", "#123a7240"],
            borderColor: ["#2d7db3", "#123a72"],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const severityBg = {
    INFO: "border-[var(--info)]/18 bg-white",
    WARNING: "border-[var(--warning)]/18 bg-[var(--bg-elevated)]/40",
    CRITICAL: "border-[var(--critical)]/18 bg-[var(--bg-elevated)]/55",
  };

  const severityText = {
    INFO: "text-[var(--info)]",
    WARNING: "text-[var(--warning)]",
    CRITICAL: "text-[var(--critical)]",
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Overview">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                Dashboard View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Optional Widgets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={widgets.alertsByType}
                onCheckedChange={(checked) =>
                  setWidgets((prev) => ({ ...prev, alertsByType: !!checked }))
                }
              >
                Alerts by Type Chart
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={widgets.volunteerStatus}
                onCheckedChange={(checked) =>
                  setWidgets((prev) => ({ ...prev, volunteerStatus: !!checked }))
                }
              >
                Volunteer Status Chart
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={widgets.liveFeed}
                onCheckedChange={(checked) =>
                  setWidgets((prev) => ({ ...prev, liveFeed: !!checked }))
                }
              >
                Live Submission Feed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TopBar>
        <main className="relative flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 motion-fade-up">
          {/* Active Broadcasts */}
          {broadcasts.length > 0 && (
            <div className="space-y-2">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border shadow-[0_4px_14px_rgba(20,52,102,0.04)] ${severityBg[b.severity] || severityBg.INFO}`}
                >
                  <Radio className={`w-4 h-4 mt-0.5 shrink-0 ${severityText[b.severity] || severityText.INFO}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${severityText[b.severity] || severityText.INFO}`}>
                      {b.severity}
                    </span>
                    <p className="text-sm text-[var(--text-primary)] mt-0.5">{b.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    onClick={() => setDeactivateTarget(b.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Active Alerts"
              value={stats?.alerts?.active}
              icon={AlertTriangle}
              color="text-[var(--accent)]"
              bg="bg-[var(--accent)]/10"
              loading={loadingStats}
              trend={`${stats?.alerts?.flagged || 0} flagged`}
            />
            <StatsCard
              label="Missing Persons"
              value={stats?.missing?.missing}
              icon={Users}
              color="text-[var(--info)]"
              bg="bg-[var(--info)]/10"
              loading={loadingStats}
              trend={`${stats?.missing?.found || 0} found`}
            />
            <StatsCard
              label="Relief Camps"
              value={stats?.camps?.active}
              icon={Map}
              color="text-[var(--teal)]"
              bg="bg-[var(--teal)]/10"
              loading={loadingStats}
              trend={`${stats?.camps?.totalOccupancy || 0} occupants`}
            />
            <StatsCard
              label="Volunteers"
              value={stats?.volunteers?.total}
              icon={UserCheck}
              color="text-[var(--accent)]"
              bg="bg-[var(--accent)]/10"
              loading={loadingStats}
              trend={`${stats?.volunteers?.deployed || 0} deployed`}
            />
          </div>

          <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 shadow-[0_4px_14px_rgba(20,52,102,0.04)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { href: "/admin/alerts", label: "Review alerts" },
                { href: "/admin/camps", label: "Manage camps" },
                { href: "/admin/volunteers", label: "Assign volunteers" },
                { href: "/admin/broadcast", label: "Send broadcast" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/45 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)]/20 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Immediate Triage Summary */}
            <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 shadow-[0_4px_14px_rgba(20,52,102,0.04)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Priority Triage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/45 p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Critical Broadcasts</p>
                <p className="text-xl font-semibold text-[var(--critical)] mt-1">
                  {broadcasts.filter((b) => b.severity === "CRITICAL").length}
                </p>
              </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/45 p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Flagged Alerts</p>
                <p className="text-xl font-semibold text-[var(--accent)] mt-1">{stats?.alerts?.flagged ?? "-"}</p>
              </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/45 p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Deployed Volunteers</p>
                <p className="text-xl font-semibold text-[var(--info)] mt-1">{stats?.volunteers?.deployed ?? "-"}</p>
              </div>
            </div>
          </section>

          {/* Charts + Live Feed */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bar Chart */}
              {widgets.alertsByType && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 shadow-[0_4px_14px_rgba(20,52,102,0.04)]">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                    Alerts by Type (Last 7 Days)
                  </h3>
                  {loadingStats ? (
                    <Skeleton className="h-48 w-full bg-[var(--bg-elevated)]" />
                  ) : barData ? (
                    <div className="h-48">
                      <Bar data={barData} options={chartOptions} />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Doughnut Chart */}
              {widgets.volunteerStatus && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 shadow-[0_4px_14px_rgba(20,52,102,0.04)]">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                    Volunteer Status
                  </h3>
                  {loadingStats ? (
                    <Skeleton className="h-48 w-full bg-[var(--bg-elevated)]" />
                  ) : doughnutData ? (
                    <div className="h-48">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  ) : null}
                </div>
              )}

              {!widgets.alertsByType && !widgets.volunteerStatus && (
                <div className="md:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Analytics Hidden</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Charts are hidden by default to reduce cognitive load during high-pressure response.
                    Use Dashboard View in the top bar to reveal chart widgets.
                  </p>
                </div>
              )}
            </div>

            {/* Live Feed */}
            <div className="xl:col-span-1">
              {widgets.liveFeed ? (
                <LiveFeed />
              ) : (
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Live Feed Hidden</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Turn on Live Submission Feed from Dashboard View if you need real-time stream monitoring.
                  </p>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate Broadcast?"
        description="This will hide the broadcast from all users immediately."
        confirmLabel="Deactivate"
        onConfirm={async () => {
          await handleDeactivateBroadcast(deactivateTarget);
          setDeactivateTarget(null);
        }}
      />
    </div>
  );
}

