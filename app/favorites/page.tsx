"use client";

import Link from "next/link";

import { EventCard } from "@/app/components/EventCard";
import { useLanguage } from "@/app/components/LanguageProvider";
import { events } from "@/app/data/events";

export default function FavoritesPage() {
  const { t } = useLanguage();
  const savedEvents = events.slice(0, 2);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-emerald-500 p-8 text-white">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">
          {t("saved")}
        </p>
        <h1 className="mt-2 text-4xl font-bold">{t("favoriteLocalPicks")}</h1>
      </section>

      {savedEvents.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2">
          {savedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-medium text-slate-800">
            {t("noFavorites")}
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            {t("exploreEvents")}
          </Link>
        </div>
      )}
    </div>
  );
}
