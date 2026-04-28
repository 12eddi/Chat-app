# Deployment (Railway + Vercel)

This repo is a monorepo:
- `backend/` (Node/Express/Prisma/Socket.IO)
- `frontend/` (React/Vite)

## 1) GitHub
Push the whole repo (root containing both `backend/` and `frontend/`).

## 2) Railway (Backend + Postgres)
1. Create a Railway project and connect the GitHub repo.
2. Add a **Postgres** database to the project.
3. Create a **service** for the backend:
   - Root directory: `backend`
   - Build command:
     - `npm ci`
     - `npm run prisma:generate`
     - `npm run build`
   - Start command:
     - `npm run prisma:deploy && npm run start`

### Railway environment variables (Backend)
Set these in Railway for the backend service:
- `DATABASE_URL` (Railway provides it)
- `JWT_SECRET`
- `CLIENT_URL` (your Vercel frontend URL)
- `PORT` (Railway sets this automatically; you can omit it)

Optional (email):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`

Optional (tokens / scheduler):
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`
- `RUN_SCHEDULED_MESSAGE_PROCESSOR=true`

When Railway gives you a public URL for the backend (example):
`https://your-backend.up.railway.app`

## 3) Vercel (Frontend)
1. Import the GitHub repo in Vercel.
2. Project settings:
   - Root directory: `frontend`
   - Framework: Vite
3. Environment variables:
   - `VITE_API_BASE_URL` = your Railway backend URL (no `/api` at the end)
   - `VITE_SOCKET_URL` = same Railway backend URL (usually identical)

Deploy.

## 4) CORS
Backend uses `CLIENT_URL` for Socket.IO + CORS. Make sure `CLIENT_URL` matches the Vercel deployment URL (or your custom domain).

## 5) Prisma migrations
Deploy runs `prisma migrate deploy` via `npm run prisma:deploy` on startup.

## Local env examples
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`

