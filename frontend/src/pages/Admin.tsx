import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  fetchPendingSkills,
  approveSkill,
  rejectSkill,
  PendingSkill,
} from "@/lib/api/client";

export default function Admin() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [skills, setSkills] = useState<PendingSkill[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user?.is_admin) {
      navigate("/", { replace: true });
      return;
    }
    fetchPendingSkills()
      .then(setSkills)
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [user, loading, navigate]);

  const handleApprove = async (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    try {
      await approveSkill(id);
    } catch {
      // refetch on error
      fetchPendingSkills().then(setSkills);
    }
  };

  const handleReject = async (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    try {
      await rejectSkill(id);
    } catch {
      fetchPendingSkills().then(setSkills);
    }
  };

  if (loading || (!user?.is_admin && !loading)) return null;

  return (
    <div className="flex flex-col items-center min-h-full px-4 pt-12 pb-12">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin — Pending Skills</h1>

        {fetching && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!fetching && skills.length === 0 && (
          <p className="text-sm text-muted-foreground">No skills pending review.</p>
        )}

        <div className="space-y-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-[var(--radius-md)] border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium">{skill.name}</h2>
                  <p className="text-sm text-muted-foreground">{skill.description}</p>
                  <p className="text-xs text-muted mt-1">
                    by {skill.creator_name || skill.creator_email || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(skill.id)}
                    className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] bg-primary text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(skill.id)}
                    className="px-3 py-1.5 text-sm font-medium rounded-[var(--radius-md)] border border-border hover:bg-accent transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
