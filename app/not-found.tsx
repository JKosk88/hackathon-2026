"use client";

import Link from "next/link";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">404</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        {t("eventNotFound")}
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        {t("eventNotFoundDescription")}
      </p>
      <Link
        href="/events"
        className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white"
      >
        {t("browseEvents")}
      </Link>
    </div>
  );
}
