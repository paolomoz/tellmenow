import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MainContent } from "@/components/layout/main-content";
import { useAuthStore } from "@/lib/stores/auth-store";
import Home from "@/pages/Home";
import Task from "@/pages/Task";
import Published from "@/pages/Published";

function AuthInit({ children }: { children: React.ReactNode }) {
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return <>{children}</>;
}

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        <BrowserRouter>
          <div className="flex h-screen">
            <Sidebar />
            <MainContent>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/skill/:skillId" element={<Home />} />
                <Route path="/task/:id" element={<Task />} />
                <Route path="/p/:id" element={<Published />} />
              </Routes>
            </MainContent>
          </div>
        </BrowserRouter>
      </AuthInit>
    </QueryClientProvider>
  );
}
