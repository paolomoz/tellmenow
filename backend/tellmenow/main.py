from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tellmenow.config import settings
from tellmenow.api.router import api_router
from tellmenow.db import init_db, close_db
from tellmenow.skills.loader import load_skills


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    load_skills()
    yield
    await close_db()


app = FastAPI(
    title="TellMeNow",
    description="Skill-based Q&A Engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
