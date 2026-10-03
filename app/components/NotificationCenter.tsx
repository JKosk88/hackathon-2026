"use client";

import { useEffect, useState } from "react";

import { useLanguage } from "@/app/components/LanguageProvider";
import type { EventItem } from "@/app/data/events";
import {
  NOTIFICATION_STORAGE_KEY,
  getNotificationPermissionStatus,
  showBrowserNotification,
  showInAppNotification,
  subscribeUser,
  type Reminder,
} from "@/lib/notifications";

let sharedReminders: Reminder[] = [];
const listeners = new Set<() => void>();

function getStoredReminders(): Reminder[] {
  if (typeof window === "undefined") {
    return sharedReminders;
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notifyRemindersChanged() {
  for (const listener of listeners) {
    listener();
  }
}

function persistReminders(nextReminders: Reminder[]) {
  sharedReminders = nextReminders;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(nextReminders),
    );
  }

  notifyRemindersChanged();
}

export function useNotificationPreferences() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncReminders = () => {
      setReminders(getStoredReminders());
    };

    sharedReminders = getStoredReminders();
    setPermission(getNotificationPermissionStatus());
    setReminders(sharedReminders);
    listeners.add(syncReminders);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_STORAGE_KEY) {
        syncReminders();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(syncReminders);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(
      result === "granted"
        ? result
        : result === "denied"
          ? "denied"
          : "default",
    );

    return result === "granted";
  };

  const removeReminder = (eventId: string) => {
    const next = sharedReminders.filter((item) => item.eventId !== eventId);
    persistReminders(next);
    setReminders(next);
  };

  const toggleReminder = async (event: EventItem) => {
    if (typeof window === "undefined") {
      return false;
    }

    if (!("Notification" in window)) {
      return false;
    }

    const isEnabled = reminders.some((item) => item.eventId === event.id);

    if (isEnabled) {
      removeReminder(event.id);
      return true;
    }

    if (Notification.permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    }

    const nextReminder: Reminder = {
      eventId: event.id,
      title: event.title,
      savedAt: Date.now(),
    };

    const next = [
      nextReminder,
      ...sharedReminders.filter((item) => item.eventId !== event.id),
    ];
    persistReminders(next);
    setReminders(next);
    showBrowserNotification(
      "Event reminder saved",
      `${event.title} is now in your alerts.`,
    );
    return true;
  };

  const isSubscribed = (eventId: string) =>
    reminders.some((item) => item.eventId === eventId);

  return {
    permission,
    reminders,
    requestPermission,
    removeReminder,
    toggleReminder,
    isSubscribed,
  };
}

export function EventNotificationToggle({ event }: { event: EventItem }) {
  const { t } = useLanguage();
  const { permission, isSubscribed, toggleReminder } =
    useNotificationPreferences();
  const enabled = isSubscribed(event.id);

  return (
    <button
      type="button"
      onClick={() => toggleReminder(event)}
      className={[
        "rounded-full border px-3.5 py-2.5 text-xs font-semibold transition-colors",
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/70 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        permission === "denied" ? "cursor-not-allowed opacity-70" : "",
      ].join(" ")}
    >
      {enabled
        ? t("alertsOn")
        : permission === "denied"
          ? t("alertsBlocked")
          : t("notifyMe")}
    </button>
  );
}

export function NotificationCenter() {
  const { t } = useLanguage();
  const { permission, reminders, removeReminder, requestPermission } =
    useNotificationPreferences();
  const [isOpen, setIsOpen] = useState(false);

  const handleSendTestNotification = async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (Notification.permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }

    const hasPublicKey = Boolean(
      typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    );

    console.log(
      "Sending test notification 4",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    );
    if (!hasPublicKey) {
      console.warn(
        "[notifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing, so no push subscription payload can be created for the backend.",
      );
    }

    if (hasPublicKey) {
      try {
        await subscribeUser(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
          "",
          "/api/notifications/subscribe",
        );
      } catch {
        // Fall through to the standard in-browser alert if the backend is unavailable.
      }
    }

    const delivered = showBrowserNotification(
      "CityVibe update",
      "A new local event just appeared near you.",
    );

    if (delivered) {
      showInAppNotification(
        "CityVibe update",
        "A new local event just appeared near you.",
      );
    }
  };

  const permissionLabel =
    permission === "granted"
      ? t("alertsEnabled")
      : permission === "denied"
        ? t("alertsBlocked")
        : permission === "unsupported"
          ? t("notificationsUnavailable")
          : t("enableAlerts");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label={t("notifications")}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4"
        >
          <path
            d="M10 2.5a4 4 0 0 1 4 4V8.7c0 1.7.7 3.3 1.9 4.4l.5.5H3.6l.5-.5A6.1 6.1 0 0 0 6 8.7V6.5a4 4 0 0 1 4-4Zm0 15a2.5 2.5 0 0 1-2.3-1.5h4.6A2.5 2.5 0 0 1 10 17.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {reminders.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {reminders.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t("notifications")}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {permissionLabel}
              </p>
            </div>
            {permission !== "granted" && permission !== "unsupported" ? (
              <button
                type="button"
                onClick={() => requestPermission()}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                {t("enableAlerts")}
              </button>
            ) : null}
            {permission === "granted" ? (
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t("testNotification")}zzz
              </button>
            ) : null}
          </div>

          <div className="mt-3 space-y-2">
            {reminders.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {t("noNotifications")}
              </p>
            ) : (
              reminders.map((item) => (
                <div
                  key={item.eventId}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {t("alertReady")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReminder(item.eventId)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {t("remove")}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
