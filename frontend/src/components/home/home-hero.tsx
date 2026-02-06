"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat/chat-input";
import { useStartQuery, useSkills } from "@/lib/hooks/use-query";
import { Skill } from "@/types/job";

export function HomeHero() {
  const router = useRouter();
  const startQuery = useStartQuery();
  const { data: skills } = useSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const handleSubmit = async (text: string) => {
    if (!selectedSkill) return;

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

        {/* Placeholder for future skills */}
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-default select-none">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          More skills coming soon
        </span>
      </div>
    </div>
  );
}
