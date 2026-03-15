import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]

# Load workspace/root .env first, then let backend/.env override it.
# `override=True` is required so edited values actually replace stale
# process environment values during reloads.
load_dotenv()
load_dotenv(BACKEND_ROOT / ".env", override=True)

# LLM provider config (defaults to Grok/xAI OpenAI-compatible endpoint)
_grok_api_key = os.getenv("GROK_API_KEY", "").strip()
_openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
LLM_API_KEY = _grok_api_key or _openai_api_key
LLM_API_URL = os.getenv("LLM_API_URL", "https://api.x.ai/v1/chat/completions")
LLM_MODEL = os.getenv("LLM_MODEL", "grok-2-latest")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "no-reply@code-guardian.local")


def _is_truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


OTP_FALLBACK_MODE = _is_truthy(os.getenv("OTP_FALLBACK_MODE", "false"))
