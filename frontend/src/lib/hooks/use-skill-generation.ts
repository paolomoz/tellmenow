import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api";

/**
 * Opens an EventSource to /api/skills/:id/generate for each building skill.
 * On ready/failed, invalidates the ["skills"] React Query cache.
 */
export function useSkillGeneration(buildingSkillIds: string[]) {
  const queryClient = useQueryClient();
  const activeRef = useRef<Map<string, EventSource>>(new Map());

  useEffect(() => {
    const active = activeRef.current;

    // Close EventSources for skills no longer building
    for (const [id, es] of active) {
      if (!buildingSkillIds.includes(id)) {
        es.close();
        active.delete(id);
      }
    }

    // Open EventSources for new building skills
    for (const id of buildingSkillIds) {
      if (active.has(id)) continue;

      const es = new EventSource(`${API_BASE}/skills/${id}/generate`);

      es.addEventListener("status", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "ready" || data.status === "failed") {
            es.close();
            active.delete(id);
            queryClient.invalidateQueries({ queryKey: ["skills"] });
          }
        } catch {
          // ignore parse errors
        }
      });

      es.addEventListener("timeout", () => {
        es.close();
        active.delete(id);
        queryClient.invalidateQueries({ queryKey: ["skills"] });
      });

      es.onerror = () => {
        es.close();
        active.delete(id);
        queryClient.invalidateQueries({ queryKey: ["skills"] });
      };

      active.set(id, es);
    }

    return () => {
      for (const [, es] of active) {
        es.close();
      }
      active.clear();
    };
  }, [buildingSkillIds, queryClient]);
}
