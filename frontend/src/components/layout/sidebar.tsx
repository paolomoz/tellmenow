import { useNavigate, useLocation } from "react-router-dom";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHistory } from "@/lib/hooks/use-history";
import { cn } from "@/lib/utils";
import { HistoryJob } from "@/types/job";

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { data: historyData } = useHistory();
  const history = historyData?.jobs ?? [];

  const nav = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) toggleSidebar();
  };

  // Group history by time
  const today: HistoryJob[] = [];
  const thisWeek: HistoryJob[] = [];
  const older: HistoryJob[] = [];

  if (history.length > 0) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const job of history) {
      const age = now - new Date(job.created_at).getTime();
      if (age < dayMs) today.push(job);
      else if (age < 7 * dayMs) thisWeek.push(job);
      else older.push(job);
    }
  }

  const statusIcon = (status: string) => {
    if (status === "completed") {
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-success">
          <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (status === "failed") {
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-destructive">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <div className="w-3 h-3 shrink-0">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    );
  };

  const renderGroup = (label: string, jobs: HistoryJob[]) => {
    if (jobs.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="px-3 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="space-y-0.5">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => nav(`/task/${job.id}`)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors cursor-pointer text-left",
                pathname === `/task/${job.id}`
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted hover:bg-accent hover:text-foreground",
              )}
            >
              {statusIcon(job.status)}
              <span className="truncate">
                {job.report_title || job.query.slice(0, 40)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-card transition-transform duration-200",
          "lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <button
              onClick={() => nav("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v14M2 9h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-semibold">TellMeNow</span>
            </button>
            <button
              onClick={toggleSidebar}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] hover:bg-accent transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={() => nav("/")}
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New Query
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {user && history.length > 0 ? (
              <>
                <div className="mb-2 px-3 text-xs font-medium text-muted uppercase tracking-wider">
                  History
                </div>
                {renderGroup("Today", today)}
                {renderGroup("This week", thisWeek)}
                {renderGroup("Earlier", older)}
              </>
            ) : (
              <>
                <div className="mb-2 px-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Navigation
                </div>
                <div className="space-y-0.5">
                  <SidebarLink
                    icon="home"
                    label="Home"
                    active={pathname === "/"}
                    onClick={() => nav("/")}
                  />
                </div>
                {!user && (
                  <p className="mt-6 px-3 text-xs text-muted-foreground">
                    Sign in to see your task history.
                  </p>
                )}
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors cursor-pointer",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted hover:bg-accent hover:text-foreground"
      )}
    >
      {icon === "home" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8l6-6 6 6M4 7v5.5a1 1 0 001 1h6a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </button>
  );
}
