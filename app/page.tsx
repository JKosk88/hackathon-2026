"use client";

import Link from "next/link";

import { EventCard } from "@/app/components/EventCard";
import { useLanguage } from "@/app/components/LanguageProvider";
import { events } from "@/app/data/events";

export default function HomePage() {
  const { t } = useLanguage();
  const newestEvents = events.slice(0, 3);
  const featuredEvent = newestEvents[0];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/75 dark:shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),transparent_30%)]" />

        <div className="relative grid gap-10 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-10 lg:px-12 lg:py-12">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              {t("localExperiences")}
            </span>

            <div className="space-y-4">
              <h1 className="max-w-lg text-4xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl dark:text-white">
                {t("discoverHeadline")}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                {t("discoverText")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/events"
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-700"
              >
                {t("browseEvents")}
              </Link>
              <Link
                href="/post"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t("hostEvent")}
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] dark:border-slate-700 dark:bg-slate-900">
            <div className="rounded-[24px] bg-gradient-to-br from-amber-300 via-pink-500 to-violet-600 p-5 text-slate-900 shadow-inner">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-900/80">
                {t("newThisWeek")}
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em]">
                {featuredEvent?.title ?? "Featured event"}
              </h2>
              <p className="mt-3 text-sm font-medium text-slate-900/85">
                {featuredEvent
                  ? `${featuredEvent.city} • ${featuredEvent.location} • ${featuredEvent.time}`
                  : "City • Venue • Time"}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {t("upcoming")}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">1</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {t("nearby")}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">4.8 km</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">
            {t("newOnCityVibe")}
          </h2>
          <Link
            href="/events"
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
          >
            {t("seeAll")}
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {newestEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
