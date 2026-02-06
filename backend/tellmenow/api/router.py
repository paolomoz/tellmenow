from fastapi import APIRouter

from tellmenow.api.query import router as query_router
from tellmenow.api.skills import router as skills_router
from tellmenow.api.publish import router as publish_router
from tellmenow.api.schemas import HealthResponse

api_router = APIRouter()
api_router.include_router(query_router)
api_router.include_router(skills_router)
api_router.include_router(publish_router)


@api_router.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    return HealthResponse()
