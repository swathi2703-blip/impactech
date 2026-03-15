# Code Guardian AI

Monorepo with a React frontend and a FastAPI backend for GitHub PR webhook automation.

## Folder structure

- frontend/ - Vite + React + TypeScript UI
- backend/ - FastAPI webhook and integrations

## APIs used

1. OpenAI API
- Endpoint: https://api.openai.com/v1/chat/completions
- Purpose: analyze PR diffs and generate review findings

2. GitHub API
- Endpoint: https://api.github.com
- Purpose: fetch PR files/diff and post PR comments

3. GitHub Webhooks
- GitHub sends pull_request event payloads to backend /webhook

## Backend stack

- FastAPI
- Uvicorn
- PyGithub
- python-dotenv
- httpx

## Setup

1. Frontend env
- File: frontend/.env
- Required:
	- VITE_GITHUB_TOKEN
	- VITE_OPENAI_API_KEY
	- VITE_OTP_ENDPOINT=https://declinational-undistractedly-maureen.ngrok-free.dev/api/otp/send

2. Backend env
- Copy backend/.env.example to backend/.env
- Required:
	- OPENAI_API_KEY
	- GITHUB_TOKEN
	- GITHUB_WEBHOOK_SECRET
- Optional SMTP for OTP:
	- SMTP_HOST
	- SMTP_PORT
	- SMTP_USERNAME
	- SMTP_PASSWORD
	- SMTP_FROM

## Run

Install frontend deps:

```sh
npm --prefix frontend install
```

Install backend deps:

```sh
npm run backend:setup
```

Run both frontend and backend:

```sh
npm run dev
```

Endpoints:
- Frontend: http://localhost:8080
- Backend health: https://declinational-undistractedly-maureen.ngrok-free.dev/health
- Webhook: POST https://declinational-undistractedly-maureen.ngrok-free.dev/webhook
- OTP send: POST https://declinational-undistractedly-maureen.ngrok-free.dev/api/otp/send
