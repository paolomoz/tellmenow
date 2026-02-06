from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent / ".env"),
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    anthropic_api_key: str = ""

    # AWS Bedrock
    use_bedrock: bool = False
    aws_region: str = "us-east-1"
    anthropic_model: str = "global.anthropic.claude-opus-4-5-20251101-v1:0"
    anthropic_aws_bearer_token_bedrock: str = ""

    # Model settings
    claude_model: str = "claude-opus-4-5-20251101"

    # Server
    cors_origins: list[str] = ["http://localhost:3000"]
    output_dir: str = str(Path(__file__).resolve().parent.parent / "output")

    # Limits
    max_concurrent_jobs: int = 5

    # Auth (shared with NextAuth frontend)
    auth_secret: str = ""


settings = Settings()
