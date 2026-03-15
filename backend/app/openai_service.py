import httpx


SYSTEM_PROMPT = (
    "You are a senior code reviewer. Review the pull request diff and find real bugs, security issues,"
    " and reliability problems. Keep feedback concise and practical."
)

MENTOR_SYSTEM_PROMPT = (
    "You are AI Dev Mentor, a senior software engineer and secure coding coach. "
    "Explain clearly, prioritize practical fixes, and include secure coding guidance where relevant."
)


def _post_chat_completion(api_key: str, api_url: str, payload: dict) -> str:
    with httpx.Client(timeout=60) as client:
        resp = client.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = ""
            try:
                error_payload = resp.json()
                detail = error_payload.get("error", {}).get("message", "")
            except Exception:
                detail = resp.text
            status = exc.response.status_code if exc.response else "unknown"
            message = detail.strip() or str(exc)
            raise RuntimeError(f"LLM API error ({status}): {message}") from exc

        data = resp.json()

    return data["choices"][0]["message"]["content"]


def analyze_diff(api_key: str, api_url: str, model: str, repo_full_name: str, pr_number: int, diff_summary: str) -> str:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Repository: {repo_full_name}\n"
                    f"PR: #{pr_number}\n\n"
                    "Return in this format:\n"
                    "1) Summary (2-4 lines)\n"
                    "2) Findings (bullet list, include severity high/medium/low)\n"
                    "3) Suggested fixes (short)\n\n"
                    "Diff:\n"
                    f"{diff_summary}"
                ),
            },
        ],
        "temperature": 0.2,
    }

    return _post_chat_completion(api_key, api_url, payload)


def mentor_chat(api_key: str, api_url: str, model: str, prompt: str, code: str | None = None) -> str:
    user_content = f"User request:\n{prompt.strip()}"
    if code and code.strip():
        user_content += f"\n\nCode snippet:\n```\n{code.strip()}\n```"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": MENTOR_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"{user_content}\n\n"
                    "Respond with:\n"
                    "1) What this code/request means\n"
                    "2) Risks or issues (if any)\n"
                    "3) Improved version or concrete next steps\n"
                    "Keep it concise and practical."
                ),
            },
        ],
        "temperature": 0.3,
    }

    return _post_chat_completion(api_key, api_url, payload)
