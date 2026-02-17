import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatInput } from "@/components/chat/chat-input";
import { useStartQuery, useSkills } from "@/lib/hooks/use-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { LoginModal } from "@/components/auth/login-modal";
import { SkillRequestModal } from "@/components/skill-request/skill-request-modal";
import { Skill } from "@/types/job";

export function HomeHero() {
  const navigate = useNavigate();
  const startQuery = useStartQuery();
  const { data: skills } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showSkillRequest, setShowSkillRequest] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const placeholderMap: Record<string, string> = {
    "site-estimator": "Enter a website or a brand name..",
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

  const skillIcons: Record<string, React.ReactNode> = {
    "site-estimator": (
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
        onSubmit={handleSubmit}
        placeholder={
          selectedSkill
            ? placeholderMap[selectedSkill.id] || defaultPlaceholder
            : "Select a skill below, then ask your question..."
        }
        disabled={!selectedSkill || startQuery.isPending}
      />

      {startQuery.isError && (
        <p className="text-xs text-red-500 text-center">
          {startQuery.error?.message || "Failed to start query"}
        </p>
      )}

      {/* Skill chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {skills?.map((skill) => (
          <button
            key={skill.id}
            type="button"
            onClick={() =>
              setSelectedSkill(
                selectedSkill?.id === skill.id ? null : skill
              )
            }
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
          </button>
        ))}

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

      <LoginModal open={showAuth} onClose={handleAuthClose} />
      <SkillRequestModal open={showSkillRequest} onClose={() => setShowSkillRequest(false)} />
    </div>
  );
}
