import { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { LoginModal } from "@/components/auth/login-modal";

export function TopBar() {
  const { toggleSidebar } = useUIStore();
  const { user, loading, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 lg:absolute lg:top-0 lg:right-0 lg:left-auto lg:z-10">
        <button
          onClick={toggleSidebar}
          className="flex lg:hidden h-9 w-9 items-center justify-center rounded-[var(--radius-md)] hover:bg-accent transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <span className="font-semibold lg:hidden">TellMeNow</span>
        <div className="flex-1" />

        {/* Auth section */}
        {loading ? (
          <div className="h-8 w-8 rounded-full bg-accent animate-pulse" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || ""}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-medium text-foreground bg-accent h-full w-full flex items-center justify-center">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </span>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-border shrink-0">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || ""}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-sm font-medium text-foreground bg-accent h-full w-full flex items-center justify-center">
                          {(user.name || user.email || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.name || "User"}</p>
                      {user.email && (
                        <p className="text-xs text-muted truncate">{user.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer px-3 py-1.5"
            >
              Sign in
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-medium bg-foreground text-card px-3 py-1.5 rounded-[var(--radius-full)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign up
            </button>
          </div>
        )}
      </header>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
