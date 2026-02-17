import { useQuery } from "@tanstack/react-query";
import { fetchHistory } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useHistory() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["history", user?.id],
    queryFn: () => fetchHistory(),
    enabled: !!user,
    staleTime: 30_000,
  });
}
