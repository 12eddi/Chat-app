# Chat App Project Context

## Stack
- React + TypeScript + Zustand
- Node.js + Express
- Prisma + PostgreSQL
- Socket.IO

## Implemented
- Auth
- Chats
- Realtime messaging
- Profile page
- Change password
- Profile photo upload
- Online users
- Typing indicator
- Unread count
- Message status UI

## Conventions
- `req.user.id` is used in backend
- Prisma user password field is `passwordHash`
- `profilePhotoUrl` is the avatar field
- Message status enum: `SENT`, `DELIVERED`, `READ`

## Current focus
Stabilize message sending and realtime delivery/read flow.