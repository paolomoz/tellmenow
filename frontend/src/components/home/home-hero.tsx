import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChatInput } from "@/components/chat/chat-input";
import { useStartQuery, useSkills } from "@/lib/hooks/use-query";
import { useSkillGeneration } from "@/lib/hooks/use-skill-generation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { LoginModal } from "@/components/auth/login-modal";
import { SkillRequestModal } from "@/components/skill-request/skill-request-modal";
import { Skill } from "@/types/job";
import { shareSkill } from "@/lib/api/client";

interface HomeHeroProps {
  skillId?: string;
}

export function HomeHero({ skillId }: HomeHeroProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const startQuery = useStartQuery();
  const { data: skills } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Auto-select skill from URL param once skills are loaded
  useEffect(() => {
    if (!skillId || !skills) return;
    const match = skills.find((s) => s.id === skillId);
    setSelectedSkill(match ?? null);
  }, [skillId, skills]);
  const [showAuth, setShowAuth] = useState(false);
  const [showSkillRequest, setShowSkillRequest] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [restoredQuery, setRestoredQuery] = useState<string | undefined>(undefined);
  const user = useAuthStore((s) => s.user);

  // Restore pending query after OAuth redirect
  useEffect(() => {
    if (!user || !skills) return;
    const saved = sessionStorage.getItem("tmn_pending");
    if (!saved) return;
    sessionStorage.removeItem("tmn_pending");
    try {
      const { skillId: savedSkillId, query } = JSON.parse(saved);
      const match = skills.find((s) => s.id === savedSkillId);
      if (match && query) {
        setSelectedSkill(match);
        navigate(`/skill/${match.id}`, { replace: true });
        setRestoredQuery(query);
      }
    } catch {
      // ignore malformed data
    }
  }, [user, skills]);

  const buildingSkillIds = useMemo(
    () =>
      (skills ?? [])
        .filter((s) => s.status === "pending" || s.status === "generating")
        .map((s) => s.id),
    [skills],
  );

  useSkillGeneration(buildingSkillIds);

  const placeholderMap: Record<string, string> = {
    "site-overviewer": "Enter a website or a brand name..",
  };
  const defaultPlaceholder = "Enter a website or a brand name..";

  const submitQuery = async (text: string) => {
    if (!selectedSkill) return;
    try {
      const result = await startQuery.mutateAsync({
        query: text,
        skill_id: selectedSkill.id,
      });
      navigate(`/task/${result.job_id}`);
    } catch {
      // error handled by mutation state
    }
  };

  const handleSubmit = async (text: string) => {
    if (!selectedSkill) return;

    if (!user) {
      setPendingQuery(text);
      sessionStorage.setItem(
        "tmn_pending",
        JSON.stringify({ skillId: selectedSkill.id, query: text }),
      );
      setShowAuth(true);
      return;
    }

    await submitQuery(text);
  };

  // After login, retry the pending query
  const handleAuthClose = () => {
    setShowAuth(false);
    if (pendingQuery && user) {
      submitQuery(pendingQuery);
      setPendingQuery(null);
    }
  };

  const handleSkillSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ["skills"] });
  };

  const skillIcons: Record<string, React.ReactNode> = {
    "site-overviewer": (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1 5h12" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4.5 7.5h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <div className="space-y-4">
      <ChatInput
        key={restoredQuery ?? "default"}
        onSubmit={handleSubmit}
        placeholder={
          selectedSkill
            ? placeholderMap[selectedSkill.id] || defaultPlaceholder
            : "Select a skill below, then ask your question..."
        }
        disabled={!selectedSkill || startQuery.isPending}
        defaultValue={restoredQuery}
      />

      {startQuery.isError && (
        <p className="text-xs text-red-500 text-center">
          {startQuery.error?.message || "Failed to start query"}
        </p>
      )}

      {/* Skill chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {skills?.map((skill) => {
          const isBuilding = skill.status === "pending" || skill.status === "generating";

          if (isBuilding) {
            return (
              <div
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground animate-pulse"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="shrink-0 animate-spin"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeDasharray="20 10"
                  />
                </svg>
                Building...
              </div>
            );
          }

          const canShare =
            user &&
            !skill.shared &&
            skill.status !== "pending" &&
            skill.status !== "generating" &&
            (skill.share_status === null || skill.share_status === undefined || skill.share_status === "rejected");
          const isPendingReview = skill.share_status === "pending_review";

          return (
            <div key={skill.id} className="inline-flex items-center gap-0">
              <button
                type="button"
                onClick={() => {
                  if (selectedSkill?.id === skill.id) {
                    setSelectedSkill(null);
                    navigate("/", { replace: true });
                  } else {
                    setSelectedSkill(skill);
                    navigate(`/skill/${skill.id}`, { replace: true });
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  selectedSkill?.id === skill.id
                    ? "border-primary/30 bg-primary-light text-primary"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {skillIcons[skill.id] || (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                )}
                {skill.name}
                {isPendingReview && (
                  <span className="text-[10px] text-muted-foreground ml-1">(pending review)</span>
                )}
                {skill.shared && (
                  <span className="text-[10px] text-muted-foreground ml-1">(shared)</span>
                )}
              </button>
              {canShare && (
                <button
                  type="button"
                  title="Share this skill with everyone"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await shareSkill(skill.id);
                      queryClient.invalidateQueries({ queryKey: ["skills"] });
                    } catch {
                      // ignore
                    }
                  }}
                  className="ml-1 p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="10.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="10.5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="3.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 6l4-2.5M5 8l4 2.5" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        {/* Request new skills */}
        <button
          type="button"
          onClick={() => setShowSkillRequest(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-dashed border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Request New Skills
        </button>
      </div>

      {selectedSkill?.description && (
        <p
          key={selectedSkill.id}
          className="text-center text-sm text-muted-foreground max-w-md mx-auto leading-relaxed fade-in"
        >
          {selectedSkill.description}
        </p>
      )}

      <LoginModal open={showAuth} onClose={handleAuthClose} />
      <SkillRequestModal
        open={showSkillRequest}
        onClose={() => setShowSkillRequest(false)}
        onSkillSubmitted={handleSkillSubmitted}
      />
    </div>
  );
}
