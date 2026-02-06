"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { ChatInput } from "@/components/chat/chat-input";
import { useStartQuery, useSkills } from "@/lib/hooks/use-query";
import { Skill } from "@/types/job";

export function HomeHero() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const startQuery = useStartQuery();
  const { data: skills } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pendingText, setPendingText] = useState("");

  const handleSubmit = async (text: string) => {
    if (!selectedSkill) return;

    if (!session) {
      setPendingText(text);
      setShowAuthPrompt(true);
      return;
    }

    try {
      const result = await startQuery.mutateAsync({
        query: text,
        skill_id: selectedSkill.id,
      });
      router.push(`/task/${result.job_id}`);
    } catch {
      // error handled by mutation state
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
            ? `Ask about ${selectedSkill.name.toLowerCase()}...`
            : "Select a skill below, then ask your question..."
        }
        disabled={!selectedSkill || startQuery.isPending || status === "loading"}
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

        {/* Placeholder for future skills */}
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-default select-none">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          More skills coming soon
        </span>
      </div>

      {/* Auth prompt modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4 rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-xl">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sign in to continue</h2>
                <p className="text-sm text-muted mt-1">
                  Create an account to submit queries and save your results.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => signIn("google")}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors cursor-pointer"
                >
                  Continue with Google
                </button>
                <button
                  onClick={() => signIn("github")}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
                >
                  Continue with GitHub
                </button>
              </div>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer pt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
