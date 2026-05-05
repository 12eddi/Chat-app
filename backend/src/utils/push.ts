import prisma from "../config/prisma";
import { getFirebaseAdminApp, isFirebaseConfigured } from "./firebase-admin";

type PushPayload = {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

export const sendPushToUserDevices = async (payload: PushPayload) => {
  if (!isFirebaseConfigured()) {
    return;
  }

  const app = getFirebaseAdminApp();

  if (!app) {
    return;
  }

  const messaging = app.messaging();
  const deviceTokens = await prisma.userDeviceToken.findMany({
    where: {
      userId: payload.userId,
    },
    select: {
      id: true,
      token: true,
    },
  });

  if (deviceTokens.length === 0) {
    return;
  }

  const response = await messaging.sendEachForMulticast({
    tokens: deviceTokens.map((item) => item.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
  });

  const invalidTokenIds = response.responses
    .map((result, index) => ({ result, token: deviceTokens[index] ?? null }))
    .filter(({ result }) => {
      if (result.success || !result.error) {
        return false;
      }

      const code = result.error.code;
      return (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      );
    })
    .filter(
      (entry): entry is { result: (typeof response.responses)[number]; token: { id: string; token: string } } =>
        entry.token !== null
    )
    .map(({ token }) => token.id);

  if (invalidTokenIds.length > 0) {
    await prisma.userDeviceToken.deleteMany({
      where: {
        id: {
          in: invalidTokenIds,
        },
      },
    });
  }
};
