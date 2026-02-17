import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MainContent } from "@/components/layout/main-content";
import Home from "@/pages/Home";
import Task from "@/pages/Task";
import Published from "@/pages/Published";

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
      <BrowserRouter>
        <div className="flex h-screen">
          <Sidebar />
          <MainContent>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/task/:id" element={<Task />} />
              <Route path="/p/:id" element={<Published />} />
            </Routes>
          </MainContent>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
