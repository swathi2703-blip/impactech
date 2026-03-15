import hashlib
import hmac
import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import (
    GITHUB_TOKEN,
    GITHUB_WEBHOOK_SECRET,
    LLM_API_KEY,
    LLM_API_URL,
    LLM_MODEL,
    OTP_FALLBACK_MODE,
    SMTP_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USERNAME,
)
from .github_service import build_pr_diff_summary
from .models import MentorRequest, OtpRequest
from .models import VerificationLinkConfirmRequest, VerificationLinkSendRequest
from .openai_service import analyze_diff, mentor_chat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Code Guardian Backend")

_verification_tokens: dict[str, dict[str, object]] = {}
_verification_ttl = timedelta(minutes=30)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _verify_github_signature(secret: str, body: bytes, signature_header: str | None) -> bool:
    if not secret:
        return True
    if not signature_header:
        return False

    expected = "sha256=" + hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def _fallback_mentor_reply(prompt: str, code: str | None = None) -> str:
    source_text = "\n".join(part for part in [prompt, code or ""] if part).strip()
    prompt_text = prompt.strip() or "No prompt provided"

    # Specialized fallback for env/config requests so the reply stays relevant.
    if "VITE_" in source_text or ".env" in source_text.lower() or "firebase" in source_text.lower():
        has_frontend_openai = "VITE_OPENAI_API_KEY=" in source_text
        has_firebase_auth_email = "VITE_FIREBASE_AUTH_EMAIL=" in source_text
        has_firebase_auth_password = "VITE_FIREBASE_AUTH_PASSWORD=" in source_text
        has_mentor_localhost = "VITE_MENTOR_ENDPOINT=http://localhost:8081/api/mentor/chat" in source_text

        issues: list[str] = []
        if has_frontend_openai:
            issues.append("`VITE_OPENAI_API_KEY` is exposed to the browser. Move OpenAI keys to `backend/.env` only.")
        if not has_firebase_auth_email:
            issues.append("Missing `VITE_FIREBASE_AUTH_EMAIL` for automatic collaborator email fallback.")
        if not has_firebase_auth_password:
            issues.append("Missing `VITE_FIREBASE_AUTH_PASSWORD` for Firebase email/password sign-in path.")
        if has_mentor_localhost:
            issues.append("`VITE_MENTOR_ENDPOINT` uses localhost, which only works on local machine (not deployed clients).")

        issues_text = "\n".join(f"- {item}" for item in issues) if issues else "- No major config issues detected in provided snippet."

        return (
            "AI Mentor is running in fallback mode (external LLM unavailable), but here is a direct config review.\n\n"
            "Detected issues:\n"
            f"{issues_text}\n\n"
            "Recommended corrected frontend `.env` template:\n"
            "```dotenv\n"
            "VITE_GITHUB_TOKEN=your_github_pat\n"
            "VITE_FIREBASE_API_KEY=your_firebase_api_key\n"
            "VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com\n"
            "VITE_FIREBASE_PROJECT_ID=your_project_id\n"
            "VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app\n"
            "VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id\n"
            "VITE_FIREBASE_APP_ID=your_app_id\n"
            "VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id\n"
            "VITE_FIREBASE_AUTH_EMAIL=approver@company.com\n"
            "VITE_FIREBASE_AUTH_PASSWORD=your_firebase_password\n"
            "VITE_OTP_ENDPOINT=https://your-public-otp-endpoint/api/otp/send\n"
            "VITE_MENTOR_ENDPOINT=http://localhost:8081/api/mentor/chat\n"
            "```\n\n"
            "Security note: keep `OPENAI_API_KEY` only in `backend/.env` and rotate any key that was pasted in chat/UI."
        )

    return (
        "AI Mentor is running in fallback mode because the external LLM is currently unavailable.\n\n"
        "What I understood:\n"
        f"- Request: {prompt_text}\n\n"
        "Suggested next steps:\n"
        "1) Clarify expected behavior and edge cases.\n"
        "2) Add input validation and explicit error handling.\n"
        "3) Add tests for success and failure paths.\n"
        "4) Once LLM quota is restored, retry for deeper code-level feedback."
    )


def _frontend_base_url() -> str:
    return (
        "http://localhost:8080"
        if not (value := __import__("os").getenv("FRONTEND_BASE_URL", "").strip())
        else value.rstrip("/")
    )


def _build_verify_link(token: str, frontend_base_url: str | None = None) -> str:
    base = (frontend_base_url or "").strip().rstrip("/") or _frontend_base_url()
    return f"{base}/settings?verifyToken={token}"


