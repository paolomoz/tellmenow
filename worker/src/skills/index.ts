import { Skill } from "../types";
import { siteEstimatorSkill } from "./data/site-estimator/skill";

const skills: Record<string, Skill> = {
  [siteEstimatorSkill.id]: siteEstimatorSkill,
};

export function listSkills(): Skill[] {
  return Object.values(skills);
}

export function getSkill(id: string): Skill | undefined {
  return skills[id];
}
