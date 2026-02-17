import { Skill, GeneratedSkill } from "../types";
import { getGeneratedSkill, getGeneratedSkillsByUser } from "../db/queries";
import { siteEstimatorSkill } from "./data/site-estimator/skill";

const skills: Record<string, Skill> = {
  [siteEstimatorSkill.id]: siteEstimatorSkill,
};

/** List static skills only (sync, backward compat). */
export function listSkills(): Skill[] {
  return Object.values(skills);
}

/** Get a static skill by ID (sync, backward compat). */
export function getSkill(id: string): Skill | undefined {
  return skills[id];
}

/** Convert a ready GeneratedSkill DB row into a Skill object. */
function toSkill(gs: GeneratedSkill): Skill {
  let refs: Record<string, string> = {};
  if (gs.refs_json) {
    try {
      refs = JSON.parse(gs.refs_json);
    } catch {
      // ignore malformed JSON
    }
  }
  return {
    id: gs.id,
    name: gs.name,
    description: gs.description,
    content: gs.content ?? "",
    references: refs,
  };
}

/** Check static skills first, then DB for generated skills. */
export async function getSkillResolved(
  id: string,
  db: D1Database,
): Promise<Skill | undefined> {
  const staticSkill = skills[id];
  if (staticSkill) return staticSkill;

  const gs = await getGeneratedSkill(db, id);
  if (gs && gs.status === "ready" && gs.content) {
    return toSkill(gs);
  }
  return undefined;
}

/** Merge static skills + user's generated skills (including pending/generating). */
export async function listSkillsForUser(
  db: D1Database,
  userId: string,
): Promise<(Skill & { status?: string })[]> {
  const staticList = listSkills().map((s) => ({ ...s }));
  const generated = await getGeneratedSkillsByUser(db, userId);

  const merged: (Skill & { status?: string })[] = [...staticList];

  for (const gs of generated) {
    if (gs.status === "ready" && gs.content) {
      merged.push(toSkill(gs));
    } else if (gs.status === "pending" || gs.status === "generating") {
      merged.push({
        id: gs.id,
        name: gs.name,
        description: gs.description,
        content: "",
        references: {},
        status: gs.status,
      });
    }
    // skip failed skills
  }

  return merged;
}
