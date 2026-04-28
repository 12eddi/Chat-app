# Chat App

A browser-based fullstack chat application built for the internship challenge. The app uses a React frontend and a Node.js/Express backend with Prisma, PostgreSQL, and Socket.IO for realtime communication.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Zustand
- Axios
- Socket.IO client

### Backend
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Socket.IO
- JWT authentication
- Nodemailer
- Multer

## Implemented Features

### Auth and Account
- Registration
- Login with email or username
- JWT-based protected routes
- Email verification
- Resend verification email
- Verified-email-only app access
- Forgot password via email
- Password reset via token link
- Profile update
- Change password
- Profile photo upload
- Google sign-in support

### Chat and Messaging
- Direct chats
- Group chats
- Group invites accept/reject
- Group roles: owner, admin, member
- Remove member / leave group
- Real-time messaging with Socket.IO
- Typing indicator
- Online and away presence
- Unread counts
- Message status: `SENT`, `DELIVERED`, `READ`
- Edit message
- Delete message
- Search inside conversation
- Image sharing in chat
- Scheduled messages
- Reschedule scheduled messages
- Cancel scheduled messages

### Notifications and UX
- In-app notifications
- Browser notifications
- User search
- View other user details
- Error toasts
- Loading states
- Validation on key forms
- Responsive chat layout
- Minimal redesigned chat/auth/profile UI

## Project Structure

```text
chat-app/
├─ backend/
│  ├─ prisma/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ middleware/
│  │  ├─ modules/
│  │  │  ├─ auth/
│  │  │  ├─ chats/
│  │  │  ├─ messages/
│  │  │  ├─ notifications/
│  │  │  └─ users/
│  │  ├─ types/
│  │  └─ utils/
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ pages/
│  │  ├─ store/
│  │  ├─ types/
│  │  └─ utils/
├─ API_REFERENCE.md
├─ ARCHITECTURE.md
├─ docker-compose.yml
└─ README.md
```

## Local Setup

### Prerequisites
- Node.js 20+ recommended
- PostgreSQL
- npm

### 1. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 2. Configure backend environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/chatapp?schema=public"
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_real_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_FROM="Chat App <yourgmail@gmail.com>"

PASSWORD_RESET_TOKEN_TTL_MINUTES=30
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60

GOOGLE_CLIENT_ID=your_google_client_id

SCHEDULED_MESSAGE_POLL_MS=5000
SCHEDULED_MESSAGE_BATCH_SIZE=20
SCHEDULED_MESSAGE_ERROR_BACKOFF_MS=15000
RUN_SCHEDULED_MESSAGE_PROCESSOR=true
```

Notes:
- `DATABASE_URL` and `JWT_SECRET` are required.
- Mail settings are optional as a group, but all SMTP variables plus `MAIL_FROM` must be set together.
- `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60` matches the challenge’s 1-hour verification expiry.
- `RUN_SCHEDULED_MESSAGE_PROCESSOR=true` keeps scheduled messages enabled. You can turn it off explicitly in environments where you do not want the API process to run the scheduler.

### 3. Database setup

From `backend/`:

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start the app

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

App URLs:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)

## Docker Setup

This repo now includes:
- [backend/Dockerfile](./backend/Dockerfile)
- [frontend/Dockerfile](./frontend/Dockerfile)
- [docker-compose.yml](./docker-compose.yml)

Run the full stack with Docker:

```bash
docker compose up --build
```

Services:
- frontend on `http://localhost:5173`
- backend on `http://localhost:5000`
- postgres on `localhost:5432`

Important:
- change `JWT_SECRET` in `docker-compose.yml` before real use
- add SMTP and Google env values in Compose if you want email and Google auth in containers
- the Docker setup runs scheduled-message processing inside the backend container, which matches the current Socket.IO-based realtime architecture

## Testing

### Backend tests

From `backend/`:

```bash
npm test
```

Current automated coverage includes:
- auth routes
- forgot password / reset password
- email verification / resend verification
- message create/fetch/update/delete routes
- scheduled message route flows
- group invite and participant-management routes
- scheduled-message processor behavior

## API Documentation

See [API_REFERENCE.md](./API_REFERENCE.md) for the main REST endpoints and socket events.

## Architecture Notes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- the system diagram
- request/data flow
- frontend/backend structure
- realtime design decisions

## Key Architecture Decisions

### React + Vite
- fast feedback loop
- good fit for realtime UI
- simple deployment output

### Express + Prisma + PostgreSQL
- easy modular backend organization
- relational model fits users, chats, participants, invites, and messages well
- Prisma keeps schema and data access aligned

### JWT auth
- simple browser-friendly auth for a challenge submission
- easy to protect REST endpoints and hydrate client session state

### Socket.IO
- fits delivery/read receipts, typing, presence, notifications, and realtime chat updates

### Modular monolith
- keeps the project easier to reason about than splitting into microservices
- still allows separation by domain module

### Hardened in-process scheduled-message worker
- keeps the current realtime Socket.IO delivery flow intact
- adds batch sizing, error backoff, overlap protection, and graceful shutdown hooks
- is a safer step toward production than the old timer loop without forcing a queue redesign

## Assumptions
- The primary target is browser usage.
- JWT in `localStorage` is acceptable for the challenge scope.
- Gmail SMTP is the current mail delivery provider.
- The single-server local setup remains the default development mode.
- The Docker deployment keeps scheduled-message processing in the API container because realtime delivery currently depends on the live Socket.IO server process.

## Known Limitations
- Scheduled messages are more robust now, but a dedicated job system like BullMQ or a cloud queue would still be better for large-scale production use.
- Media sharing is currently image-focused, not a full general file-attachment system.
- Group features do not yet include public/private discovery models.
- Infinite scrolling is not implemented.
- End-to-end encryption is not implemented.
- Browser notifications depend on user permission and browser support.

## Submission Alignment

This project now covers:
- browser access
- registration and login
- access control
- profile management
- user discovery
- one-to-one chat
- group chat
- persistence
- validation and error handling
- email verification
- forgot password
- message edit/delete
- search in conversation
- presence
- notifications
- automated backend tests
- architecture documentation
- API reference
- Dockerized local deployment