def _send_email_message(recipient: str, subject: str, content: str):
    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(content)
    return message


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/webhook")
async def github_webhook(
    request: Request,
    x_github_event: str | None = Header(default=None),
    x_hub_signature_256: str | None = Header(default=None),
):
    raw_body = await request.body()

    if not _verify_github_signature(GITHUB_WEBHOOK_SECRET, raw_body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()

    if x_github_event != "pull_request":
        return JSONResponse({"status": "ignored", "reason": "not pull_request"})

    action = payload.get("action")
    if action not in {"opened", "synchronize", "reopened"}:
        return JSONResponse({"status": "ignored", "reason": f"action={action}"})

    if not GITHUB_TOKEN or not LLM_API_KEY:
        raise HTTPException(status_code=500, detail="Missing GITHUB_TOKEN or GROK_API_KEY/OPENAI_API_KEY")

    repo_full_name = payload["repository"]["full_name"]
    pr_number = payload["pull_request"]["number"]

    try:
        diff_summary, repo = build_pr_diff_summary(GITHUB_TOKEN, repo_full_name, pr_number)
        review_text = analyze_diff(LLM_API_KEY, LLM_API_URL, LLM_MODEL, repo_full_name, pr_number, diff_summary)

        issue = repo.get_issue(pr_number)
        issue.create_comment(f"## AI Review\n\n{review_text}")

        return JSONResponse({"status": "comment_posted", "repo": repo_full_name, "pr": pr_number})
    except Exception as exc:
        logger.exception("Webhook processing failed")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {exc}") from exc


@app.post("/api/otp/send")
async def send_otp(request: OtpRequest):
    recipients = list(dict.fromkeys([*(request.emails or []), *([request.email] if request.email else [])]))

    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        if OTP_FALLBACK_MODE:
            logger.warning("OTP_FALLBACK_MODE is enabled; skipping SMTP send for %s", recipients)
            return {"status": "sent", "delivery": "fallback", "recipients": recipients, "count": len(recipients)}
        raise HTTPException(status_code=500, detail="SMTP is not configured")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            for recipient in recipients:
                message = EmailMessage()
                message["From"] = SMTP_FROM
                message["To"] = recipient
                message["Subject"] = "Code Guardian verification code"
                message.set_content(
                    f"Hello {request.username},\n\n"
                    f"A collaborator verification request was created for repository {request.repo}.\n"
                    f"Verification code: {request.code}\n"
                    f"Purpose: {request.purpose}\n\n"
                    f"If you approve this request, share this code with the requester.\n"
                )
                smtp.send_message(message)
    except Exception as exc:
        if OTP_FALLBACK_MODE:
            logger.warning("SMTP send failed; using OTP fallback mode for %s", recipients)
            return {"status": "sent", "delivery": "fallback", "recipients": recipients, "count": len(recipients)}
        logger.exception("Failed to send OTP email")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {exc}") from exc

    return {"status": "sent", "recipients": recipients, "count": len(recipients)}


@app.post("/api/verify-link/send")
async def send_verification_link(request: VerificationLinkSendRequest):
    recipients = list(dict.fromkeys([*(request.emails or []), *([request.email] if request.email else [])]))

    if not recipients:
        raise HTTPException(status_code=400, detail="No recipients provided")

    # cleanup expired tokens in-memory
    now = datetime.now(timezone.utc)
    for key, value in list(_verification_tokens.items()):
        expires_at = value.get("expires_at")
        if isinstance(expires_at, datetime) and expires_at <= now:
            _verification_tokens.pop(key, None)

    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        if OTP_FALLBACK_MODE:
            logger.warning("SMTP unavailable. Verification links skipped for %s", recipients)
            return {"status": "sent", "delivery": "fallback", "recipients": recipients, "count": len(recipients)}
        raise HTTPException(status_code=500, detail="SMTP is not configured")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            for recipient in recipients:
                token = secrets.token_urlsafe(32)
                _verification_tokens[token] = {
                    "recipient": recipient,
                    "repo": request.repo,
                    "purpose": request.purpose,
                    "used": False,
                    "expires_at": datetime.now(timezone.utc) + _verification_ttl,
                }
                verify_link = _build_verify_link(token, request.frontendBaseUrl)
                email_body = (
                    f"Hello {request.username},\n\n"
                    f"A collaborator verification request was created for repository {request.repo}.\n"
                    f"Purpose: {request.purpose}\n\n"
                    "Click the link below to verify this request:\n"
                    f"{verify_link}\n\n"
                    "If you did not request this, you can ignore this email.\n"
                )
                smtp.send_message(_send_email_message(recipient, "Code Guardian verification link", email_body))
    except Exception as exc:
        if OTP_FALLBACK_MODE:
            logger.warning("Verification link email failed; fallback mode enabled for %s", recipients)
            return {"status": "sent", "delivery": "fallback", "recipients": recipients, "count": len(recipients)}
        logger.exception("Failed to send verification links")
        raise HTTPException(status_code=500, detail=f"Failed to send verification links: {exc}") from exc

    return {"status": "sent", "recipients": recipients, "count": len(recipients)}


@app.post("/api/verify-link/confirm")
async def confirm_verification_link(request: VerificationLinkConfirmRequest):
    token_state = _verification_tokens.get(request.token)
    if not token_state:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    expires_at = token_state.get("expires_at")
    if isinstance(expires_at, datetime) and expires_at <= datetime.now(timezone.utc):
        _verification_tokens.pop(request.token, None)
        raise HTTPException(status_code=400, detail="Verification token expired")

    if token_state.get("used"):
        raise HTTPException(status_code=400, detail="Verification token already used")

    token_state["used"] = True
    return {"status": "verified", "recipient": token_state.get("recipient"), "repo": token_state.get("repo")}


@app.post("/api/mentor/chat")
async def mentor_endpoint(request: MentorRequest):
    if not LLM_API_KEY:
        return {
            "status": "ok",
            "mode": "fallback",
            "reply": _fallback_mentor_reply(request.prompt, request.code),
        }

    try:
        answer = mentor_chat(
            api_key=LLM_API_KEY,
            api_url=LLM_API_URL,
            model=LLM_MODEL,
            prompt=request.prompt,
            code=request.code,
        )
        return {"status": "ok", "reply": answer}
    except Exception as exc:
        logger.exception("Mentor chat failed")
        return {
            "status": "ok",
            "mode": "fallback",
            "reply": _fallback_mentor_reply(request.prompt, request.code),
            "notice": f"Mentor external model unavailable: {exc}",
        }
