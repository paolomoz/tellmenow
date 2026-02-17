import { useMutation, useQuery } from "@tanstack/react-query";
import { startQuery, fetchSkills, fetchJobStatus } from "@/lib/api/client";
import { QueryRequest } from "@/types/job";

export function useStartQuery() {
  return useMutation({
    mutationFn: (request: QueryRequest) => startQuery(request),
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: fetchSkills,
    staleTime: 5 * 60_000,
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000;
    },
  });
}
