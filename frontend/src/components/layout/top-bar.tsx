"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useState, useRef, useEffect } from "react";

export function TopBar() {
  const { toggleSidebar } = useUIStore();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
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
      <div className="flex-1 lg:hidden" />

      {status === "loading" ? (
        <div className="h-9 w-20 animate-pulse bg-muted rounded-[var(--radius-md)]" />
      ) : session ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-[var(--radius-full)] hover:bg-accent transition-colors cursor-pointer p-1"
          >
            {session.user?.image ? (
              <img src={session.user.image} alt="" width={32} height={32} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {session.user?.name?.[0] || "U"}
              </div>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-[var(--radius-lg)] border border-border bg-card shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" width={40} height={40} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                    <p className="text-xs text-muted truncate">{session.user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-accent transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => signIn()}
            className="px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </div>
      )}
    </header>
  );
}
