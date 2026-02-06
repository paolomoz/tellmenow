from fastapi import APIRouter

from tellmenow.api.schemas import SkillResponse
from tellmenow.skills.loader import list_skills

router = APIRouter(prefix="/api", tags=["skills"])


@router.get("/skills", response_model=list[SkillResponse])
async def get_skills():
    return [
        SkillResponse(id=s.id, name=s.name, description=s.description)
        for s in list_skills()
    ]
