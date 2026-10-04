"use client";

import Link from "next/link";

import { EventNotificationToggle } from "@/app/components/NotificationCenter";
import { useLanguage } from "@/app/components/LanguageProvider";
import type { EventItem } from "@/app/data/events";

export function EventCard({ event }: { event: EventItem }) {
  const { t } = useLanguage();

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_18px_50px_rgba(2,6,23,0.45)]">
      <div className="relative h-40 overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ background: event.accent }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.18))]" />
        <div className="relative flex h-full items-start justify-between p-4">
          <span className="whitespace-nowrap rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            {event.category}
          </span>
          <span className="whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
            {event.price}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div>
          <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
            {event.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {event.summary}
          </p>
        </div>

        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            {event.date} • {event.time}
          </p>
          <p>{event.location}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {event.city}
          </span>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <EventNotificationToggle event={event} />
            <Link
              href={`/events/${event.id}`}
              className="whitespace-nowrap rounded-full bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition-all duration-200 hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {t("viewDetails")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
