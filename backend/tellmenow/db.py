from __future__ import annotations

import logging
from pathlib import Path

import aiosqlite

logger = logging.getLogger(__name__)

_db: aiosqlite.Connection | None = None

DB_PATH = Path(__file__).resolve().parent.parent / "tellmenow.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS published_pages (
    id          TEXT PRIMARY KEY,
    job_id      TEXT NOT NULL,
    user_id     TEXT,
    title       TEXT NOT NULL,
    html        TEXT NOT NULL,
    skill_id    TEXT,
    query       TEXT,
    created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_published_pages_user ON published_pages(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS query_history (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    query       TEXT NOT NULL,
    skill_id    TEXT,
    status      TEXT DEFAULT 'completed',
    created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_query_history_user ON query_history(user_id, created_at DESC);
"""


async def init_db() -> None:
    global _db
    _db = await aiosqlite.connect(str(DB_PATH))
    await _db.execute("PRAGMA journal_mode=WAL")
    await _db.executescript(_SCHEMA)
    await _db.commit()
    logger.info("Database initialized at %s", DB_PATH)


async def close_db() -> None:
    global _db
    if _db:
        await _db.close()
        _db = None


def get_db() -> aiosqlite.Connection:
    if _db is None:
        raise RuntimeError("Database not initialized")
    return _db
