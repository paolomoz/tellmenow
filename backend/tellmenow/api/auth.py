"""Authentication module for verifying NextAuth session tokens."""

import base64
import hashlib
import logging
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, status
from jose import jwe
from pydantic import BaseModel

from tellmenow.config import settings

logger = logging.getLogger(__name__)


class User(BaseModel):
    id: str
    name: str | None = None
    email: str | None = None
    image: str | None = None


def _derive_encryption_key(secret: str, salt: str, length: int = 64) -> bytes:
    import hmac

    info = f"Auth.js Generated Encryption Key ({salt})".encode()
    salt_bytes = salt.encode() if salt else b"\x00" * 32

    prk = hmac.new(salt_bytes, secret.encode(), hashlib.sha256).digest()

    t = b""
    okm = b""
    for i in range(1, (length // 32) + 2):
        t = hmac.new(prk, t + info + bytes([i]), hashlib.sha256).digest()
        okm += t
        if len(okm) >= length:
            break

    return okm[:length]


_COOKIE_NAMES = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
]


def _decrypt_session_token(token: str, secret: str) -> dict | None:
    if not token or not secret:
        return None

    import json

    for cookie_name in _COOKIE_NAMES:
        try:
            key = _derive_encryption_key(secret, salt=cookie_name, length=64)
            decrypted = jwe.decrypt(token, key)
            payload = json.loads(decrypted)
            return payload
        except Exception:
            continue

    return None


async def get_current_user(
    session_token: Annotated[str | None, Cookie(alias="authjs.session-token")] = None,
    secure_session_token: Annotated[str | None, Cookie(alias="__Secure-authjs.session-token")] = None,
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
) -> User:
    token = x_session_token or secure_session_token or session_token

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    if not settings.auth_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication not configured")

    payload = _decrypt_session_token(token, settings.auth_secret)

    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    user_id = payload.get("id") or payload.get("sub") or payload.get("testUserId")

    if not user_id:
        provider = payload.get("provider")
        provider_account_id = payload.get("providerAccountId")
        if provider and provider_account_id:
            user_id = f"{provider}:{provider_account_id}"

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session: no user ID")

    return User(
        id=user_id,
        name=payload.get("name"),
        email=payload.get("email"),
        image=payload.get("picture"),
    )


async def get_optional_user(
    session_token: Annotated[str | None, Cookie(alias="authjs.session-token")] = None,
    secure_session_token: Annotated[str | None, Cookie(alias="__Secure-authjs.session-token")] = None,
    x_session_token: Annotated[str | None, Header(alias="X-Session-Token")] = None,
) -> User | None:
    token = x_session_token or secure_session_token or session_token

    if not token or not settings.auth_secret:
        return None

    payload = _decrypt_session_token(token, settings.auth_secret)
    if not payload:
        return None

    user_id = payload.get("id") or payload.get("sub") or payload.get("testUserId")
    if not user_id:
        provider = payload.get("provider")
        provider_account_id = payload.get("providerAccountId")
        if provider and provider_account_id:
            user_id = f"{provider}:{provider_account_id}"

    if not user_id:
        return None

    return User(id=user_id, name=payload.get("name"), email=payload.get("email"), image=payload.get("picture"))
