"use client";

import { useLanguage } from "@/app/components/LanguageProvider";

export default function PostEventPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          {t("host")}
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">
          {t("postLocalEvent")}
        </h1>
      </div>

      <form className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("eventName")}
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:bg-slate-800"
              placeholder={t("eventNamePlaceholder")}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("category")}
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-800">
              <option>{t("music")}</option>
              <option>{t("food")}</option>
              <option>{t("art")}</option>
              <option>{t("wellness")}</option>
              <option>{t("outdoors")}</option>
              <option>{t("nightlife")}</option>
            </select>
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("date")}
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-800"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("time")}
            <input
              type="time"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-800"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("location")}
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:bg-slate-800"
            placeholder={t("locationPlaceholder")}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("description")}
          <textarea
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:bg-slate-800"
            placeholder={t("descriptionPlaceholder")}
          />
        </label>

        <button
          type="submit"
          className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {t("submitEvent")}
        </button>
      </form>
    </div>
  );
}
