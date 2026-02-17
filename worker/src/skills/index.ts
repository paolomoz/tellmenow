import { Skill, GeneratedSkill } from "../types";
import { getGeneratedSkill, getGeneratedSkillsByUser, getApprovedSharedSkills } from "../db/queries";
import { siteEstimatorSkill } from "./data/site-overviewer/skill";

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

/** Merge static skills + user's generated skills (including pending/generating) + approved shared skills. */
export async function listSkillsForUser(
  db: D1Database,
  userId: string,
): Promise<(Skill & { status?: string; share_status?: string | null; shared?: boolean })[]> {
  const staticList = listSkills().map((s) => ({ ...s }));
  const [generated, approved] = await Promise.all([
    getGeneratedSkillsByUser(db, userId),
    getApprovedSharedSkills(db),
  ]);

  const seenIds = new Set<string>(staticList.map((s) => s.id));
  const merged: (Skill & { status?: string; share_status?: string | null; shared?: boolean })[] = [...staticList];

  for (const gs of generated) {
    seenIds.add(gs.id);
    if (gs.status === "ready" && gs.content) {
      merged.push({ ...toSkill(gs), share_status: gs.share_status });
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

  // Add approved shared skills from other users (deduped)
  for (const gs of approved) {
    if (!seenIds.has(gs.id)) {
      seenIds.add(gs.id);
      merged.push({ ...toSkill(gs), shared: true });
    }
  }

  return merged;
}

/** Static skills + approved shared skills (for unauthenticated users). */
export async function listSkillsPublic(
  db: D1Database,
): Promise<(Skill & { shared?: boolean })[]> {
  const staticList = listSkills().map((s) => ({ ...s }));
  const approved = await getApprovedSharedSkills(db);

  const seenIds = new Set<string>(staticList.map((s) => s.id));
  const merged: (Skill & { shared?: boolean })[] = [...staticList];

  for (const gs of approved) {
    if (!seenIds.has(gs.id)) {
      seenIds.add(gs.id);
      merged.push({ ...toSkill(gs), shared: true });
    }
  }

  return merged;
}
