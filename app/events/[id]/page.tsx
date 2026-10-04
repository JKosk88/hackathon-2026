"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";

import { EventNotificationToggle } from "@/app/components/NotificationCenter";
import { useLanguage } from "@/app/components/LanguageProvider";
import { mapBackendEventToEventItem, type EventItem } from "@/app/data/events";
import { getEventById } from "@/lib/events";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setEvent(null);

    getEventById(params.id)
      .then((backendEvent) => {
        if (!isMounted) {
          return;
        }

        setEvent(
          backendEvent ? mapBackendEventToEventItem(backendEvent) : null,
        );
      })
      .catch(() => {
        if (isMounted) {
          setEvent(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-5 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
        <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="h-72 w-full bg-slate-100 dark:bg-slate-800" />
          <div className="grid gap-8 p-8 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-4">
              <div className="h-6 w-40 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-12 w-3/4 rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </article>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Link
        href="/events"
        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← {t("backToAllEvents")}
      </Link>

      <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="relative h-72 w-full overflow-hidden">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: event.accent }}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.18))]" />
        </div>

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
              {event.url ? (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
                >
                  {t("visitEventWebsite")}
                </a>
              ) : null}
              <button className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700">
                {t("saveThisEvent")}
              </button>
              <EventNotificationToggle event={event} />
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
