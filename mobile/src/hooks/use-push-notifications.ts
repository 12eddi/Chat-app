import { useEffect, useRef } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import Constants from "expo-constants";
import messaging from "@react-native-firebase/messaging";
import { storeDeviceToken } from "../api/users";
import { navigationRef } from "../navigation/AppNavigator";

type UsePushNotificationsParams = {
  token: string | null;
  userId: string | null;
};

const openNotificationTarget = (data?: Record<string, string>) => {
  if (!data?.chatId) {
    return;
  }

  if (navigationRef.isReady()) {
    navigationRef.navigate("Chat", {
      chatId: data.chatId,
      title: data.title || "Chat",
    });
  }
};

export function usePushNotifications({ token, userId }: UsePushNotificationsParams) {
  const sentTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const setupNotifications = async () => {
      try {
        if (Platform.OS === "android" && Platform.Version >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }

        await messaging().registerDeviceForRemoteMessages();
        await messaging().requestPermission();

        const fcmToken = await messaging().getToken();

        if (fcmToken && sentTokenRef.current !== fcmToken) {
          const platform =
            Constants.platform?.ios != null
              ? "ios"
              : Constants.platform?.android != null
              ? "android"
              : "unknown";

          await storeDeviceToken(fcmToken, platform);
          sentTokenRef.current = fcmToken;
        }
      } catch (error) {
        console.error("Failed to register push notifications", error);
      }
    };

    void setupNotifications();
  }, [token, userId]);

  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.notification?.title || remoteMessage.notification?.body) {
        Alert.alert(
          remoteMessage.notification?.title || "New notification",
          remoteMessage.notification?.body || ""
        );
      }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      openNotificationTarget(remoteMessage.data as Record<string, string> | undefined);
    });

    void messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          openNotificationTarget(remoteMessage.data as Record<string, string> | undefined);
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, []);
}
