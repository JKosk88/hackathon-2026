"use client";

import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/app/components/AuthProvider";
import { useLanguage } from "@/app/components/LanguageProvider";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { NotificationCenter } from "@/app/components/NotificationCenter";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useTheme, type ThemeMode } from "@/app/components/ThemeProvider";

export function AppHeader() {
  const { t } = useLanguage();
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/events", label: t("events") },
    { href: "/favorites", label: t("favorites") },
    { href: "/post", label: t("post") },
  ];

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden bg-transparent">
            <img
              src="/ct vab.png"
              alt="CityVibe"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-none">
            <div className="text-sm font-black tracking-tight text-slate-900 sm:text-base dark:text-white">
              CityVibe
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Live&nbsp;Local
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-sm font-medium text-slate-600 shadow-sm md:flex dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <NotificationCenter />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">
                Hi, {user.name}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {t("login")}
            </Link>
          )}
        </div>

        <div className="relative md:hidden">
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label="Open navigation menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="h-5 w-5"
            >
              {isMobileMenuOpen ? (
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 6H16M4 10H16M4 14H16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>

          {isMobileMenuOpen ? (
            <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950">
              <nav className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {t("notifications")}
                  </div>
                  <NotificationCenter />
                </div>

                <div className="grid gap-1.5">
                  <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(event.target.value as "en" | "pl")
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
                  >
                    <option value="en">English</option>
                    <option value="pl">Polski</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(event) =>
                      setTheme(event.target.value as ThemeMode)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
                  >
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {user ? (
                  <div className="grid gap-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      Hi, {user.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {t("login")}
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
