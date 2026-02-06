"""Load skill definitions from the data directory."""

import logging
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)

SKILLS_DIR = Path(__file__).resolve().parent / "data"


@dataclass
class Skill:
    id: str
    name: str
    description: str
    content: str  # Full SKILL.md content (instructions)
    references: dict[str, str] = field(default_factory=dict)  # filename -> content


_skills: dict[str, Skill] = {}


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown."""
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    import yaml
    meta = yaml.safe_load(parts[1]) or {}
    body = parts[2].strip()
    return meta, body


def load_skills() -> dict[str, Skill]:
    global _skills
    if _skills:
        return _skills

    if not SKILLS_DIR.exists():
        logger.warning("Skills directory not found: %s", SKILLS_DIR)
        return {}

    for skill_dir in SKILLS_DIR.iterdir():
        if not skill_dir.is_dir():
            continue

        skill_file = skill_dir / "SKILL.md"
        if not skill_file.exists():
            continue

        raw = skill_file.read_text(encoding="utf-8")
        meta, body = _parse_frontmatter(raw)

        skill_id = meta.get("name", skill_dir.name)
        description = meta.get("description", "")

        # Load references
        references = {}
        refs_dir = skill_dir / "references"
        if refs_dir.exists():
            for ref_file in refs_dir.iterdir():
                if ref_file.is_file() and ref_file.suffix == ".md":
                    references[ref_file.name] = ref_file.read_text(encoding="utf-8")

        _skills[skill_id] = Skill(
            id=skill_id,
            name=skill_id.replace("-", " ").title(),
            description=description,
            content=body,
            references=references,
        )
        logger.info("Loaded skill: %s (%d references)", skill_id, len(references))

    return _skills


def get_skill(skill_id: str) -> Skill | None:
    skills = load_skills()
    return skills.get(skill_id)


def list_skills() -> list[Skill]:
    return list(load_skills().values())
