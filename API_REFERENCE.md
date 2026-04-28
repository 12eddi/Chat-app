# API Reference

This document summarizes the main REST endpoints exposed by the chat app backend.

Base URL in local development: `http://localhost:5000/api`

## Auth

### `POST /auth/register`
Creates a new account.

Request body:

```json
{
  "firstName": "Alex",
  "lastName": "Hr",
  "username": "alexhr",
  "email": "alex@example.com",
  "password": "secret123",
  "birthDate": "2000-01-01"
}
```

### `POST /auth/login`
Logs in with email or username.

```json
{
  "identifier": "alex@example.com",
  "password": "secret123"
}
```

### `GET /auth/me`
Returns the authenticated user.

Auth: Bearer token required

### `POST /auth/forgot-password`
Starts the password reset flow.

```json
{
  "email": "alex@example.com"
}
```

### `POST /auth/reset-password`
Completes the reset flow with a token and new password.

```json
{
  "token": "reset-token",
  "password": "newSecret123"
}
```

### `POST /auth/verify-email`
Verifies the email address from a verification token.

```json
{
  "token": "verification-token"
}
```

### `POST /auth/resend-verification`
Resends the verification email.

```json
{
  "email": "alex@example.com"
}
```

## Users

All user endpoints require authentication and a verified email.

### `GET /users?query=alex`
Searches for users.

### `GET /users/:userId`
Fetches detailed info for another user.

### `PUT /users/profile`
Updates the current user profile.

### `PUT /users/change-password`
Changes the current user password.

### `POST /users/upload-photo`
Uploads a profile photo using `multipart/form-data`.

## Chats

All chat endpoints require authentication and a verified email.

### `GET /chats`
Returns the current user's chats.

### `POST /chats/direct`
Gets or creates a direct chat.

```json
{
  "userId": "target-user-uuid"
}
```

### `POST /chats/group`
Creates a group chat and sends pending invites.

```json
{
  "name": "Design Team",
  "userIds": ["user-uuid-1", "user-uuid-2"]
}
```

### `GET /chats/invites`
Returns pending group invites for the current user.

### `POST /chats/invites/:inviteId/accept`
Accepts a group invite.

### `POST /chats/invites/:inviteId/reject`
Rejects a group invite.

### `POST /chats/:chatId/participants`
Invites more users to a group chat.

```json
{
  "userIds": ["user-uuid-3", "user-uuid-4"]
}
```

### `PATCH /chats/:chatId/participants/:participantId/role`
Promotes or demotes a group participant.

```json
{
  "role": "ADMIN"
}
```

Allowed roles: `ADMIN`, `MEMBER`

### `PATCH /chats/:chatId`
Updates group details such as name and photo.

Content type: `multipart/form-data`

Fields:
- `name`: optional string
- `photo`: optional image file

### `DELETE /chats/:chatId/participants/:participantId`
Removes a participant from a group.

### `POST /chats/:chatId/leave`
Leaves a group chat.

## Messages

All message endpoints require authentication and a verified email.

### `GET /chats/:chatId/messages`
Returns chat messages and marks unread incoming messages as read.

### `POST /chats/:chatId/messages`
Creates an immediate or scheduled message.

Content type: `multipart/form-data`

Fields:
- `content`: string
- `image`: optional image file
- `scheduledFor`: optional ISO timestamp

### `PATCH /chats/messages/:messageId`
Edits a previously sent message.

```json
{
  "content": "Updated message text"
}
```

### `PATCH /chats/messages/:messageId/schedule`
Reschedules a pending scheduled message.

```json
{
  "content": "Updated scheduled text",
  "scheduledFor": "2026-04-28T13:30:00.000Z"
}
```

### `POST /chats/messages/:messageId/cancel-schedule`
Cancels a pending scheduled message.

### `DELETE /chats/messages/:messageId`
Deletes a message.

## Notifications

All notification endpoints require authentication and a verified email.

### `GET /notifications`
Returns notifications for the current user.

### `POST /notifications/:notificationId/read`
Marks a single notification as read.

### `POST /notifications/read-all`
Marks all notifications as read.

## Realtime Socket Events

Main events used by the frontend:
- `receive_message`
- `message_delivered`
- `messages_read`
- `typing`
- `stop_typing`
- `online_users`
- `presence_snapshot`
- `notification:new`
- `chat:updated`
- `group_invites:updated`
- `chat:left`
