import test from "node:test";
import assert from "node:assert/strict";

import {
  getNotificationPermissionStatus,
  showBrowserNotification,
} from "../lib/notifications.ts";

test("browser notification can be triggered when permission is granted", () => {
  let notificationCall = null;

  globalThis.Notification = class {
    static permission = "granted";

    constructor(title, options) {
      notificationCall = { title, options };
    }
  };

  globalThis.window = {
    Notification: globalThis.Notification,
  };

  const sent = showBrowserNotification(
    "CityVibe update",
    "A new event is live.",
  );

  assert.equal(sent, true);
  assert.deepEqual(notificationCall, {
    title: "CityVibe update",
    options: {
      body: "A new event is live.",
      icon: "/icon.svg",
      tag: "CityVibe update",
    },
  });
});

test("browser notification falls back to in-app toast when Notification throws", () => {
  const dispatchedEvents = [];

  globalThis.Notification = class {
    static permission = "granted";

    constructor() {
      throw new Error("Notifications unavailable");
    }
  };

  globalThis.window = {
    Notification: globalThis.Notification,
    dispatchEvent(event) {
      dispatchedEvents.push(event);
      return true;
    },
    CustomEvent,
  };

  const sent = showBrowserNotification(
    "CityVibe update",
    "A new event is live.",
  );

  assert.equal(sent, false);
  assert.equal(dispatchedEvents.length, 1);
  assert.equal(dispatchedEvents[0].type, "cityvibe-toast");
  assert.deepEqual(dispatchedEvents[0].detail, {
    title: "CityVibe update",
    body: "A new event is live.",
  });
});

test("notification permission status is stable for hydration", () => {
  const previousWindow = globalThis.window;
  const previousNotification = globalThis.Notification;

  try {
    Reflect.deleteProperty(globalThis, "window");
    assert.equal(getNotificationPermissionStatus(), "unsupported");

    globalThis.Notification = { permission: "default" };
    globalThis.window = {
      Notification: globalThis.Notification,
    };
    assert.equal(getNotificationPermissionStatus(), "default");

    globalThis.Notification = { permission: "granted" };
    globalThis.window = {
      Notification: globalThis.Notification,
    };
    assert.equal(getNotificationPermissionStatus(), "granted");
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      globalThis.window = previousWindow;
    }

    if (previousNotification === undefined) {
      Reflect.deleteProperty(globalThis, "Notification");
    } else {
      globalThis.Notification = previousNotification;
    }
  }
});
