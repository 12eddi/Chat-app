# Mobile App Setup

This folder contains the React Native mobile client for the existing chat app.

## Stack

- Expo Dev Build
- React Native
- React Navigation
- Axios
- Socket.IO client
- SecureStore for auth token persistence
- Firebase Cloud Messaging (FCM) for push notifications

## What It Reuses

The mobile app reuses the existing backend API and Socket.IO server:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`
- `POST /api/users/device-token`

## Environment Variables

Create a `.env` file inside `mobile/`:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-railway-backend-url
EXPO_PUBLIC_SOCKET_URL=https://your-railway-backend-url
```

Example:

```env
EXPO_PUBLIC_API_BASE_URL=https://chat-apps.up.railway.app
EXPO_PUBLIC_SOCKET_URL=https://chat-apps.up.railway.app
```

## Firebase Setup

Firebase is used only for push notifications.

### 1. Create a Firebase project

- Open [Firebase Console](https://console.firebase.google.com/)
- Create a new project or use an existing one
- Add Android and/or iOS apps

### 2. Download native config files

For Android:
- download `google-services.json`
- place it in `mobile/google-services.json`

For iOS:
- download `GoogleService-Info.plist`
- place it in `mobile/GoogleService-Info.plist`

These files are ignored by git.

### 3. Expo Dev Build requirement

This app is set up for Expo Dev Build, not Expo Go.

Install dependencies:

```bash
cd mobile
npm install
```

Start a local dev build:

```bash
npx expo start --dev-client
```

If native folders are needed:

```bash
npx expo prebuild
```

### 4. Backend Firebase Admin variables

Add one of these configurations to the backend:

#### Option A: full JSON in one env var

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
```

#### Option B: split env vars

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Push Notification Flow

1. User logs into mobile app
2. Mobile app requests notification permission
3. Mobile app gets FCM token
4. Mobile app sends token to `POST /api/users/device-token`
5. Backend stores device token in `UserDeviceToken`
6. On new message, backend sends push to recipient devices
7. Tapping the notification opens the target chat

## Run Commands

```bash
cd mobile
npm install
npx expo start --dev-client
```
