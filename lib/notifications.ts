export type Reminder = {
  eventId: string;
  title: string;
  savedAt: number;
};

export type NotificationSubscriptionResult = {
  subscription: PushSubscription;
  uuid: string;
};

export const NOTIFICATION_STORAGE_KEY = "cityvibe-notification-reminders";

export type NotificationPermissionStatus =
  | NotificationPermission
  | "unsupported";

export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export const subscribeUser2 = (applicationServerKey: string, token: string) => {
  const subscriptionOptions = {
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey,
  };

  return new Promise(
    async (
      resolve: (data: { subscription: PushSubscription; uuid: string }) => void,
      reject,
    ) => {
      if (!("serviceWorker" in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        reject("No registration, exit");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        reject("Permission not granted");
      }

      let subscription: PushSubscription | undefined;
      try {
        subscription =
          await registration.pushManager.subscribe(subscriptionOptions);
      } catch (e) {
        console.log("error while subscribing", e, subscriptionOptions);
        reject(e);
      }

      if (!subscription) {
        return reject("Could not subscribe");
      }

      const body = JSON.stringify(subscription.toJSON());
      console.log(body);
      // Send this subscription to your backend

      resolve({
        subscription: subscription,
        uuid: "json.uuid",
      });
    },
  );
};

export function subscribeUser(
  applicationServerKey: string,
  token: string,
  endpointUrl = "/api/notifications/subscribe",
): Promise<NotificationSubscriptionResult> {
  return new Promise(async (resolve, reject) => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      reject(new Error("Service workers are not supported in this browser."));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        reject(new Error("Service worker registration is not ready."));
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        reject(new Error("Notification permission was not granted."));
        return;
      }

      const options = {
        userVisibleOnly: true,
        applicationServerKey,
      };

      const subscription = await registration.pushManager.subscribe(options);
      console.log("Subscribed with options:", subscription);
      if (!subscription) {
        reject(new Error("Could not subscribe to push notifications."));
        return;
      }

      const subscriptionPayload = subscription.toJSON();
      const x = {
        browserOrigin: window.location.origin,
        subscribeEndpointUrl: endpointUrl,
        endpoint: subscriptionPayload.endpoint,
        expirationTime: subscriptionPayload.expirationTime ?? null,
        keys: subscriptionPayload.keys ?? null,
      };
      window.navigator.clipboard.writeText(JSON.stringify(x));
      console.info("[notifications] store this backend subscription", x);

      const response = await fetch(`${window.location.origin}${endpointUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(subscriptionPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(
          "[notifications] failed to persist backend subscription",
          {
            browserOrigin: window.location.origin,
            subscribeEndpointUrl: endpointUrl,
            status: response.status,
            responseText: text || null,
            endpoint: subscriptionPayload.endpoint,
          },
        );
        reject(
          new Error(text || "Failed to save the notification subscription."),
        );
        return;
      }

      const json = (await response.json()) as { uuid?: string };
      console.info("[notifications] backend subscription saved", {
        browserOrigin: window.location.origin,
        subscribeEndpointUrl: endpointUrl,
        backendSubscriptionUuid: json.uuid ?? "local",
        endpoint: subscriptionPayload.endpoint,
        expirationTime: subscriptionPayload.expirationTime ?? null,
        keys: subscriptionPayload.keys ?? null,
      });

      resolve({
        subscription,
        uuid: json.uuid ?? "local",
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function showInAppNotification(title: string, body: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("cityvibe-toast", {
      detail: { title, body },
    }),
  );
}

export function showBrowserNotification(title: string, body: string): boolean {
  if (!isNotificationSupported()) {
    showInAppNotification(title, body);
    return false;
  }

  if (Notification.permission !== "granted") {
    showInAppNotification(title, body);
    return false;
  }

  try {
    new Notification(title, {
      body,
      icon: "/icon.svg",
      tag: title,
    });
  } catch {
    showInAppNotification(title, body);
    return false;
  }

  return true;
}
