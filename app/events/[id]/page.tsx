"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import {
  EventNotificationToggle,
  useNotificationPreferences,
} from "@/app/components/NotificationCenter";
import { useLanguage } from "@/app/components/LanguageProvider";
import { events } from "@/app/data/events";
import { showBrowserNotification } from "@/lib/notifications";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { requestPermission } = useNotificationPreferences();
  const event = events.find((item) => item.id === params.id);

  if (!event) {
    notFound();
  }

  const handleSendEventAlert = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }

    showBrowserNotification(
      `${event.title} is coming up`,
      `${event.date} at ${event.time} • ${event.location}`,
    );
  };

  return (
    <div className="space-y-8">
      <Link
        href="/events"
        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← {t("backToAllEvents")}
      </Link>

      <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="h-72 w-full" style={{ background: event.accent }} />

        <div className="grid gap-8 p-8 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                {event.category}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {event.price}
              </span>
            </div>

            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                {event.title}
              </h1>
              <p className="mt-3 text-lg text-slate-600">{event.summary}</p>
            </div>

            <p className="text-base leading-7 text-slate-700">
              {event.description}
            </p>

            <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("date")}
                </p>
                <p className="mt-2 font-medium text-slate-900">{event.date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("time")}
                </p>
                <p className="mt-2 font-medium text-slate-900">{event.time}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {t("location")}
                </p>
                <p className="mt-2 font-medium text-slate-900">
                  {event.location}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("hostedBy")}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {event.organizer}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("city")}
              </p>
              <p className="mt-2 text-lg font-medium text-slate-900">
                {event.city}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {t("eventVibe")}
              </p>
              <p className="mt-2 text-sm text-slate-700">{event.tag}</p>
            </div>

            <div className="space-y-3">
              <button className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700">
                {t("saveThisEvent")}
              </button>
              <button
                type="button"
                onClick={handleSendEventAlert}
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t("sendEventAlert")}
              </button>
              <EventNotificationToggle event={event} />
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
