import json
import logging
from urllib.parse import quote

import anthropic
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from tellmenow.config import settings

logger = logging.getLogger(__name__)

_anthropic_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


async def _anthropic_invoke(
    system: str | list[dict],
    user_message: str,
    *,
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.7,
) -> dict:
    client = _get_client()
    response = await client.messages.create(
        model=model or settings.claude_model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )
    return {"content": [{"type": b.type, "text": b.text} for b in response.content]}


async def _bedrock_invoke(
    system: str | list[dict],
    user_message: str,
    *,
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.7,
) -> dict:
    resolved_model = model or settings.anthropic_model or settings.claude_model
    url = (
        f"https://bedrock-runtime.{settings.aws_region}.amazonaws.com"
        f"/model/{quote(resolved_model, safe='')}/invoke"
    )
    logger.info("Bedrock request: %s", url)

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": [{"role": "user", "content": user_message}],
    }

    async with httpx.AsyncClient(timeout=300) as http:
        resp = await http.post(
            url,
            headers={
                "Authorization": f"Bearer {settings.anthropic_aws_bearer_token_bedrock}",
                "Content-Type": "application/json",
            },
            json=body,
        )
        resp.raise_for_status()
        return resp.json()


async def _invoke(
    system: str | list[dict],
    user_message: str,
    *,
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.7,
) -> dict:
    fn = _bedrock_invoke if settings.use_bedrock else _anthropic_invoke
    return await fn(
        system,
        user_message,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def chat(
    system: str | list[dict],
    user_message: str,
    *,
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.7,
) -> str:
    result = await _invoke(
        system,
        user_message,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return result["content"][0]["text"]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def chat_json(
    system: str | list[dict],
    user_message: str,
    *,
    model: str | None = None,
    max_tokens: int = 16384,
    temperature: float = 0.5,
) -> dict:
    result = await _invoke(
        system,
        user_message,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    text = result["content"][0]["text"]
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    return json.loads(text.strip())
